-- ════════════════════════════════════════════════════════════════
-- Etapa 1 — Semana 2: vincular el registro de trabajo a un activo del maestro.
-- Agrega activo_id (FK) a registros_trabajo. El texto libre (planta/equipo)
-- se conserva para compatibilidad y para equipos aún no catalogados.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

alter table public.registros_trabajo
  add column if not exists activo_id uuid references public.activos(id) on delete set null;

create index if not exists idx_registros_activo on public.registros_trabajo(activo_id);

-- Refresca la caché de columnas de la API
notify pgrst, 'reload schema';
