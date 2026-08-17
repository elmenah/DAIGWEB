-- ════════════════════════════════════════════════
-- Portal Trabajadores — Setup Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════

-- 1. Tabla de registros de trabajo
create table if not exists registros_trabajo (
  id            uuid primary key default gen_random_uuid(),
  trabajador_id uuid references auth.users(id) on delete cascade,
  trabajador_nombre text,
  fecha         date not null,
  hora          time not null,
  tarea         text not null,
  descripcion   text,
  ubicacion_texto text,
  ubicacion_lat numeric(10, 7),
  ubicacion_lng numeric(10, 7),
  fotos         text[] default '{}',
  created_at    timestamptz default now()
);

-- 2. RLS: cada trabajador solo ve sus propios registros
alter table registros_trabajo enable row level security;

create policy "trabajador_insert_own"
  on registros_trabajo for insert
  with check (auth.uid() = trabajador_id);

create policy "trabajador_select_own"
  on registros_trabajo for select
  using (auth.uid() = trabajador_id);

-- Los admins ven todo (necesitas tener la tabla profiles con role)
create policy "admin_select_all"
  on registros_trabajo for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 3. Storage bucket para fotos
-- En Supabase Dashboard → Storage → New bucket
-- Nombre: registros-fotos
-- Public: true (o false si quieres URLs firmadas)

-- Si prefieres crearlo por SQL:
insert into storage.buckets (id, name, public)
values ('registros-fotos', 'registros-fotos', true)
on conflict (id) do nothing;

-- RLS storage: trabajador sube solo a su carpeta (id de usuario)
create policy "trabajador_upload_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'registros-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public_read_fotos"
  on storage.objects for select
  using (bucket_id = 'registros-fotos');

-- ════════════════════════════════════════════════
-- Crear un trabajador de ejemplo
-- ════════════════════════════════════════════════
-- En Supabase Dashboard → Authentication → Users → Add user:
--   Email: 123456789@daig-trabajador.internal
--   Password: (clave que elijas)
--
-- Luego en SQL Editor, obtén el UUID del usuario recién creado
-- y ejecuta:
--
-- insert into profiles (id, username, full_name, role)
-- values (
--   '<UUID-del-usuario>',
--   '123456789',          -- RUT sin puntos ni guión (lo que usarán para login)
--   'Juan Pérez',         -- Nombre completo
--   'trabajador'          -- Rol
-- );
