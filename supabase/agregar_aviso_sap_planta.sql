-- ════════════════════════════════════════════════════════════════
-- Agrega los campos "Aviso SAP" y "Planta / lugar de trabajo"
-- a los registros de trabajo del portal /trabajadores.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- aviso_sap se guarda como texto (aunque sea numérico) para conservar
-- ceros a la izquierda y no tener límite de tamaño.
alter table public.registros_trabajo
  add column if not exists aviso_sap text,
  add column if not exists planta    text;

-- Verificación de columnas
select column_name, data_type
from information_schema.columns
where table_name = 'registros_trabajo'
  and column_name in ('aviso_sap', 'planta');


-- ─────────────────────────────────────────────────────────────────
-- Permitir que el trabajador EDITE sus propios registros
-- (necesario para agregar el Aviso SAP a registros ya realizados).
-- Seguro de correr aunque la política ya exista.
-- ─────────────────────────────────────────────────────────────────
drop policy if exists "trabajador_update_own" on public.registros_trabajo;
create policy "trabajador_update_own"
  on public.registros_trabajo for update
  using (auth.uid() = trabajador_id)
  with check (auth.uid() = trabajador_id);

-- Ver las políticas resultantes de la tabla
select policyname, cmd
from pg_policies
where tablename = 'registros_trabajo'
order by cmd;
