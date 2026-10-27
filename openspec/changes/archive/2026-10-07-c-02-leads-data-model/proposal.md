# Proposal — C-02 leads-data-model

> Display name `C-02` (roadmap) = directory `c-02-leads-data-model` (openspec exige kebab-case minúsculas).

## Why

Sin tabla `posibles_clientes` ni fuente de roles decidida no hay captura (C-04), ni login con rol (C-03), ni panel /admin (C-05). Este change crea la base de datos de Instancia 1 — una migración versionada aplicada por el usuario en el dashboard Supabase — y cierra la pregunta abierta de roles antes de que C-03 la consuma.

## What Changes

- Migración `001` versionada en `supabase/migrations/YYYYMMDDHHMMSS_posibles_clientes_y_perfiles.sql` (usuario la aplica pegando SQL en el dashboard Supabase; runbook corto + queries de verificación incluidos):
  - `posibles_clientes`: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`, `nombre/apellido TEXT NOT NULL`, `email CITEXT NOT NULL`, `acepta_politicas BOOLEAN NOT NULL DEFAULT false`, `politicas_version TEXT`, `consent_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` + `CHECK (nombre <> '' AND apellido <> '')` + constraint de consentimiento (sin `acepta_politicas = true` no hay INSERT válido) + índice único `lower(email)` (case-insensitive, RN-LEAD-05) + índice `created_at DESC`.
  - Extensión `citext` habilitada en la migración (`CREATE EXTENSION IF NOT EXISTS citext;`).
  - `perfiles`: `id UUID PK → auth.users ON DELETE CASCADE`, `role TEXT CHECK (admin|superadmin)`, `created_at` — **fuente de verdad de roles elegida en este change** (ver design; se documenta como entrada DD en `09_decisiones_y_supuestos.md`).
  - RLS habilitado en ambas tablas + policies mínimas: `posibles_clientes` → `INSERT` público (`anon` + `authenticated`, solo vía Server Action validada en C-04) con `WITH CHECK (acepta_politicas = true)`; `SELECT` solo `admin/superadmin` (según `perfiles`); sin `UPDATE/DELETE` público (denegado por defecto). `perfiles` → `SELECT` propia fila para `authenticated` (permite la resolución de rol en policies sin recursión); resto denegado por defecto, `service_role` bypass para gestión.
  - `GRANT`s explícitos Data API (`INSERT` a `anon`/`authenticated` en leads; `SELECT` a `authenticated`; `USAGE` en secuencia de identidad; `SELECT` en `perfiles` a `authenticated`) + `COMMENT ON` en tablas/columnas.
- Runbook `supabase/APLICAR_C02.md` (corto): pegar migración en dashboard → correr queries de verificación → prueba RLS (INSERT anónimo ok / duplicado case-insensitive rechazado / sin consentimiento rechazado / SELECT anónimo denegado / SELECT admin ok tras crear admin manual).
- Alta manual del admin inicial documentada paso a paso (crear usuario en Dashboard Auth + insertar fila en `perfiles`); sin credenciales inventadas en repo.
- Registro de consentimiento versionado (`politicas_version` ej. `v1.0` + `consent_at`) listo para que C-04 lo escriba; texto legal de `/politicas` NO es scope de este change.
- Contrato de validación compartido `leadSchema` (zod) en `lib/validaciones.ts` — **owned by C-02 como parte del contrato de datos** (R2 + KB `08` schemas compartidos front/back): `nombre`/`apellido` non-empty trimmed, `email` formato válido normalizado, `acepta_politicas` literal `true` (cubre RN-LEAD-01/02/05 a nivel app; la DB re-valida con CHECK/UNIQUE como última defensa). C-04 lo **importa**, no lo redefine.
- **Overrides decididos (prevalecen sobre CHANGES.md donde choquen, con trazabilidad aquí)**:
  1. PK `BIGINT GENERATED ALWAYS AS IDENTITY` — manda KB `04` editada por el usuario; la línea `id UUID … gen_random_uuid()` del scope C-02 en CHANGES.md queda STALE (corregir en archive time, no en este proposal).
  2. `UNIQUE (lower(email))` se implementa como índice único sobre expresión (`CREATE UNIQUE INDEX … (lower(email::text))`), no como constraint de columna — Postgres no admite UNIQUE sobre expresión como table constraint.
  3. El `CHECK (acepta_politicas = true)` vive en DB como constraint documentado; la validación UX la hace C-04 (checkbox obligatorio + zod). `DEFAULT false` es intencional: obliga a enviar `true` explícito.
- **NO incluye**: Server Action `registrarLead` / UI / `/politicas` (C-04 — C-04 importa `leadSchema` de este change, no lo redefine); middleware de sesión + login (C-03); tabla /admin ni filtros (C-05); leads seed persistentes (solo filas efímeras de prueba, documentadas y borradas); ninguna exportación (RN-LEAD-04); precios (R4, sin objeto aquí).

## Capabilities

### New Capabilities

- `leads-data-model`: tabla `posibles_clientes` + tabla `perfiles` + RLS + índices + grants + `leadSchema` (zod) compartido en `lib/validaciones.ts` + runbook de aplicación manual + alta manual de admin. Es el contrato de datos que C-03 (rol) y C-04 (INSERT vía `registrarLead` que importa el schema) consumen y C-05 (SELECT + filtros) lee.

### Modified Capabilities

- (vacío — `foundation-infra` no cambia requisitos; este change solo agrega su migración bajo las convenciones que C-01 dejó)

## Impact

- Afecta: `supabase/migrations/` (1 archivo nuevo), `supabase/APLICAR_C02.md` (nuevo), `lib/validaciones.ts` (`leadSchema` compartido, R2), `knowledge-base/09_decisiones_y_supuestos.md` (1 entrada DD: fuente de roles), `CHANGES.md` (corrección STALE anotada para archive time, sin editar ahora).
- Base de datos + contrato app: 1 migración DDL + RLS y 1 schema zod en `lib/` (único código Next.js del change; nada en `app/` ni `middleware.ts`); sin secretos nuevos (R3 intacto); sin queries desde Client Components (R1 intacto — el schema no hace queries, solo valida input para la Server Action de C-04).
- Dependencias: requiere C-01 archivado (convenciones + clientes `@supabase/ssr` ya existen). Desbloquea C-03 y C-04 en paralelo (GATE 2).
- Governance del change (roadmap): CRÍTICO. Reglas duras R1–R8, U1–U2 aplican; U2: la pregunta Alta "fuente de roles" se resuelve en este change (diseño), las Altas DNS/Resend quedan para C-05/C-09 y no bloquean.
