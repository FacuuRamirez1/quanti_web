# Proposal — C-01 foundation-infra

> Display name `C-01` (roadmap) = directory `c-01-foundation-infra` (openspec exige kebab-case minúsculas).

## Why

El repo hoy solo tiene documentación (KB + roadmap): no existe scaffold Next.js, ni clientes Supabase, ni health check, ni gates de calidad. Sin esta base, ningún change posterior (C-02 → C-11) puede implementarse ni verificarse. Hay que crearla ahora, mínima y verificable localmente, antes de tocar datos o auth.

## What Changes

- Scaffold Next.js 15 (App Router, estable — cualquier mención a "16" en CHANGES.md/KB es stale) + React + Tailwind CSS v4 + TypeScript estricto + `next/image` desde el día 1.
- Estructura de directorios según `08_arquitectura_propuesta.md`: `app/ (publico) + admin + actions + api mínimo / components / lib/supabase + validaciones.ts + clientes.ts / public/clientes/ / supabase/migrations + seed.sql / middleware.ts`.
- Clientes Supabase `@supabase/ssr` (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`) + `.env.example` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `RESEND_API_KEY`, `CONTACTO_DESTINO`, `RESEND_REMITENTE`. Valores reales solo en `.env.local` (gitignored) pegados por el usuario + envs Vercel más tarde; nunca en el repo (R3).
- `middleware.ts` STUB que protege `/admin/*` (redirección a login / 403 básico; lógica completa con Supabase en C-03).
- Health check mínimo (ruta `/api/health`) + página raíz placeholder con `lang="es"` y skip-link.
- Estructura `supabase/migrations/` + convenciones de versionado + runbook corto de aplicación manual (el usuario aplica SQL pegando en el dashboard Supabase desde C-02; en C-01 no hay escrituras a la DB).
- Lighthouse CI configurado desde el día 1 con presupuestos KB (PageSpeed móvil ≥ 85, LCP ≤ 2.5s, CLS ≤ 0.1, JS inicial ≤ 170 KB gzip) corriendo en local y listo para PRs.
- Tests mínimos: build verde + health + presencia de envs requeridas + checklist WCAG base del scaffold verificado.
- **NO incluye** (explícito, revisado vs CHANGES.md): creación del proyecto Vercel, conexión del dominio `quantihidroponia.com.ar`, DNS NIC.ar/TLS, ni verificación Resend — todo eso se mueve a C-05 (deploy) y C-09 (Resend). C-01 se cierra verificado en local.

## Capabilities

### New Capabilities

- `foundation-infra`: scaffold Next.js 15 + estructura de directorios + clientes Supabase + `.env.example` + middleware stub protegiendo `/admin/*` + health check + Lighthouse CI con presupuestos KB + base a11y (`lang="es"`, skip-link) + convenciones `supabase/migrations/`. Es la base observable sobre la que C-02 (datos) y C-03 (auth) construyen.

### Modified Capabilities

- (vacío — no hay specs previas; `openspec list --specs` está vacío, este es el primer change)

## Impact

- Afecta: raíz del repo (scaffold nuevo: `package.json`, `next.config`, `tsconfig` estricto, Tailwind v4, `app/`, `lib/`, `middleware.ts`, `supabase/`, `.env.example`, config LHCI). Nada existente se modifica (no hay código previo).
- Dependencias externas: ninguna creada en este change (proyecto Supabase ya creado por el usuario en browser; repo ya en GitHub; sin proyecto Vercel ni DNS todavía).
- Desbloquea: C-02 (migración 001 + runbook ya tiene dónde vivir) y en cadena toda la Instancia 1.
- Governance del change (roadmap): BAJO. Reglas duras AGENTS.md/CLAUDE.md (R1–R8, U1–U2) aplican a artefactos e implementación.
