-- ════════════════════════════════════════════════
-- Mantención de Camiones — Setup Supabase
-- Rol nuevo: mantenedor_camiones
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════

-- 1. Tabla de registros de mantención de camiones
create table if not exists mantencion_camiones (
  id                uuid primary key default gen_random_uuid(),
  mantenedor_id     uuid references auth.users(id) on delete cascade,
  mantenedor_nombre text,
  ot_numero         text,                       -- N° de OT (ingresado a mano)
  patente           text,
  taller            text,
  equipo            text,
  mantencion_desde  date,                        -- "Mantención realizada" (desde)
  mantencion_hasta  date,                        -- "Mantención realizada" (hasta)
  horometro         numeric,
  tareas            jsonb default '[]'::jsonb,   -- lista de tareas realizadas
  fotos             text[] default '{}',
  firma             text,                        -- firma del mantenedor (data URL)
  hora_termino      timestamptz,                 -- capturada al firmar el trabajo
  created_at        timestamptz default now()
);

-- 2. RLS: cada mantenedor ve y edita solo lo suyo; admin/directiva ven y editan todo
alter table mantencion_camiones enable row level security;

create policy "camiones_insert_own"
  on mantencion_camiones for insert
  with check (auth.uid() = mantenedor_id);

create policy "camiones_select_own"
  on mantencion_camiones for select
  using (auth.uid() = mantenedor_id);

create policy "camiones_update_own"
  on mantencion_camiones for update
  using (auth.uid() = mantenedor_id);

create policy "camiones_admin_select_all"
  on mantencion_camiones for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'directiva')
    )
  );

create policy "camiones_admin_update_all"
  on mantencion_camiones for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'directiva')
    )
  );

create policy "camiones_admin_delete_all"
  on mantencion_camiones for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 3. Storage: se reutiliza el bucket existente "registros-fotos".
--    La política "trabajador_upload_own_folder" ya permite que cualquier usuario
--    autenticado suba a su propia carpeta (auth.uid()), así que no se requiere
--    configuración adicional de storage para el mantenedor de camiones.

-- 4. Refresca la caché de columnas que utiliza la API de Supabase.
notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════
-- Crear un mantenedor de camiones
-- ════════════════════════════════════════════════
-- Opción recomendada: crearlo desde el panel de administración
-- (Usuarios → Nuevo usuario → Rol "Mantenedor camiones").
--
-- Manualmente:
-- 1) Authentication → Users → Add user  (email: <rut>@daig.local)
-- 2) SQL Editor:
-- insert into profiles (id, username, nombre, email, role)
-- values (
--   '<UUID-del-usuario>',
--   '123456789',               -- RUT sin puntos ni guión (login)
--   'Nombre del Mantenedor',
--   '123456789@daig.local',
--   'mantenedor_camiones'
-- );
