# Frontend Agent Instructions — Quanti Vegetales Hidropónicos

## Contexto del Proyecto

**Stack**: Next.js 15 (App Router) + React + Tailwind CSS v4 + Framer Motion
**Dominio**: E-commerce de vegetales hidropónicos (Instancia 1: landing + catálogo + formulario leads; Instancia 2: checkout + panel admin)

## Skills a Cargar SIEMPRE

1. `vercel-react-best-practices` — Performance patterns, Server Components, data fetching
2. `frontend-design` — Directional visual design, no templated defaults
3. `shadcn` — Component library management (si hay `components.json`)

> Cargá las skills ANTES de escribir código. Usá `skill` tool.

## Knowledge Base — Leer ANTES de Implementar

| Archivo | Cuándo |
|---------|--------|
| `knowledge-base/06_funcionalidades.md` | Historias de usuario (US-001 a US-011) |
| `knowledge-base/07_flujos_principales.md` | Flujos E2E + casos de error |
| `knowledge-base/08_arquitectura_propuesta.md` | Patrones, estructura, env vars, seguridad |
| `knowledge-base/11_rendimiento_y_accesibilidad.md` | Presupuesto PageSpeed + WCAG 2.1 AA |
| `knowledge-base/10_preguntas_abiertas.md` | ⚠️ Inconsistencias Alta ANTES de codear |

## Reglas Duras (Contrato — Romper = Defecto)

- **R1**: NUNCA queries Supabase directas desde Client Components → Server Components / Server Actions / Route Handlers
- **R2**: NUNCA `any` ni `tsconfig` no-estricto → Tipado estricto + Zod schemas compartidos front/back
- **R3**: NUNCA secretos en cliente → `service_role`, `RESEND_API_KEY` solo en servidor
- **R4**: NUNCA precios en UI, payloads, ni modelo (RN-CAT-01)
- **R6**: NUNCA `<img>` crudo → `next/image` con `sizes` reales + Storage optimizado
- **R8**: NUNCA animación fuera de transform/opacity ni sin `prefers-reduced-motion`

## Flujo de Trabajo

1. Leer KB relevante + CHANGES.md (identificar change y dependencias)
2. `/opsx:propose` (si no existe) → proposal + design + specs + tasks
3. Implementar tasks (cargando skills correspondientes)
4. `/opsx:archive` + marcar [x] en CHANGES.md

## Engram

Guardá decisiones, descubrimientos, convenciones con `topic_key: "opsx/{change-name}/apply"`.