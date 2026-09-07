-- ════════════════════════════════════════════════════════════════
-- Diagnóstico de seguridad (RLS). NO modifica nada: solo lista el
-- estado actual para revisarlo. Ejecuta cada bloque y comparte el
-- resultado para evaluar si falta cerrar algún acceso.
-- Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1) ¿Qué tablas de 'public' tienen RLS activado?
--    (rowsecurity = false es una alerta: tabla sin protección)
select relname as tabla, relrowsecurity as rls_activo
from pg_class
where relkind = 'r'
  and relnamespace = 'public'::regnamespace
order by relrowsecurity, relname;

-- 2) Todas las políticas de las tablas del negocio
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'registros_trabajo', 'profiles', 'adv_permisos', 'adv_profiles', 'gallery_items'
  )
order by tablename, cmd;

-- 3) Políticas del storage (buckets de fotos)
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;

-- 4) ¿Los buckets son públicos o privados?
select id, name, public from storage.buckets order by id;

-- 5) Chequeo rápido: tablas del negocio SIN ninguna política
--    (si RLS está activo y no hay políticas, nadie puede leer/escribir;
--     si RLS está inactivo, cualquiera con la anon key puede todo)
select c.relname as tabla,
       c.relrowsecurity as rls_activo,
       count(p.policyname) as n_politicas
from pg_class c
left join pg_policies p
  on p.schemaname = 'public' and p.tablename = c.relname
where c.relkind = 'r' and c.relnamespace = 'public'::regnamespace
group by c.relname, c.relrowsecurity
order by n_politicas asc, c.relname;
