-- ════════════════════════════════════════════════════════════════
-- Pedido de terreno:
--   • Registro: fecha de inicio y fecha de término del trabajo
--     (un trabajo puede durar varios días).
--   • OT: número de trabajadores que participaron en la orden
--     (dotación, insumo para horas-hombre / costo).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- Registro de trabajo
alter table public.registros_trabajo
  add column if not exists fecha_inicio_trabajo  date,
  add column if not exists fecha_termino_trabajo date;

-- Orden de trabajo
alter table public.ot
  add column if not exists n_trabajadores integer;

-- Refresca la caché de columnas de la API
notify pgrst, 'reload schema';

-- Verificación
select column_name, data_type
from information_schema.columns
where (table_name = 'registros_trabajo' and column_name in ('fecha_inicio_trabajo','fecha_termino_trabajo'))
   or (table_name = 'ot' and column_name = 'n_trabajadores')
order by table_name, column_name;
