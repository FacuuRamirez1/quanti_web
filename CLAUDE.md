# Quanti Vegetales Hidropónicos — Instrucciones para Agentes

> Este archivo (y su copia `CLAUDE.md`) es lo PRIMERO que todo agente lee al entrar al repo.
> Generado a partir de `knowledge-base/` y `CHANGES.md`. No editar a mano sin re-sincronizar ambos archivos.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework full-stack | Next.js (App Router) + React | Next.js 15 |
| Estilos | Tailwind CSS | v4 |
| Animaciones | Framer Motion (o CSS Transitions si lo exige el presupuesto JS) | Última estable |
| Base de datos | PostgreSQL vía Supabase | Supabase (Postgres 15+) |
| Auth + Storage | Supabase Auth + Supabase Storage | `@supabase/ssr` |
| Email transaccional | Resend | Última estable |
| Deploy + hosting | Vercel + `quantihidroponia.com.ar` | — |
| Imágenes | `next/image` + Storage (productos) y `public/` (assets fijos) | — |

Detalle completo: [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md)

---

## Base de Conocimiento

La fuente de verdad del dominio vive en `knowledge-base/`. **Leé el archivo relevante ANTES de implementar.**

| Archivo | Cuándo leerlo |
|---------|---------------|
| [01_vision_y_objetivos.md](knowledge-base/01_vision_y_objetivos.md) | Entender propósito y alcance (I1 vs I2) |
| [03_actores_y_roles.md](knowledge-base/03_actores_y_roles.md) | Auth, RBAC, permisos |
| [04_modelo_de_datos.md](knowledge-base/04_modelo_de_datos.md) | Entidades, ERD, migraciones, RLS |
| [05_reglas_de_negocio.md](knowledge-base/05_reglas_de_negocio.md) | Reglas codificadas (RN-LEAD/CAT/FORM/AU/CONT) |
| [06_funcionalidades.md](knowledge-base/06_funcionalidades.md) | Historias de usuario por épica (US-001…US-011) |
| [07_flujos_principales.md](knowledge-base/07_flujos_principales.md) | Flujos E2E + casos de error |
| [08_arquitectura_propuesta.md](knowledge-base/08_arquitectura_propuesta.md) | Patrones, estructura, env vars, seguridad |
| [10_preguntas_abiertas.md](knowledge-base/10_preguntas_abiertas.md) | ⚠️ Inconsistencias a resolver ANTES de codear |
| [11_rendimiento_y_accesibilidad.md](knowledge-base/11_rendimiento_y_accesibilidad.md) | Presupuesto PageSpeed + checklist WCAG 2.1 AA |

> ⚠️ Resolver las preguntas de prioridad **Alta** de `10_preguntas_abiertas.md` antes de arrancar el primer change.

---

## Skills Disponibles

| Agente | Rol | Skills que carga |
|--------|-----|------------------|
| **Frontend** | Next.js/React/Tailwind, landing, catálogo, /admin UI | `vercel-react-best-practices`, `frontend-design`, `shadcn` |
| **Backend/Data** | Supabase, Postgres, RLS, Auth, Storage | `supabase-postgres-best-practices`, `supabase` |
| **Deploy/Perf/SEO** | Vercel, performance, auditoría SEO | `deploy-to-vercel`, `vercel-optimize`, `seo-audit` |
| **Utilidad** | Descubrir skills nuevas | `find-skills` |

Cargá la skill correspondiente al contexto ANTES de escribir código.

> Los compact rules de cada skill los resuelve el orquestador desde `.atl/skill-registry.md` (generado por `skill-registry`; no versionado — no está en el repo). Esta tabla solo mapea skill→rol.

---

## Roadmap de Changes

El plan de implementación completo está en [CHANGES.md](CHANGES.md). Resumen:

- **Total**: 11 changes en 4 fases.
- **Camino crítico** (7): Instancia 1 primero (C-01 → C-05, con C-03/C-04 en paralelo), luego Instancia 2 (C-06 → C-11).
- **Orden locked**: I1 completa y desplegable antes de arrancar I2.
- **Mandato vigente fuera de KB**: formulario I1 con checkbox obligatorio de Políticas + página `/politicas` + registro de consentimiento (vive en C-04 sobre columnas de C-02).
- **Primer change**: `C-01` (foundation-infra: Vercel + dominio + Supabase + Resend).

**Antes de cualquier `/opsx:propose`**: leé [CHANGES.md](CHANGES.md), identificá las dependencias del change y los archivos de "Leer antes".

---

## Reglas Duras

> Sin `~/.claude/CLAUDE.md` global detectado en esta máquina: las universales mínimas viven acá. Si un día aparece el global, U1–U2 se recortan a referencia.

Son contrato; romperlas es un defecto. Formato `NUNCA X → hacer Y`:

- **R1.** NUNCA queries Supabase directas desde Client Components → toda lectura sensible/mutación vía Server Components, Server Actions o Route Handlers validados (RLS es última defensa, nunca la única).
- **R2.** NUNCA `any` ni `tsconfig` no-estricto → tipado estricto + schemas de validación compartidos (ej. zod) usados en front Y back.
- **R3.** NUNCA secretos en el cliente → `service_role`, `RESEND_API_KEY` y claves solo en servidor; nada sensible en `NEXT_PUBLIC_*`.
- **R4.** NUNCA precios en ningún lado → ni en UI, ni en payloads, ni en el modelo (RN-CAT-01).
- **R5.** NUNCA exportar leads a archivos → gestión solo en /admin (RN-LEAD-04); email único con aviso amable, sin duplicar (RN-LEAD-05).
- **R6.** NUNCA imagen de contenido con `<img>` crudo → `next/image` con `sizes` reales + Storage optimizado (presupuesto en `11_rendimiento_y_accesibilidad.md`).
- **R7.** NUNCA WhatsApp como canal del sitio → formulario único + Instagram/Facebook (RN-FORM-03).
- **R8.** NUNCA animación fuera de transform/opacity ni sin `prefers-reduced-motion` → 60 FPS o nada (RN-CONT-03).
- **U1.** NUNCA commitear/pushear sin pedido explícito → los cambios quedan en working tree hasta que los pidas.
- **U2.** NUNCA dar por hecha una pregunta Alta de `10_preguntas_abiertas.md` → resolverla o registrarla antes de codear el change afectado.

---

## Flujo de Trabajo

```
1. Leer la KB relevante (knowledge-base/)        → entender el dominio
2. Identificar el change en CHANGES.md           → respetar dependencias y gates
3. /opsx:propose C-NN-nombre                     → proposal + design + specs + tasks
4. Implementar las tasks (cargando skills)       → respetando las reglas duras
5. /opsx:archive C-NN-nombre + marcar [x]        → cerrar el change
```

Aplicar TODAS las reglas duras en cada paso. Ante conflicto entre la KB y este archivo, las reglas duras prevalecen.
