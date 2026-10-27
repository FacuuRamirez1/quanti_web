-- C-02 leads-data-model — migración 002 correctiva (dashboard-first, transaccional).
-- Aplicación: el USUARIO pega este archivo en Supabase Dashboard → SQL Editor → Run,
-- DESPUÉS de la 001 (20261007191058_posibles_clientes_y_perfiles.sql).
-- El agente NUNCA aplica SQL contra la DB remota (runbook: supabase/APLICAR_C02.md).
-- Convención: supabase/migrations/YYYYMMDDHHMMSS_nombre.sql (ver migrations/README.md).
-- Contexto: el JWT legacy de service_role recibía 42501 en posibles_clientes y
-- perfiles. La 001 solo otorgó a anon/authenticated; nada a service_role y los
-- privilegios por defecto no cubrían estas tablas. Las policies RLS están probadas
-- (bloque B verde); esto solo repone el permiso a nivel de tabla/secuencia para
-- los accesos server-side con service_role (verificación admin, limpieza C, C-05).
-- Re-ejecutable sin riesgo: GRANT es idempotente (repetir no duplica ni falla).

BEGIN;

-- Acceso total server-side a leads para ops con service_role (bypass RLS).
GRANT ALL ON public.posibles_clientes TO service_role;

-- Acceso total server-side a perfiles (alta/verificación admin vía service_role).
GRANT ALL ON public.perfiles TO service_role;

-- La secuencia del IDENTITY de leads: sin USAGE+SELECT el INSERT vía service_role falla.
GRANT USAGE, SELECT ON SEQUENCE public.posibles_clientes_id_seq TO service_role;

COMMIT;
