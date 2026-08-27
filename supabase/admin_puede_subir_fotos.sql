-- ════════════════════════════════════════════════════════════════
-- Permite que el ADMIN suba/actualice archivos en el bucket
-- 'registros-fotos'. Necesario para la auto-sanación de fotos HEIC:
-- cuando el admin ve un registro con fotos HEIC, el panel las convierte
-- a JPG, las sube y repunta la URL en la base (para no reconvertir nunca más).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

drop policy if exists "admin_upload_registros_fotos" on storage.objects;
create policy "admin_upload_registros_fotos"
  on storage.objects for insert
  with check (
    bucket_id = 'registros-fotos'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "admin_update_registros_fotos" on storage.objects;
create policy "admin_update_registros_fotos"
  on storage.objects for update
  using (
    bucket_id = 'registros-fotos'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Verificación
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'admin_%_registros_fotos';
