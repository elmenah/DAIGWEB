-- ════════════════════════════════════════════════════════════════
-- Agrega el campo "OT (Orden de Trabajo)" a los registros de trabajo.
-- Se guarda como texto (los códigos de OT pueden tener letras y guiones).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

alter table public.registros_trabajo
  add column if not exists ot text;

-- Verificación
select column_name, data_type
from information_schema.columns
where table_name = 'registros_trabajo' and column_name = 'ot';
