-- ════════════════════════════════════════════════════════════════
-- Unificación de autenticación: adv_profiles  ->  profiles
-- Objetivo: un solo sistema de login (RUT o correo) para todos los
--           portales (admin, trabajadores y permisos).
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- IMPORTANTE: haz un respaldo antes (Database -> Backups) y ejecuta
--             por bloques, revisando el resultado de cada paso.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- PASO 0 · Ampliar el CHECK constraint de profiles.role  (OBLIGATORIO)
-- 'profiles.role' tiene un constraint que solo permite los roles
-- originales. Hay que incluir los roles del módulo de permisos
-- (supervisor, seguridad, solicitante) o el Paso 2 fallará con:
--   ERROR: new row ... violates check constraint "profiles_role_check"
--
-- 0.1 · Primero confirma TODOS los roles que existen en adv_profiles:
--
--   select distinct role from public.adv_profiles order by role;
--
-- 0.2 · Recrea el constraint incluyendo esos roles (agrega los que
--       aparezcan en 0.1 si faltara alguno):
alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (role in (
    'admin', 'directiva', 'tecnico', 'trabajador',
    'supervisor', 'seguridad', 'solicitante'
  ));
-- ─────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────
-- PASO 1 · Revisar qué usuarios se van a migrar (no modifica nada)
-- ─────────────────────────────────────────────────────────────────
select
  a.id,
  a.role                     as rol_permisos,
  a.nombre,
  u.email,
  (p.id is not null)         as ya_existe_en_profiles,
  p.role                     as rol_actual_en_profiles
from public.adv_profiles a
join auth.users u on u.id = a.id
left join public.profiles p on p.id = a.id
order by ya_existe_en_profiles, a.role;


-- ─────────────────────────────────────────────────────────────────
-- PASO 2 · Migrar adv_profiles -> profiles
-- - Usuarios nuevos: se insertan con su rol (supervisor/seguridad/admin).
-- - Usuarios que ya existen: se actualiza el rol SALVO que ya sean 'admin'
--   (para no degradar a un administrador por accidente).
-- - username = correo (los supervisores entran con correo; el login por
--   RUT sigue disponible si luego les cargas su RUT en 'username').
-- ─────────────────────────────────────────────────────────────────
insert into public.profiles (id, username, nombre, email, role)
select
  a.id,
  lower(u.email)                as username,
  coalesce(a.nombre, u.email)   as nombre,
  u.email                       as email,
  a.role                        as role
from public.adv_profiles a
join auth.users u on u.id = a.id
on conflict (id) do update
  set role   = case when public.profiles.role = 'admin'
                    then 'admin'
                    else excluded.role end,
      email  = coalesce(public.profiles.email,  excluded.email),
      nombre = coalesce(public.profiles.nombre, excluded.nombre);


-- ─────────────────────────────────────────────────────────────────
-- PASO 3 · Verificar la migración
-- ─────────────────────────────────────────────────────────────────
select id, username, nombre, email, role
from public.profiles
where role in ('supervisor', 'seguridad')
order by role, nombre;


-- ─────────────────────────────────────────────────────────────────
-- PASO 4 · RLS de adv_permisos  (necesario solo antes de dropear
--          adv_profiles, o para crear supervisores solo en profiles)
--
-- Las políticas actuales de adv_permisos dependen de adv_profiles por
-- dos vías:
--   a) La función adv_my_role()  -> usada por 'adv_revisores_ven_todos'
--      y 'revisores pueden firmar'.
--   b) EXISTS sobre adv_profiles -> en 'adv_supervisor_ve_todos' y
--      'adv_supervisor_actualiza_estado'.
--   (Las 'adv_solicitante_*' usan solicitante_id = auth.uid() y NO se
--    tocan.)
--
-- 4.0 · (Opcional) Buscar TODAS las políticas de la base que aún
--       referencian adv_profiles, para no dejar ninguna fuera:
--
--   select schemaname, tablename, policyname, qual, with_check
--   from pg_policies
--   where qual ilike '%adv_profiles%' or with_check ilike '%adv_profiles%';

-- 4.1 · Redefinir adv_my_role() para que lea desde profiles.
--       Esto migra de una sola vez todas las políticas que la usan.
create or replace function public.adv_my_role()
  returns text
  language sql
  security definer
  set search_path = public
  stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 4.2 · Reescribir las dos políticas que consultan adv_profiles directo,
--       apuntándolas a profiles (misma lógica, otra tabla).
drop policy if exists "adv_supervisor_ve_todos" on public.adv_permisos;
create policy "adv_supervisor_ve_todos"
  on public.adv_permisos for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'seguridad', 'admin')
    )
  );

drop policy if exists "adv_supervisor_actualiza_estado" on public.adv_permisos;
create policy "adv_supervisor_actualiza_estado"
  on public.adv_permisos for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('supervisor', 'seguridad', 'admin')
    )
  );

-- 4.3 · Verificar que ya no quede ninguna referencia a adv_profiles:
--   select policyname, qual, with_check from pg_policies
--   where tablename = 'adv_permisos';
--   (repite también el query 4.0 — debe volver vacío)
-- ─────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────
-- PASO 5 · (Opcional) Retirar adv_profiles
-- Hazlo SOLO después de verificar en producción que todo el módulo de
-- permisos funciona con profiles. Deja la tabla como respaldo un tiempo.
--
--   -- drop table public.adv_profiles;
-- ─────────────────────────────────────────────────────────────────
