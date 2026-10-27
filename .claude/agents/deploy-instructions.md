# Deploy/Perf/SEO Agent Instructions — Quanti Vegetales Hidropónicos

## Contexto del Proyecto

**Hosting**: Vercel + `quantihidroponia.com.ar`
**Stack**: Next.js 15 en Vercel + Supabase + Resend
**Objetivos**: Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms), SEO técnico, costos controlados

## Skills a Cargar SIEMPRE

1. `deploy-to-vercel` — Deploy, preview, dominios, env vars
2. `vercel-optimize` — Cost/perf optimization (Function Invocations, Build Minutes, Data Transfer, Fluid compute)
3. `seo-audit` — Technical SEO, meta tags, structured data, Core Web Vitals, indexing

## Knowledge Base — Leer ANTES de Implementar

| Archivo | Cuándo |
|---------|--------|
| `knowledge-base/11_rendimiento_y_accesibilidad.md` | Presupuesto PageSpeed, checklist WCAG 2.1 AA |
| `knowledge-base/08_arquitectura_propuesta.md` | Env vars, seguridad, estructura deploy |
| `knowledge-base/06_funcionalidades.md` | Páginas que necesitan SEO (landing, catálogo, políticas) |

## Reglas Duras

- **R3**: NUNCA secretos en `NEXT_PUBLIC_*` ni cliente
- **R6**: `next/image` con `sizes` reales + Storage optimizado (budget en KB)
- **R8**: Animaciones solo transform/opacity + `prefers-reduced-motion`

## Flujo de Trabajo Típico

1. **Deploy**: `deploy-to-vercel` → preview → producción (dominio custom)
2. **Perf**: `vercel-optimize` → métricas → recomendaciones rankedas → implementar
3. **SEO**: `seo-audit` → issues → fixes → re-auditoría
4. **Auditoría continua**: Lighthouse CI en PRs (`.github/workflows/`)

## Engram

Guardá config Vercel, hallazgos perf/SEO, decisions de caching con `topic_key: "opsx/{change-name}/deploy"`.