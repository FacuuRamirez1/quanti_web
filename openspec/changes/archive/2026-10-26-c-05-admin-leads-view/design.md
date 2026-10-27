# Design — C-05 admin-leads-view

## Context

Ver `proposal.md` (Why) y `specs/admin-leads-view/spec.md` (contrato observable). Estado actual relevante:

- `/admin` es un RSC placeholder (`src/app/admin/(panel)/page.tsx`); su layout ya ejecuta `requireRole(['admin','superadmin'])` y responde 403 sin contenido admin (C-03).
- `posibles_clientes` (C-02) tiene `id BIGINT`, nombre/apellido/email CITEXT, `acepta_politicas`, `politicas_version`, `consent_at`, `created_at`; RLS permite SELECT solo a `admin`/`superadmin`; existe índice `posibles_clientes_created_at_desc_idx` sobre `created_at DESC`.
- C-04 persiste leads con `politicas_version = "v1.0"` y `consent_at = now()`; su task 6.1 espera que la fila se vea en `/admin`.
- El repo no tiene runner de tests: solo harnesses manuales en `scripts/` y verificación live. `package.json` expone `typecheck`, `lint`, `build`.

## Goals / Non-Goals

**Goals:**

- Un único camino de lectura server-side tipado y testeable, con filtros/paginación como funciones puras.
- Comportamiento de URL estable y bookmarkeable, sin estado de filtros en el cliente.
- A11y y estados completos desde la primera implementación, no como pasada posterior.
- Dejar montado el stack Vitest + Playwright que el resto de los changes pueda reutilizar.

**Non-Goals:**

- Exportación (prohibida), edición/borrado de leads, orden configurable, filtros adicionales a nombre/email/fecha (SU-02: change nuevo si se piden).
- Búsqueda full-text/trigram, contadores cacheados o materialized views.
- Cambios de DB/migraciones, de auth o del formulario de captura.
- Descarga de browsers de Playwright o un runner de componentes con jsdom.

## Decisions

### 1. Lectura 100% server-side con doble defensa real

`app/admin/(panel)/page.tsx` (RSC) delega en un módulo `server-only` (`lib/leads-data.ts`) que: (a) ejecuta `requireRole(['admin','superadmin'], '/admin')` **antes** de consultar, y (b) consulta con `createClient()` (anon + cookies de la sesión), nunca `service_role`, de modo que la policy RLS de `posibles_clientes` vuelve a decidir fila por fila. El layout conserva su guard para la cáscara y rutas futuras.

- **Por qué repetir el guard en la página:** layouts y pages pueden resolver en paralelo; confiar solo en el layout no garantiza "rol verificado antes de la query". El costo es un lookup por PK en `perfiles` (barato, tráfico admin bajo).
- **Alternativas descartadas:** `service_role` para leer leads (bypassa RLS, viola R3 y la doble defensa); query desde Client Component (viola R1); confiar solo en RLS (RN-AU-02 exige rol explícito en app).
- El resultado de Supabase se valida/mapea con un schema zod de fila (`leadRowSchema`), evitando `any` (R2) y normalizando `null`s.

### 2. Filtros en URL `searchParams`, formulario GET y navegación full-page

`/admin` recibe `searchParams` (`nombre`, `email`, `from`, `to`, `page`) y los parsea con zod en el servidor. El formulario de filtros es un `<form method="get" action="/admin">` server-rendered; la paginación usa `<a href>` que reconstruye la query conservando filtros.

- **Por qué URL:** filtros compartibles/bookmarkeables, back/forward del navegador funciona, cero estado duplicado cliente/servidor y la navegación server-side hace que la carga de página anuncie los resultados (sin `aria-live` manual).
- **Alternativas descartadas:** estado React + fetch client (viola R1, requiere `aria-live`, rompe bookmarking); Server Actions para filtros (mutación innecesaria para una lectura; GET es semánticamente correcto).
- Parámetros repetidos (`?nombre=a&nombre=b`) se resuelven tomando el primer valor string; arrays/objetos se descartan.

### 3. Semántica exacta de filtros

- `nombre` y `email`: `trim`, búsqueda parcial case-insensitive con `ilike('%term%')`. El input se escapa para LIKE: `\` → `\\`, luego `%` → `\%` y `_` → `\_`, de modo que esos caracteres se busquen literalmente. Largo máximo 100 caracteres; si supera, el filtro se descarta.
- `from`/`to`: regex `YYYY-MM-DD` + validación de fecha de calendario real. Semántica **UTC**: `from` → `created_at >= "<from>T00:00:00.000Z"`; `to` inclusivo → `created_at < "<to + 1 día>T00:00:00.000Z"` (evita el borde de milisegundos). Si `from > to`, se descartan ambos.
- **`*` es comodín en PostgREST (verificado en vivo 2026-10-25):** PostgREST convierte `*` en `%` en `like/ilike` y NO admite escape (`\*` se transforma en `\%`, o sea un `%` literal). Con `ilike`, buscar `a*b` también devolvía `axxb`. Decisión: si el término (nombre/email) contiene `*` se usa el operador `imatch` (regex POSIX case-insensitive, no convierte `*`) con el término escapado como regex literal (`escapeRegexLiteral`), vía `.filter(col, 'imatch', valor)` (valor parametrizado, nunca `.or()`/strings interpolados). Sin `*` se mantiene `ilike` con el escape de `\`/`%`/`_`. Verificado con e2e (`a*b` no trae `axxb` ni `ab`).
- Los valores con caracteres de control (NUL, saltos de línea, tab internos, DEL) se descartan como inválidos (un NUL hacía que PostgREST truncara el patrón y devolviera TODO).
- Parámetros inválidos se descartan individualmente; la página siempre renderiza (nunca 400/500 por query string).
- Todos los filtros válidos se combinan con AND en la misma query; `count: 'exact'` se calcula sobre el conjunto filtrado.

### 4. Orden y paginación server-side deterministas

- `ORDER BY created_at DESC, id DESC` (desempate estable). La paginación usa `range(offset, offset + 19)` con `PAGE_SIZE = 20` y `count: 'exact'`.
- `page`: entero 1..1000; cualquier otro valor (0, negativo, decimal, texto, > 1000) cae a 1. El tope evita OFFSET gigante.
- `totalPages = max(1, ceil(count / PAGE_SIZE))`. Si `page > totalPages` y `count > 0`, se muestra un estado "Esta página no existe" con enlace a la página 1 que **preserva los filtros activos** (`buildLeadsUrl(filters, 1)`; no se confunde con "sin resultados por filtros"). Con `offset > total` PostgREST responde 416 (`PGRST103`): no es una falla, `getLeadsPage` re-consulta solo para obtener el total (`range 0..0`) y la vista resuelve "página fuera de rango". La normalización de `page` inválida → 1 vive solo en `parsePage` (page.tsx); no hay lógica de `page` en el middleware.
- **Controles:** enlaces nativos anterior/siguiente + "Página X de Y"; cuando no hay anterior/siguiente se renderiza un `<span aria-disabled="true">` sin `href` ni foco (deshabilitado real, no solo color).
- **Alternativa descartada:** cursor/keyset pagination — más eficiente a gran escala, pero innecesaria para el volumen de I1 y complica el salto de página y el conteo exacto.

### 5. Columnas, formato de fecha y valores nulos

Columnas: nombre, apellido, email, alta, `politicas_version`, `consent_at`. Nombre/apellido/email se muestran tal cual (email ya normalizado por C-04).

- Fecha: `Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })` + sufijo " UTC", dentro de `<time dateTime={iso}>`. Se elige **UTC también para mostrar** (no ART) para que el filtro UTC y lo que ve el admin sean coherentes y deterministas en servidor. Si el negocio pide hora local, es un change que cambia filtro y display juntos.
- `politicas_version`/`consent_at` nulos → texto visible "Sin registro" (accesible por defecto), nunca celda vacía.

### 6. Estados: sin leads, sin resultados, página inexistente, error y loading

- `count === 0` sin filtros → "Todavía no hay leads registrados."
- `count === 0` con filtros → "No hay resultados para los filtros aplicados." + enlace "Limpiar filtros" a `/admin`.
- `count > 0` y página fuera de rango → aviso con enlace a la página 1.
- Error de Supabase → estado genérico con `role="alert"` ("No pudimos cargar los leads. Probá de nuevo en unos minutos."); el código/mensaje interno se registra solo en servidor (sin PII ni detalles al cliente).
- `app/admin/(panel)/loading.tsx` con skeleton y `aria-busy="true"` para la navegación server-side; sin imágenes ni animaciones (R8 no aplica).

### 7. Accesibilidad

- `<table>` con `<caption>` ("Leads registrados", incluye el total), `<thead>` y `<th scope="col">`; sin tablas anidadas.
- Filtros con `<label htmlFor>` por campo, `autocomplete` adecuado, foco visible global existente y envío con Enter.
- Navegación full-page (Decisión 2): cada cambio de filtro/página es una carga nueva, anunciada por el lector; no se agrega `aria-live` (se documenta el fallback si en el futuro se pasa a navegación cliente).
- Contraste ≥ 4.5:1 usando tokens existentes (`brand-700`, texto neutro); estado de página actual y disponibilidad de controles se expresan con texto/`aria-*`, no solo color.
- Sin dependencia de JS cliente para filtrar/paginar: la vista funciona con HTML server-rendered.

### 8. Sin exportación: decisión explícita y verificable

No se crea ninguna ruta, Route Handler, Server Action ni control de descarga. La única forma de obtener leads es renderizarlos en `/admin` (RN-LEAD-04/DD-03).

- **Cómo se testea la ausencia:** E2E recorre la página y afirma que no hay botón/enlace con textos "exportar", "descargar", "CSV" o "Excel"; además request a rutas plausibles (`/admin/export`, `/admin/leads/export`, `/api/leads/export`, `/api/export`) devuelve 404/405 y nunca `content-disposition: attachment`. En la verificación final, grep del árbol de rutas/actions para confirmar que no existe implementación de export.

### 9. Performance e índices

- El índice existente `(created_at DESC)` cubre el orden/paginado; no se agrega migración en este change.
- `ilike '%term%'` no puede usar btree. Con el volumen esperado de I1 (leads de una landing pre-lanzamiento: cientos a pocos miles), el scan es de milisegundos. **No se habilita `pg_trgm` ahora** (evita extensión + índice GIN + migración manual sin evidencia de necesidad).
- **Disparador documentado para un change futuro:** tabla > ~50k filas o p95 de la consulta > 100 ms → migración nueva con `pg_trgm` + GIN sobre `nombre`/`apellido` (y evaluar `email`) y, si EXPLAIN muestra sort costoso, índice compuesto `(created_at DESC, id DESC)`.
- `count: 'exact'` en cada página es aceptable a este volumen; cambiarlo por contadores cacheados queda fuera de alcance.

### 10. Stack de tests: Vitest + Playwright con Edge instalado

- **Vitest** para lógica pura: parseo/validación de `searchParams`, escape de `%`/`_`/`\`, cálculo de rango UTC, `page`/`offset`/`totalPages`, formato de fecha y schema de fila. Razón: ESM/TS nativo con la config actual (Next 15 + TS 5 + zod 4), sin Babel ni `ts-jest`; Jest requeriría transform config y tiene fricción con ESM. `environment: 'node'` (no hace falta jsdom: no se testean componentes con DOM).
- **Playwright** (`@playwright/test`) para E2E de autorización, tabla, filtros, paginación, estados y ausencia de export, más `@axe-core/playwright` para a11y de `/admin` autenticado. `channel: 'msedge'` reutiliza el Edge ya instalado en Windows y **evita descargar browsers** (`playwright install` no se ejecuta); el repo ya usa Edge para LHCI (C-03/C-04). Trade-off: el runner depende de Edge presente; en un CI Linux habría que instalar un browser, decisión futura.
- E2E contra `next dev`/`next start` en un puerto dedicado (`3105`, override por `E2E_BASE_URL`), con `webServer` y `reuseExistingServer` en local.
- Credenciales y datos de prueba **solo por env** (`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SUPERADMIN_*`, `E2E_NOROLE_*`, `E2E_ALLOW_LIVE_DB=1`); `globalSetup`/`globalTeardown` crean y borran usuarios/perfiles/leads efímeros con `service_role` (nunca en código de app ni en el bundle cliente) y prefijo `e2e+<runid>@quanti-test.local`. Si falta `E2E_ALLOW_LIVE_DB`, la suite aborta antes de tocar la DB. `.env.local`/`.env.test.local` siguen gitignored (R3/U1).

### 11. Límites de módulos y tipado

- `src/lib/leads-filters.ts`: puro, sin `server-only` ni Supabase — schemas zod, parseo, escape, rangos y formato. Testeable con Vitest.
- `src/lib/leads-data.ts`: `import 'server-only'`, guard + query Supabase + mapeo con `leadRowSchema`; devuelve un union discriminado (`{ status: 'ok', rows, total } | { status: 'error' }`).
- `src/components/admin/*`: tabla, filtros, paginación y estados como RSC sin estado cliente; reutilizan `ui/*` existentes cuando aplica. Sin `any` (R2), sin precios (R4), sin imágenes (R6), sin animaciones (R8).

## Risks / Trade-offs

- **[Riesgo] Layout y page resuelven en paralelo** → el guard se ejecuta también dentro de `leads-data.ts` antes de la query; no se depende del orden de render.
- **[Riesgo] Escape de LIKE incorrecto** (`%`, `_`, `\`) → función única + tests unitarios con casos literales y bordes; la query usa el builder de Supabase (sin SQL concatenado).
- **[Riesgo] Confusión UTC vs hora local** → display y filtro comparten UTC y el sufijo "UTC" es visible; cambiar a ART requiere modificar ambos en un change futuro.
- **[Riesgo] E2E contamina la DB live** → prefijo único por run, `globalTeardown` que borra por prefijo, guard `E2E_ALLOW_LIVE_DB`, y verificación final de cero filas de prueba.
- **[Riesgo] Edge no disponible en otra máquina/CI** → requisito documentado; `channel: 'msedge'` falla explícito. Instalar browsers queda como decisión de CI, no de este change.
- **[Trade-off] `count: 'exact'` + `%term%` sin trigram** → correcto y simple para I1; se revisita con los umbrales de la Decisión 9.
- **[Trade-off] Guard duplicado (layout + data layer)** → una query extra por render admin; se acepta por la garantía de autorización antes de la lectura.
- **[Riesgo] Página fuera de rango** → estado dedicado con enlace a página 1; nunca se muestra "sin resultados por filtros" para ese caso.

## Migration Plan

1. Agregar devDependencies (`vitest`, `@playwright/test`, `@axe-core/playwright`) y scripts; crear `vitest.config.ts`, `playwright.config.ts`, `e2e/global-setup.ts`/`global-teardown.ts`. Sin descargar browsers.
2. Implementar lógica pura + tests (RED→GREEN) y luego data layer + componentes + página.
3. Verificar con `tsc --noEmit`, `lint`, `build`, `vitest run`, `playwright test` (con Edge) y axe en `/admin` autenticado.
4. Cerrar C-04 6.1 (lead de prueba visible y borrado), marcar la task y archivar C-04.
5. Rollback: revertir los archivos del change; no hay migración ni dato que revertir. Las filas de prueba E2E se eliminan en teardown.

## Open Questions

- Ninguna que cambie specs, enfoque o tasks. Quedan como decisiones futuras explícitas: hora local ART (change que toque filtro + display) e índices trigram/compuesto al superar los umbrales de la Decisión 9.
