-- C-02 leads-data-model — migración 001 (dashboard-first, transaccional).
-- Aplicación: el USUARIO pega este archivo en Supabase Dashboard → SQL Editor → Run.
-- El agente NUNCA aplica SQL contra la DB remota (runbook: supabase/APLICAR_C02.md).
-- Convención: supabase/migrations/YYYYMMDDHHMMSS_nombre.sql (ver migrations/README.md).
-- Reversible pre-deploy: ver bloque de reversa en supabase/APLICAR_C02.md.

BEGIN;

-- Extensión para email case-insensitive (RN-LEAD-05).
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Tabla: posibles_clientes (única fuente de leads, RN-LEAD-04 sin exportación)
-- PK BIGINT GENERATED ALWAYS AS IDENTITY (manda KB 04; CHANGES.md UUID=STALE).
-- ---------------------------------------------------------------------------
CREATE TABLE public.posibles_clientes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email CITEXT NOT NULL,
  acepta_politicas BOOLEAN NOT NULL DEFAULT false,
  politicas_version TEXT,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT posibles_clientes_nombre_apellido_check
    CHECK (nombre <> '' AND apellido <> ''),
  -- Sin consentimiento no hay INSERT válido. DEFAULT false es intencional:
  -- obliga a declarar acepta_politicas = true explícito (C-04 lo escribe).
  CONSTRAINT posibles_clientes_consentimiento_check
    CHECK (acepta_politicas = true)
);

-- Unicidad case-insensitive (RN-LEAD-05): índice único sobre expresión.
-- (Postgres no admite UNIQUE sobre expresión como table constraint.)
CREATE UNIQUE INDEX posibles_clientes_email_lower_uniq
  ON public.posibles_clientes (lower(email::text));

-- Ordenado/paginado del panel C-05 (created_at DESC).
CREATE INDEX posibles_clientes_created_at_desc_idx
  ON public.posibles_clientes (created_at DESC);

-- ---------------------------------------------------------------------------
-- Tabla: perfiles (ÚNICA fuente de roles — DD-09; nunca user_metadata).
-- ---------------------------------------------------------------------------
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS (habilitado en ambas; la Data API evalúa grants antes que RLS).
-- ---------------------------------------------------------------------------
ALTER TABLE public.posibles_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- INSERT público con consentimiento (único camino de escritura; C-04 vía Server Action).
-- TO-clause explícito (auth.role() deprecado); sin referencias a user_metadata.
CREATE POLICY posibles_clientes_insert_public
  ON public.posibles_clientes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (acepta_politicas = true);

-- SELECT solo admin/superadmin según perfiles (uid envuelto en subselect: early-exit en anon).
CREATE POLICY posibles_clientes_select_admin
  ON public.posibles_clientes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles
      WHERE perfiles.id = (select auth.uid())
        AND perfiles.role IN ('admin', 'superadmin')
    )
  );

-- Sin policies UPDATE/DELETE en posibles_clientes → denegado por defecto con RLS.

-- Self-read en perfiles (permite resolver el rol sin recursión; sin admin-read-all
-- auto-referenciado). Gestión fuera del modelo público vía service_role (bypass RLS).
CREATE POLICY perfiles_select_own
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Grants explícitos Data API (sin esto el fallo parece RLS cuando es permiso).
-- ---------------------------------------------------------------------------
GRANT INSERT ON public.posibles_clientes TO anon, authenticated;
GRANT SELECT ON public.posibles_clientes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.posibles_clientes_id_seq TO anon, authenticated;
GRANT SELECT ON public.perfiles TO authenticated;

-- ---------------------------------------------------------------------------
-- Comentarios (trazabilidad para futuros agentes).
-- ---------------------------------------------------------------------------
COMMENT ON TABLE public.posibles_clientes IS
  'Leads de Instancia 1 (C-02). Sin exportación (RN-LEAD-04). Consentimiento auditable por fila.';
COMMENT ON COLUMN public.posibles_clientes.email IS
  'CITEXT + índice único lower(email::text): unicidad case-insensitive (RN-LEAD-05).';
COMMENT ON COLUMN public.posibles_clientes.acepta_politicas IS
  'CHECK (acepta_politicas = true) + DEFAULT false intencional: sin consentimiento explícito no hay INSERT válido. C-04 escribe true + politicas_version/consent_at.';
COMMENT ON COLUMN public.posibles_clientes.politicas_version IS
  'Versión del texto legal aceptado (ej. v1.0). La escribe C-04 por inserto; el texto vive en /politicas (C-04).';
COMMENT ON TABLE public.perfiles IS
  'ÚNICA fuente de roles (DD-09). Nunca auth.users.user_metadata (user-editable + JWT stale).';
COMMENT ON COLUMN public.perfiles.role IS
  'admin | superadmin. Alta manual del primer admin según runbook supabase/APLICAR_C02.md.';

COMMIT;
