# Proposal — C-05 admin-leads-view

## Why

C-04 ya captura leads con consentimiento, pero `/admin` sigue siendo el placeholder de C-03 ("El listado de leads llega en C-05"): la Instancia 1 no es operable porque el admin no puede ver ni filtrar los interesados (US-007, Flujo 4). Este change cierra la cadena de captación→consulta y desbloquea la task 6.1 de C-04.

## What Changes

- Reemplaza el placeholder de `/admin` por un listado RSC real de `posibles_clientes` (`created_at DESC`, desempate `id DESC`), paginado server-side (20 por página) con `range()` + `count: 'exact'`.
- Columnas visibles: nombre, apellido, email, fecha de alta (formato es-AR + `<time datetime>`), `politicas_version` y `consent_at` (mandato nuevo), con placeholder accesible para `null`.
- Filtros **server-side** por nombre, email y rango de fechas, transportados en URL `searchParams` (bookmarkeables), parseados/validados con zod: `ilike` parcial case-insensitive con escape de `%`/`_`; fechas `YYYY-MM-DD` interpretadas en UTC con `to` inclusive (día siguiente `lt`); `from <= to`; inputs acotados y parámetros inválidos descartados sin romper la página.
- Paginación accesible (nav con `aria-label`, links operables por teclado, "Página X de Y", estados disabled reales, tope de página para evitar OFFSET gigante).
- Tabla semántica accesible (`<caption>`/título asociado, `scope="col"`, foco visible, contraste ≥ 4.5:1) y estados amables: sin leads, sin resultados por filtro (con "limpiar filtros"), error de DB genérico y loading con Suspense.
- **Sin exportación**: no se crea ninguna ruta, Server Action ni control de descarga CSV/Excel (RN-LEAD-04 / DD-03). Se agrega una verificación explícita de ausencia.
- Adopta el stack de tests del proyecto: **Vitest** para lógica pura (parseo/validación de searchParams, escape de filtros, cálculo de páginas, formato de fecha) y **Playwright** (`channel: 'msedge'`, sin descargar browsers) para E2E de autorización, filtros, paginación y ausencia de export.
- Cierra la task 6.1 de C-04 (lead de prueba visible en `/admin` y luego borrado) y habilita archivar C-04.

## Capabilities

### New Capabilities

- `admin-leads-view`: lectura server-side del panel de leads con doble defensa (rol + RLS), tabla ordenada/paginada, filtros por nombre/email/fecha vía URL, estados vacío/error, accesibilidad y garantía de ausencia de exportación.

### Modified Capabilities

- `auth-admin-shell`: el Requirement "Cáscara admin mínima y link discreto en footer" deja de especificar un placeholder sin tabla; la cáscara pasa a renderizar el listado real de C-05. El resto (login, middleware, autorización por `perfiles`, logout, link en footer) no cambia.

## Impact

- Afecta: `src/app/admin/(panel)/page.tsx` (placeholder → listado RSC), nuevos `src/components/admin/*` (tabla, filtros, paginación, estados), nuevo módulo puro de filtros/paginación (p. ej. `src/lib/leads-query.ts`) + su query server-only, y `package.json` (devDependencies y scripts de test).
- No cambia la DB: `posibles_clientes`, `perfiles`, RLS, grants e índice `created_at DESC` ya existen (C-02). No se agrega migración ni índice trigram en este change (justificado en design).
- Depende de C-03 (auth/rol) y C-04 (captura con consentimiento); ambas archivadas/satisfechas. Habilita C-06 y el cierre de C-04.
- Governance MEDIO. Sin secretos nuevos en el repo: credenciales de prueba E2E viven solo en variables de entorno (R3). Sin commits (U1).
