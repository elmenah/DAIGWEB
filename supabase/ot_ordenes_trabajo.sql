-- ════════════════════════════════════════════════════════════════
-- Etapa 1 — Órdenes de Trabajo (OT) separadas del registro
-- Contrato ADVA · Gestión de activos y tiempos
--
-- Una OT agrupa 1..N registros de trabajo. Guarda los campos de tiempo
-- (aviso, llegada, inicio, término, puesta en marcha) que alimentan el
-- cálculo de disponibilidad, MTBF y MTTR.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. Tabla de órdenes de trabajo
create table if not exists public.ot (
  id                 uuid primary key default gen_random_uuid(),
  numero             text unique,                 -- autogenerado: OT-2026-0001
  activo_id          uuid references public.activos(id) on delete set null,
  aviso_sap          text unique,                 -- único: no se repite entre OT
  tipo               text not null default 'correctiva'
                       check (tipo in ('correctiva', 'preventiva', 'predictiva', 'mejora')),
  prioridad          text not null default 'media'
                       check (prioridad in ('alta', 'media', 'baja')),
  estado             text not null default 'abierta'
                       check (estado in ('abierta', 'en_proceso', 'cerrada', 'anulada')),
  descripcion        text,

  -- Campos de tiempo (materia prima de los indicadores)
  fecha_aviso        timestamptz,                 -- cuando se reporta la falla / se genera la OT
  fecha_llegada      timestamptz,                 -- llegada del técnico a terreno
  fecha_inicio       timestamptz,                 -- inicio de la intervención
  fecha_termino      timestamptz,                 -- término de la intervención
  fecha_puesta_marcha timestamptz,                -- equipo nuevamente operativo
  equipo_detenido    boolean not null default false,  -- ¿el activo quedó/estuvo detenido?

  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz default now()
);

create index if not exists idx_ot_activo  on public.ot(activo_id);
create index if not exists idx_ot_estado  on public.ot(estado);
create index if not exists idx_ot_numero  on public.ot(numero);

-- 2. Numeración automática OT-<año>-<correlativo 4 dígitos>, atómica y por año
create table if not exists public.ot_correlativo (
  anio   int primary key,
  ultimo int not null default 0
);

create or replace function public.set_ot_numero()
returns trigger
language plpgsql
as $$
declare
  y int := extract(year from now());
  n int;
begin
  if new.numero is null or new.numero = '' then
    insert into public.ot_correlativo (anio, ultimo)
      values (y, 1)
    on conflict (anio)
      do update set ultimo = public.ot_correlativo.ultimo + 1
    returning ultimo into n;
    new.numero := 'OT-' || y::text || '-' || lpad(n::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_ot_numero on public.ot;
create trigger trg_set_ot_numero
  before insert on public.ot
  for each row execute function public.set_ot_numero();

-- 3. Enlace registro → OT (1 OT agrupa varios registros)
alter table public.registros_trabajo
  add column if not exists ot_id uuid references public.ot(id) on delete set null;
create index if not exists idx_registros_ot on public.registros_trabajo(ot_id);

-- 4. RLS
alter table public.ot enable row level security;

-- Lectura: cualquier usuario autenticado (el técnico necesita ver las OT abiertas)
drop policy if exists "ot_select_auth" on public.ot;
create policy "ot_select_auth"
  on public.ot for select to authenticated using (true);

-- Escritura: admin / directiva / supervisor gestionan las OT
drop policy if exists "ot_admin_insert" on public.ot;
create policy "ot_admin_insert"
  on public.ot for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva', 'supervisor')));
drop policy if exists "ot_admin_update" on public.ot;
create policy "ot_admin_update"
  on public.ot for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva', 'supervisor')));
drop policy if exists "ot_admin_delete" on public.ot;
create policy "ot_admin_delete"
  on public.ot for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'directiva')));

-- La tabla de correlativos solo la toca el trigger (security definer implícito del owner);
-- no se expone por API, así que no requiere políticas de cliente.
alter table public.ot_correlativo enable row level security;

-- 5. Refresca la caché de columnas de la API
notify pgrst, 'reload schema';

-- ── Verificación rápida ──
-- insert into public.ot (tipo, prioridad, descripcion) values ('correctiva','alta','Prueba');
-- select numero, tipo, estado from public.ot order by created_at desc limit 3;
