-- ════════════════════════════════════════════════════════════════
-- Permite que el ADMIN actualice registros_trabajo.
-- Necesario para: persistir la conversión de fotos HEIC->JPG, guardar
-- comentarios del supervisor y marcar como revisado.
-- Sin esto, el UPDATE no da error pero afecta 0 filas (RLS lo bloquea).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

drop policy if exists "admin_update_registros" on public.registros_trabajo;
create policy "admin_update_registros"
  on public.registros_trabajo for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Verificación (debe aparecer una fila con cmd = UPDATE)
select policyname, cmd
from pg_policies
where tablename = 'registros_trabajo' and policyname = 'admin_update_registros';
