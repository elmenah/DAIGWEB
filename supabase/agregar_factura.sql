-- Ejecutar antes de publicar el formulario con facturas.
-- Guarda una ruta privada, nunca una URL pública ni una URL firmada temporal.
begin;
alter table public.registros_trabajo add column if not exists factura_path text;

-- El formulario permite reemplazar/quitar la factura de un registro propio.
drop policy if exists "trabajador_update_own" on public.registros_trabajo;
create policy "trabajador_update_own" on public.registros_trabajo for update to authenticated
using (auth.uid() = trabajador_id)
with check (auth.uid() = trabajador_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('registros-facturas', 'registros-facturas', false, 15728640,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "factura_subir_propia" on storage.objects;
create policy "factura_subir_propia" on storage.objects for insert to authenticated
with check (bucket_id = 'registros-facturas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "factura_leer_autorizada" on storage.objects;
create policy "factura_leer_autorizada" on storage.objects for select to authenticated
using (bucket_id = 'registros-facturas' and (
  (storage.foldername(name))[1] = auth.uid()::text
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'directiva'))
));
commit;

-- No cambia el bucket de fotos existente. Verificar en producción que ningún
-- otro policy permisivo permita leer/escribir registros ajenos.
