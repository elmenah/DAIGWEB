-- ════════════════════════════════════════════════════════════════
-- Etapa 1 — Maestro de activos e instalaciones (contrato ADVA)
-- Listas cerradas que reemplazan el texto libre de planta/equipo.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. Instalaciones (lista cerrada)
create table if not exists public.instalaciones (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  localidad  text,
  estado     text not null default 'activa',   -- activa | inactiva
  created_at timestamptz default now()
);

-- 2. Activos (maestro de equipos)
create table if not exists public.activos (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text not null unique,                 -- ej. ADVA-EMILS-RJF-01
  instalacion_id      uuid references public.instalaciones(id) on delete set null,
  sistema             text,
  equipo              text,
  criticidad          text check (criticidad in ('A', 'B', 'C')),
  marca               text,
  modelo              text,
  potencia_kw         numeric,
  latitud             numeric(10, 7),
  longitud            numeric(10, 7),
  horas_operacion_dia numeric,
  estado              text not null default 'activo',        -- activo | de baja
  created_at          timestamptz default now()
);

create index if not exists idx_activos_instalacion on public.activos(instalacion_id);

-- 3. RLS: lectura para cualquier usuario autenticado; escritura solo admin/directiva
alter table public.instalaciones enable row level security;
alter table public.activos       enable row level security;

-- Helper inline: ¿el usuario es admin o directiva?
-- (se repite en cada política para no depender de una función)

-- ── Instalaciones ──
create policy "instalaciones_select_auth"
  on public.instalaciones for select to authenticated using (true);
create policy "instalaciones_admin_insert"
  on public.instalaciones for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));
create policy "instalaciones_admin_update"
  on public.instalaciones for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));
create policy "instalaciones_admin_delete"
  on public.instalaciones for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));

-- ── Activos ──
create policy "activos_select_auth"
  on public.activos for select to authenticated using (true);
create policy "activos_admin_insert"
  on public.activos for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));
create policy "activos_admin_update"
  on public.activos for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));
create policy "activos_admin_delete"
  on public.activos for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));

-- 4. Refresca la caché de columnas de la API
notify pgrst, 'reload schema';
