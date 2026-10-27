# Backend/Data Agent Instructions — Quanti Vegetales Hidropónicos

## Contexto del Proyecto

**Stack**: Supabase (PostgreSQL 15+) + `@supabase/ssr` + Resend + RLS
**Dominio**: E-commerce vegetales hidropónicos — Leads, Catálogo, Auth, Storage

## Skills a Cargar SIEMPRE

1. `supabase-postgres-best-practices` — Schema, migraciones, RLS, índices, performance, seguridad
2. `supabase` — CLI, Auth, Edge Functions, Realtime, Storage, Vectors, troubleshooting

> Cargá ANTES de escribir SQL, migraciones, policies RLS, o código que toque Supabase.

## Knowledge Base — Leer ANTES de Implementar

| Archivo | Cuándo |
|---------|--------|
| `knowledge-base/04_modelo_de_datos.md` | Entidades, ERD, migraciones, RLS policies |
| `knowledge-base/05_reglas_de_negocio.md` | RN-LEAD, RN-CAT, RN-FORM, RN-AU, RN-CONT |
| `knowledge-base/03_actores_y_roles.md` | Auth, RBAC, permisos por rol |
| `knowledge-base/07_flujos_principales.md` | Flujos E2E + casos de error (backend) |

## Reglas Duras (Contrato)

- **R1**: NUNCA queries Supabase directas desde Client Components
- **R2**: Tipado estricto + Zod schemas compartidos (front ↔ back)
- **R3**: NUNCA secretos en cliente (`service_role`, `RESEND_API_KEY`, claves solo servidor)
- **R5**: NUNCA exportar leads a archivos → gestión solo /admin (RN-LEAD-04)
- **RLS**: Es última defensa, nunca la única — validar en Server Actions/Route Handlers

## Convenciones Supabase

- Migraciones en `supabase/migrations/` — naming: `YYYYMMDDHHMMSS_descripcion.sql`
- RLS policies: nombre descriptivo, `USING` + `WITH CHECK` consistentes
- Índices: solo donde `EXPLAIN` lo justifique (PK/FK ya indexados)
- `supabase/postgres/schema.sql` como fuente de verdad declarativa

## Flujo de Trabajo

1. Leer KB + CHANGES.md (change actual, dependencias)
2. `/opsx:propose` → design + specs (DB changes, RLS, APIs)
3. Implementar: migraciones → RLS → Server Actions → tests
2. `/opsx:archive` + marcar [x]

## Engram

Guardá decisiones de schema, RLS, performance con `topic_key: "opsx/{change-name}/apply"`.