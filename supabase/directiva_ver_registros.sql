-- ════════════════════════════════════════════════════════════════
-- Permite que el rol "directiva" LEA todos los registros de trabajo.
-- Las secciones Registros, Mapa, Informes, Equipos y Mantenimiento del
-- panel leen la tabla registros_trabajo; sin esta política directiva las
-- veía vacías (la lectura total estaba dada solo para 'admin').
-- Es solo lectura: directiva NO puede editar, comentar ni marcar revisado.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

drop policy if exists "directiva_select_all" on public.registros_trabajo;
create policy "directiva_select_all"
  on public.registros_trabajo for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'directiva'
    )
  );

notify pgrst, 'reload schema';

-- Verificación: políticas de lectura de la tabla
select policyname, cmd
from pg_policies
where tablename = 'registros_trabajo' and cmd = 'SELECT'
order by policyname;
