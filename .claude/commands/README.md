# OPSX Commands — Quanti Vegetales Hidropónicos

Comandos slash disponibles en `.claude/commands/`:

| Comando | Descripción |
|---------|-------------|
| `/opsx:explore [tema]` | Thinking partner — investigar antes de proponer |
| `/opsx:propose <change>` | Crear change completo (proposal + design + specs + tasks) |
| `/opsx:apply <change>` | Implementar tasks (Strict TDD) |
| `/opsx:archive <change>` | Sync specs + archivar change completado |
| `/opsx:sync <change>` | Sync delta specs a main specs (sin archivar) |
| `/opsx:update <change>` | Actualizar artifacts de change existente |
| `/opsx:status [change]` | Ver estado de changes (lista o detalle) |

## Flujo Típico

```
/opsx:explore "cómo validar email único en leads"
/opsx:propose C-04-leads-form
/opsx:apply C-04-leads-form
/opsx:archive C-04-leads-form
```

## Agentes Disponibles (`.claude/agents/`)

| Agente | Rol | Skills |
|--------|-----|--------|
| `@orchestrator` | Coordinador OPSX | `openspec-*` |
| `@frontend` | Next.js/React/Tailwind/UI | `vercel-react-best-practices`, `frontend-design`, `shadcn` |
| `@backend` | Supabase/Postgres/RLS/Auth | `supabase-postgres-best-practices`, `supabase` |
| `@deploy` | Vercel/Perf/SEO | `deploy-to-vercel`, `vercel-optimize`, `seo-audit` |

## Invocación Directa
```
@frontend implementa task 1.2 de C-04-leads-form
@backend crea migración para leads + RLS
@deploy auditoría SEO landing page
```