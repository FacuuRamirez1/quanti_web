# Design — C-01 foundation-infra

## Context

Repo sin código (solo KB, roadmap, openspec). Proyecto Supabase ya creado por el usuario en browser; repo ya en GitHub. Reglas duras vigentes: R1 (nada sensible desde Client Components), R2 (TS estricto + zod compartido), R3 (secretos solo servidor), R6 (`next/image`), R8 (transform/opacity + `prefers-reduced-motion`). Ver `proposal.md` (Why) y `specs/foundation-infra/spec.md` (contrato observable). Skills aplicables según registry: `vercel-react-best-practices` (scaffold React/Next), `supabase-postgres-best-practices` + `supabase` (convenciones migrations/clientes, sin DB writes en C-01).

## Goals / Non-Goals

**Goals:**

- Scaffold mínimo que compila, arranca y pasa build + health + LHCI en local.
- Dejar la estructura de directorios final (según `08`) para que C-02 agregue migración 001 sin reordenar.
- Stub de middleware con la forma final (matcher `/admin/*`, redirección) para que C-03 solo rellene lógica de sesión.

**Non-Goals:**

- Proyecto Vercel, dominio, DNS NIC.ar, TLS → C-05 (ver proposal; CHANGES.md C-01 scope queda sobrescrito en este punto).
- Verificación Resend / remitente / casilla destino → C-09.
- Tablas, RLS, seed real, roles → C-02. Lógica de sesión Supabase en middleware → C-03.
- Landing real, políticas, formulario → C-04. Ningún deploy sale de este change.

## Decisions

1. **Next.js 15 estable (App Router), no 16.** KB `02` dice "16" en una línea pero el resto del proyecto y las decisiones de explore fijan 15 estable. Alternativa (16) descartada: línea stale, riesgo innecesario en fundación.
2. **Scaffold con `create-next-app` (TS + Tailwind v4 + App Router), luego podar a la estructura `08`.** Alternativa (armado manual archivo por archivo) descartada: más propensa a config incompleta (postcss, tsconfig estricto, next.config).
3. **Clientes Supabase con `@supabase/ssr` en `lib/supabase/{client,server,middleware}.ts`.** Es el SDK oficial que C-03 necesita para cookies `httpOnly`/`secure` + refresh. Alternativa (`@supabase/supabase-js` directo) descartada: no maneja cookies en App Router.
4. **Middleware stub sin dependencia de Supabase**: matcher `/admin/:path*`, redirige a `/admin/login` (página stub con mensaje "en construcción") — C-03 reemplaza el cuerpo por `updateSession` + chequeo de rol manteniendo matcher y rutas. Alternativa (middleware completo ya) descartada: requiere decidir fuente de roles, que es scope C-02/C-03.
5. **`.env.example` con las seis vars + validación fail-fast en arranque** (módulo `lib/env.ts` con zod que lista faltantes). Cumple R2/R3 y deja a C-04/C-09 solo consumir.
6. **Lighthouse CI via `lighthouserc` + script npm contra build local (`next build && next start`)**, mismos umbrales KB; job CI en workflow listo aunque el repo aún no exija PRs. Alternativa (solo script manual) descartada: el gate debe existir desde día 1 para que C-04/C-06 lo hereden.
7. **`supabase/migrations/` con formato `YYYYMMDDHHMMSS_nombre.sql` + `APLICAR.md` runbook (pegar en dashboard → correr queries de verificación → confirmar) + `seed.sql` placeholder.** Sin CLI ni writes en C-01 porque las keys las pega el usuario y el flujo acordado es dashboard-first desde C-02.
8. **Framer Motion instalado desde C-01** (CHANGES.md lo incluye en scope) pero sin uso en scaffold; su uso real se decide en C-06 bajo presupuesto JS (puede caer a CSS Transitions). Instalar ahora evita divergencia de lockfile más tarde.

## Risks / Trade-offs

- [Riesgo] Versiones exactas de Next/React/Tailwind a fecha de implementación pueden diferir de lo supuesto → Mitigación: fijar en tasks "última estable compatible con Next 15" y commitear lockfile; no hardcodear versiones en este doc.
- [Riesgo] El stub de middleware podría filtrarse a producción C-05 si C-03 se salta → Mitigación: spec exige denegar por defecto (redirect/403) y C-03 lo reemplaza, nunca lo relaja.
- [Riesgo] `.env.local` real lo pega el usuario a mano → Mitigación: `.env.example` comentado + validación fail-fast que nombra la variable faltante; documentar en tasks como paso manual del usuario.
- [Trade-off] LHCI en local puede fluctuar en máquinas lentas → se mide contra `next start` (build prod), no dev; los umbrales son los KB, sin relajar.
- [Trade-off] Instalar Framer Motion sin usarlo suma peso al lockfile pero no al bundle (no importado) → aceptable; si el presupuesto JS lo exige, C-06 lo quita.

## Migration Plan

No hay migración (greenfield, sin deploy): verificación local = install + typecheck + lint + build + start + health + LHCI en verde. Rollback = descartar scaffold (no hay datos ni producción afectada).

## Open Questions

- Ninguna que bloquee specs, enfoque o tasks. Detalles menores (gestor de paquetes si el usuario prefiere pnpm/bun sobre npm; puerto LHCI) se resuelven en implementación con defaults razonables (npm, puerto estándar) y quedan registrados.
