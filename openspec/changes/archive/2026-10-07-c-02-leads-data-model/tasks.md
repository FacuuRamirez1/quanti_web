# Tasks — C-02 leads-data-model

> Convención: cada tarea trae su verificación en la descripción. El usuario aplica el SQL en el dashboard Supabase (el agente versiona archivos + runbook, no ejecuta writes remotos). Timestamps `YYYYMMDDHHMMSS` se fijan al crear el archivo.

## 1. Migración 001 versionada

- [x] 1.1 Crear `supabase/migrations/<timestamp>_posibles_clientes_y_perfiles.sql` transaccional (`BEGIN; … COMMIT;`) con `CREATE EXTENSION IF NOT EXISTS citext;`, `CREATE TABLE posibles_clientes` (BIGINT IDENTITY PK, nombre/apellido/email CITEXT, consentimiento, created_at, CHECK no-vacío + CHECK consentimiento, `COMMENT ON`), `CREATE TABLE perfiles` (UUID PK → auth.users ON DELETE CASCADE, CHECK admin|superadmin) y verificar que el archivo existe, respeta `YYYYMMDDHHMMSS_nombre.sql` y pasa revisión SQL (sin `gen_random_uuid`, sin UUID en leads)
- [x] 1.2 Agregar índices + RLS + grants en el mismo archivo: `CREATE UNIQUE INDEX … (lower(email::text))`, índice `created_at DESC`, `ENABLE ROW LEVEL SECURITY` en ambas tablas, las 3 policies del design (INSERT público con `WITH CHECK (acepta_politicas = true)`, SELECT admin vía `perfiles`, self-read en `perfiles`, sin UPDATE/DELETE) con cláusula `TO` y `(select auth.uid())`, grants explícitos (INSERT leads a anon/authenticated, SELECT leads a authenticated, USAGE+SELECT en secuencia, SELECT perfiles a authenticated) y verificar por relectura que cada policy del spec tiene su `CREATE POLICY` y que no hay `auth.role()` ni referencias a `user_metadata`
- [x] 1.3 Agregar `COMMENT ON` en tablas/columnas clave (consentimiento, unicidad email, fuente de roles) y verificar que el archivo SQL completo es coherente con `specs/leads-data-model/spec.md` requisito por requisito

## 2. Esquema compartido leadSchema (zod) — owned by C-02

- [x] 2.1 Agregar `leadSchema` en `lib/validaciones.ts` (zod, R2): `nombre`/`apellido` `z.string().trim().min(1)`, `email` `z.string().trim().toLowerCase().email()`, `acepta_politicas` `z.literal(true)` + `export type LeadInput = z.infer<typeof leadSchema>`; actualizar el comentario stub de C-01 (el schema vive en C-02, C-04 lo importa sin redefinir) y verificar con `npm run typecheck` + relectura de que no hay `any` y que los campos cubren RN-LEAD-01/02/05
- [x] 2.2 Verificar el schema caso por caso sin persistir (snippet efímero `node -e` o `tsx`, sin INSERT real): válido pasa y normaliza email a minúsculas recortadas; nombre/apellido vacío o solo espacios rechazado; email con formato inválido rechazado; `acepta_politicas = false`/ausente rechazado — y verificar que `registrarLead`/UI NO se crean aquí (quedan en C-04 que importará el schema)

## 3. Runbook de aplicación manual + verificación RLS

- [x] 3.1 Crear `supabase/APLICAR_C02.md` corto: paso 1 pegar migración en dashboard (SQL Editor → Run), bloque A de verificación por catálogo (tablas, `pg_policies`, índices, extensión citext) con queries copiables y verificar que cada query del runbook corre como está escrita contra un proyecto de prueba o por inspección (nombres de tablas/policies exactos)
- [x] 3.2 Documentar en el runbook el bloque B (pruebas RLS con anon key, no en SQL Editor): INSERT válido ok, duplicado exacto rechazado, duplicado con mayúsculas rechazado, INSERT `acepta_politicas=false` rechazado, SELECT anónimo sin filas — con snippet curl/JS usando el cliente browser de C-01 y emails `+test` — y verificar que el snippet referencia solo envs públicas y la URL del proyecto sin hardcodear secretos
- [x] 3.3 Documentar en el runbook el alta manual del admin (Dashboard → Authentication → Add user manual, luego `INSERT INTO perfiles (id, role)` con el UUID del usuario, luego SELECT autenticado ok) + bloque C de limpieza (borrar filas `+test`, confirmar tabla vacía) + bloque de reversa (`DROP TABLE` inverso) y verificar que el runbook declara explícitamente que no hay credenciales en el repo y que no quedan seeds persistentes

## 4. Decisión de roles + traza documental

- [x] 4.1 Agregar entrada DD en `knowledge-base/09_decisiones_y_supuestos.md` (siguiente número libre, ej. `DD-09 — Fuente de roles: tabla perfiles` con Decisión/Contexto/Alternativas/`user_metadata` descartado por user-editable + JWT stale según checklist Supabase/Justificación/Trade-off: app_metadata como evolución futura) y verificar que SU-03 queda cerrado por referencia a la nueva DD
- [x] 4.2 Dejar anotada (solo en el change, sin editar `CHANGES.md` aún) la corrección STALE para archive time — scope C-02 dice `id UUID … gen_random_uuid()`, vale BIGINT de KB 04 — y verificar que `proposal.md` ya la declara en Overrides para que el archive solo la transcriba

## 5. Cierre e integración

- [x] 5.1 Correr `openspec validate "c-02-leads-data-model" --strict` y verificar que está verde (spec con Purpose 50+ caracteres, cada Requirement con ≥1 Scenario `####` WHEN/THEN, paths kebab-case)
- [x] 5.2 Correr `openspec status --change c-02-leads-data-model` y verificar que proposal/specs/design/tasks figuran `done` y el change queda listo para review + `/opsx:archive` (que sincronizará `openspec/specs/leads-data-model/spec.md`)

## 6. Migración 002 correctiva — grants service_role (follow-up, sin cambio de spec)

- [x] 6.1 Crear `supabase/migrations/20261007194943_grants_service_role.sql` transaccional (`BEGIN; … COMMIT;`) con `GRANT ALL ON public.posibles_clientes TO service_role;`, `GRANT ALL ON public.perfiles TO service_role;`, `GRANT USAGE, SELECT ON SEQUENCE public.posibles_clientes_id_seq TO service_role;` + comentarios de contexto (42501 legacy, RLS probado en bloque B, re-ejecutable/idempotente) y verificar que el archivo existe, respeta `YYYYMMDDHHMMSS_nombre.sql`, es posterior a la 001 y no toca policies/RLS
- [x] 6.2 Documentar en `supabase/APLICAR_C02.md` el paso correctivo (aplicar 002 después de 001) + verificación esperada (SELECT con service_role funciona) y verificar por relectura que el orden 001→002 queda explícito
- [x] 6.3 Correr `openspec validate "c-02-leads-data-model" --strict` y verificar que sigue verde (cambio solo de tasks, spec intacto)
