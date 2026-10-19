-- ════════════════════════════════════════════════════════════════
-- Agrega la columna "direccion" a la tabla de activos.
-- La dirección escrita + el pin del mapa; lat/long se siguen guardando
-- (autollenadas por el mapa) para el mapa de activos y la alerta de GPS.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

alter table public.activos add column if not exists direccion text;

notify pgrst, 'reload schema';
