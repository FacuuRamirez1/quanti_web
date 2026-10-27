# Design — C-02 leads-data-model

## Context

Ver `proposal.md` (Why + overrides) y `specs/leads-data-model/spec.md` (contrato observable). Estado actual: C-01 archivado — existen `supabase/migrations/` (solo `README.md` + convención `YYYYMMDDHHMMSS_nombre.sql`), `supabase/APLICAR.md` genérico, clientes `@supabase/ssr` (`lib/supabase/{client,server}.ts`, anon para RLS + `createServiceRoleClient` solo servidor) y `.env.local` con keys live validadas (proyecto `wblusgwrfnflpgdylqvp`, Healthy). Flujo acordado: el usuario aplica SQL pegando en el dashboard Supabase (sin CLI ni writes remotos desde el agente). Supabase docs verificadas vía Context7 el 2026-10-06: policies con cláusula `TO`, `(select auth.uid())` envuelto en subselect por performance/early-exit, `auth.role()` deprecado, grants antes que RLS, `service_role` con `BYPASSRLS`.

## Goals / Non-Goals

**Goals:**

- Una migración `001` autocontenida y transaccional que cree `posibles_clientes` + `perfiles` + índices + RLS + grants + comentarios, aplicable por pegado en dashboard.
- Un contrato de validación compartido `leadSchema` (zod) en `lib/validaciones.ts` owned by C-02 (schema-first, R2 + KB `08`): `nombre`/`apellido` non-empty trimmed, `email` formato válido normalizado, `acepta_politicas` literal `true` — C-04 lo importa, no lo redefine.
- Cerrar la fuente de roles (pregunta Alta `10`, SU-03) con entrada DD lista para `09_decisiones_y_supuestos.md`.
- Runbook corto que pruebe constraints Y rls (matriz anon/admin) sin dejar seeds ni secretos.

**Non-Goals:**

- Nada de `app/` ni `middleware.ts` en este change; Server Action `registrarLead` + wiring UI son C-04 (C-04 importa `leadSchema`, no lo redefine); sesión/middleware/login son C-03; filtros/paginación UI son C-05.
- Texto legal de políticas y valor inicial de `politicas_version` más allá de documentar el ejemplo `v1.0` (lo escribe C-04 por inserto).
- Rate limit / honeypot (app-level, C-04); exportación (prohibida, RN-LEAD-04); precios (R4, sin objeto).

## Decisions

1. **Fuente de roles = tabla `perfiles` (no `user_metadata`).** Rationale: `raw_user_meta_data` es editable por el propio usuario y aparece en el JWT — la checklist de seguridad del skill `supabase` lo declara inseguro para decisiones de autorización; además los claims JWT quedan stale hasta el refresh. `perfiles` es server-controlled, auditable, se resuelve por query en cada policy (sin staleness) y coincide con el ERD de KB `04`. Alternativa (`user_metadata.role`) descartada: más simple pero insegura y exigiría sincronizar claims; `app_metadata` sería la variante segura dentro del JWT pero no está entre las opciones del roadmap y añade gestión de hooks — se deja como evolución futura documentada, no como default.
2. **PK `BIGINT GENERATED ALWAYS AS IDENTITY` en leads.** Rationale: manda la KB `04` editada por el usuario + coherencia con `categorias`/`productos` (C-07, también BIGINT) y secuencias con grants explícitos. Alternativa (UUID `gen_random_uuid()` de CHANGES.md) descartada: línea stale, anotada para corrección en archive time.
3. **`email CITEXT` + `CREATE EXTENSION IF NOT EXISTS citext;` + índice único sobre expresión `lower(email::text)`.** Rationale: CITEXT da comparación case-insensitive nativa; el UNIQUE se implementa como `CREATE UNIQUE INDEX` porque Postgres no admite UNIQUE sobre expresión como table constraint. Se castea a `::text` dentro de `lower()` para tipado estable. Alternativa (`TEXT + UNIQUE(email)` binario) descartada: rompería RN-LEAD-05 (`ANA@` vs `ana@` duplicarían).
4. **Consentimiento como constraint DB `CHECK (acepta_politicas = true)` + `DEFAULT false` intencional.** Rationale: defensa en profundidad (R1: RLS/DB es última defensa, la Action valida primero); el default `false` obliga al INSERT a declarar `true` explícito — un INSERT que omita la columna falla, que es exactamente "sin consentimiento no hay INSERT válido". La UX (checkbox obligatorio, deshabilitar submit) queda en C-04; el schema `leadSchema` (`z.literal(true)`) vive en este change. Alternativa (solo validación app sin constraint) descartada: un bypass de la Action escribiría filas sin consentimiento.
5. **Policies mínimas con cláusula `TO` y `(select auth.uid())`.** Forma exacta:
   - `posibles_clientes_insert_public`: `FOR INSERT TO anon, authenticated WITH CHECK (acepta_politicas = true)`.
   - `posibles_clientes_select_admin`: `FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (select auth.uid()) AND perfiles.role IN ('admin','superadmin')))`.
   - Sin policies UPDATE/DELETE en leads → denegado por defecto con RLS habilitado.
   - `perfiles_select_own`: `FOR SELECT TO authenticated USING ((select auth.uid()) = id)` — permite la resolución de rol sin recursión (una policy admin-read-all sobre `perfiles` se auto-referenciaría; se evita).
   - Sintaxis verificada contra docs actuales (no `auth.role()`, `uid()` envuelto en `SELECT` para early-exit en `anon`). Alternativa (una sola policy `TO public` o chequeo `user_metadata`) descartada por deprecación/inseguridad.
6. **Grants explícitos + `COMMENT ON`.** `GRANT INSERT ON posibles_clientes TO anon, authenticated; GRANT SELECT ON posibles_clientes TO authenticated; GRANT USAGE, SELECT ON SEQUENCE <seq> TO anon, authenticated; GRANT SELECT ON perfiles TO authenticated;` Rationale: la Data API evalúa grants antes que RLS — sin esto, el fallo parece RLS cuando es permiso de tabla (docs verificadas). `COMMENT ON TABLE/COLUMN` documenta consentimiento y unicidad para futuros agentes.
7. **Migración única transaccional + nombre con timestamp al implementar** (`YYYYMMDDHHMMSS_posibles_clientes_y_perfiles.sql`, todo en `BEGIN; … COMMIT;`). Rationale: un archivo = un change atómico reversible (convención C-01); el timestamp se fija al crear el archivo, no en este doc. Rollback = `DROP TABLE` en orden inverso (documentado en runbook); la extensión `citext` se conserva al revertir.
8. **Verificación en dos planos (dashboard = postgres bypasses RLS).** El SQL Editor corre como superusuario y NO prueba RLS: constraints/catálogo (`pg_policies`, índices, duplicado, CHECK) se verifican ahí; RLS se prueba con la anon key (curl o snippet JS con el cliente browser de C-01): INSERT válido ok → SELECT anónimo vacío/denegado → INSERT duplicado/`false` rechazado → tras alta manual de admin, SELECT autenticado ok. Filas de prueba efímeras con email `+test` y borrado final documentado. Alternativa (probar todo en SQL Editor) descartada: daría falso verde en RLS.
9. **Schema-first: `leadSchema` owned by C-02 en `lib/validaciones.ts` (R2 + KB `08`).** Forma exacta: `nombre`/`apellido` `z.string().trim().min(1)` (no vacíos ni solo espacios, RN-LEAD-01), `email` `z.string().trim().toLowerCase().email()` (formato válido + normalizado, RN-LEAD-02/05), `acepta_politicas` `z.literal(true)` (checkbox obligatorio) + `type LeadInput = z.infer<typeof leadSchema>`. Rationale: R2 exige schemas compartidos usados en front Y back — el contrato de validación es parte del contrato de datos, no de la UI; C-04 (formulario + `registrarLead`) lo importa como autoridad sin redefinirlo, y la DB re-valida (CHECK/UNIQUE) como última defensa. También actualiza el comentario stub que C-01 dejó en `lib/validaciones.ts` ("C-04 agrega acá `leadSchema`"), que queda STALE. Alternativa (schema en C-04) descartada: partiría el contrato en dos changes y duplicaría el riesgo de divergencia front/back.

## Risks / Trade-offs

- [Riesgo] Pegado manual en dashboard (error humano, orden, doble ejecución) → Mitigación: archivo idempotente donde es seguro (`IF NOT EXISTS` en extensión), transacción única, runbook numerado con verificación tras cada paso; nunca editar la migración ya aplicada, corregir con migración nueva.
- [Riesgo] `citext` requiere permiso de extensión en el proyecto → Mitigación: `CREATE EXTENSION IF NOT EXISTS` es estándar en Supabase; si el dashboard lo rechaza, el runbook indica crearlo desde Database → Extensions y reintentar (verificación previa al resto).
- [Riesgo] Confusión UNIQUE-constraint vs UNIQUE-index al revisar → Mitigación: el spec exige comportamiento (case-insensitive), el design fija `CREATE UNIQUE INDEX … (lower(email::text))` con nombre explícito; el test de duplicado con mayúsculas lo demuestra.
- [Riesgo] Recursión RLS `perfiles`↔`leads` → Mitigación: `perfiles` solo tiene policy self-read sin subconsulta a leads; la policy de leads lee `perfiles` en una sola dirección.
- [Trade-off] Sin rate limit a nivel DB (un bot podría insertar mucho) → aceptado: el límite vive en la Action (C-04); la DB garantiza validez, no abuso.
- [Trade-off] `JWT`/sesión no interviene en este change → la frescura del rol no depende de claims (se lee `perfiles` por query); C-03 hereda ese beneficio sin trabajo extra.
- [Trade-off] `DEFAULT false` + `CHECK true` parece contradictorio → intencional y comentado en SQL + spec; evita el "olvido silencioso" de la columna.

## Migration Plan

1. Implementación crea `supabase/migrations/<timestamp>_posibles_clientes_y_perfiles.sql` + `leadSchema` en `lib/validaciones.ts` (actualizando el stub C-01) + `supabase/APLICAR_C02.md` + entrada DD en `knowledge-base/09_decisiones_y_supuestos.md` (texto propuesto en tasks).
2. Usuario: pega el SQL en dashboard → corre bloque A (catálogo/constraints) → corre bloque B (RLS con anon key) → alta manual admin → bloque C (SELECT admin) → borra filas `+test` → confirma tabla vacía.
3. Cierre: `openspec validate --strict` verde + `tasks.md` completo → `/opsx:archive` sincroniza spec a `openspec/specs/leads-data-model/spec.md` y anota la corrección STALE de CHANGES.md (UUID→BIGINT) + DD en KB.
4. Rollback pre-deploy (solo si la migración se aplicó y hay que revertir): ejecutar bloque de reversa del runbook (`DROP TABLE posibles_clientes; DROP TABLE perfiles;` + borrado de policies/índices implícito); post-C-04 con datos reales, rollback requiere backup (fuera de este change).

## Open Questions

- Ninguna que cambie specs, enfoque o tasks. Menores diferidos a implementación: timestamp exacto del filename; si el proyecto prefiere `politicas_version` con otro seed inicial que `v1.0` (lo fija C-04 al escribir el primer lead real).
