-- Ejecutar después de agregar_factura.sql y antes de publicar el nuevo formulario.
begin;
alter table public.registros_trabajo add column if not exists factura_paths text[];
update public.registros_trabajo
set factura_paths = case when factura_path is null then '{}'::text[] else array[factura_path] end
where factura_paths is null;
-- Se conserva factura_path para compatibilidad. El formulario nuevo mantiene
-- allí la primera imagen (o NULL cuando el usuario quita todas).
commit;
