# Design — C-04 landing-captura-politicas

## Context

Ver `proposal.md` (Why + scope) y `specs/landing-captura-politicas/spec.md` (contrato observable). Estado actual: C-01 archivado — `/` es placeholder estático, `app/layout.tsx` ya trae `lang="es"`, skip-link, landmarks y link discreto `/admin/login` en footer; `lib/supabase/{client,server}` patrón `@supabase/ssr` verificado. C-02 archivado — `posibles_clientes` con `acepta_politicas`/`politicas_version`/`consent_at` + `CHECK (acepta_politicas = true)` + índice único `lower(email)` + RLS (INSERT anon/authenticated con `WITH CHECK`, SELECT solo admin vía `perfiles`) verificada live; `leadSchema` en `lib/validaciones.ts` (nombre/apellido trim+min(1), email trim+lowercase+email, `acepta_politicas: z.literal(true)`) es el único contrato app. C-03 en curso (7/9 tasks) — `lib/rate-limit.ts` in-memory dual IP+email con backoff 2/10/30 min + honeypot `website` con copia byte-idéntica + Server Action `signInWithPassword` como patrón a espejar; matriz live 2.2/4.1 pendiente y combinada con el E2E de este change en una sola sesión. Este change no toca DB. Contenido en español rioplatense-neutro, tono institucional.

## Goals / Non-Goals

**Goals:**

- Landing `/` real sobre el scaffold C-01 sin romper su base accesible ni el footer/link admin.
- Captura con consentimiento que importa (no copia) el contrato C-02 y el enfoque anti-abuso C-03.
- `/politicas` v1.0 como fuente visible del `politicas_version` persistido.
- E2E lead→/admin verificable en la sesión live combinada con C-03.

**Non-Goals:**

- Tabla/filtros/paginación de leads (C-05); footer definitivo, Home/Nosotros/catálogo/FAQ (C-06…C-09); gestión de roles UI, recovery/MFA/OAuth (fuera de KB).
- Migraciones DB o cambios RLS (contrato C-02 intacto); rate limit distribuido/Redis (mismo trade-off documentado de C-03).
- Redacción legal definitiva sin aprobación del usuario (el texto v1.0 se propone acá, se implementa tras checkpoint).

## Decisions

1. **Landing RSC + isla cliente solo para el formulario (espejo del login C-03).** `app/page.tsx` (RSC) renderiza hero + compone el formulario; el formulario es un Client Component mínimo solo para UX (validación en tiempo real con el mismo `leadSchema` vía `zodResolver`-equivalente o validación manual espejo, estado pending con `useActionState`, `disabled` del botón atado al checkbox + validez). Rationale: R1 (cero queries Supabase desde cliente) + vercel-react-best-practices (minimizar lo que baja al cliente, `next/dynamic` si el hero animado pesa). Alternativa (todo cliente) descartada: rompería R1/R2 y el SSR/SEO del hero.
2. **`registrarLead` espeja el orden pineado de `signInWithPassword`.** `app/actions/leads.ts` (`"use server"`): (a) honeypot — campo señuelo invisible (mismo patrón `website`, `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`, off-screen sin `display:none`); si llega no-vacío → retorno éxito-simulated o aviso neutro SIN INSERT (decisión: responder el MISMO éxito aparente para no revelar el señuelo — a confirmar en review; nunca error que delate); (b) validación `leadSchema.safeParse` (incl. `acepta_politicas` literal); errores por campo; (c) rate limit server-side (Decisión 3); (d) INSERT con cliente servidor anon (`politicas_version = POLITICAS_VERSION`, `consent_at = new Date().toISOString()`); duplicado `23505` → aviso "ya estás en la lista" sin SELECT previo (evita TOCTOU y no filtra por timing diferencial más allá del inevitable); éxito → confirmación. Rationale: paridad C-03 (orden, R1, no confiar en cliente) + RN-LEAD-05 sin crear/modificar. Alternativa (SELECT-then-INSERT) descartada: carrera + fuga de existencia.
3. **Rate limit: extender `lib/rate-limit.ts`, no duplicarlo.** Agregar entry points `checkLeadRateLimit/recordLeadFailure` (o generalizar el core) que compartan mecánica (Map in-memory, ventana deslizante, clave dual IP+email normalizadas) con umbrales propios para formulario público (propuesta: 5 envíos/10 min por IP+email con backoff corto — a pineear en implementación; el login es más estricto por ser credential-stuffing, el lead es spam-freno). El conteo solo ante intento real no-honeypot; el honeypot no toca contadores (misma regla C-03: no envenenable). Rationale: consistencia pedida en el change context + un solo módulo a reemplazar por Redis si escala. Alternativa (módulo separado copiado) descartada: divergencia garantizada.
4. **Versión de políticas como constante única.** Nuevo `lib/politicas.ts` (o const en el módulo que se pineé en implementación): `POLITICAS_VERSION = "v1.0"` + `POLITICAS_EFFECTIVE_DATE`. La Action la persiste; `/politicas` la muestra; el formulario enlaza. Rationale: single source para el `politicas_version` auditable; cambios futuros = bump de constante + contenido (fuera de este change). Alternativa (string hardcodeado en 3 lugares) descartada: divergencia versión-mostrarada vs versión-persistida.
5. **Hero con `next/image` prioritaria, asset fijo en `public/`.** Una sola imagen (cultivos), `priority` + `fetchPriority="high"`, `sizes` reales por viewport, dimensiones reservadas (CLS), resto diferido; asset fijo versionado en repo (patrón logos `public/clientes/`, no Storage — RN-CAT-05 por analogía). Animación solo transform/opacity + `prefers-reduced-motion` (R8); Framer Motion solo si cabe en JS ≤ 170KB, si no CSS Transitions (KB 11). Rationale: LCP ≤ 2.5s + CLS ≤ 0.1 con R6 cumplido. Alternativa (Storage para hero) descartada: latencia + firma innecesarias para asset estático.
6. **Formulario shadcn accesible con submit deshabilitado explicado.** Componer `FieldGroup + Field` (`data-invalid` + `aria-invalid` + `FieldError`), checkbox con `FieldLabel`/`FieldLegend` asociada + enlace a `/politicas`, `Button disabled` hasta checkbox (con texto de ayuda visible "Aceptá las políticas para continuar" — el `disabled` solo no se anuncia, el texto sí), `Alert` con `role="alert"` para errores de Action y éxito. Rationale: checklist WCAG formularios KB 11 con componentes existentes (mismo stack que `login-form.tsx`). Alternativa (habilitar submit y solo validar en servidor) descartada: contradice la decisión de usuario locked.
7. **`/politicas` RSC estática con texto propuesto v1.0.** Página server-rendered, `h1` único, jerarquía sin saltos, fecha de vigencia visible arriba. El texto se redacta en tasks como borrador legal (alcance: qué datos se guardan, para qué, base del consentimiento, derechos del titular, contacto, versiones) y NO se implementa sin el checkpoint de aprobación del usuario. Rationale: el `politicas_version` persistido necesita un texto al que referir; sin aprobación es contenido legal sin dueño.

## Risks / Trade-offs

- [Riesgo] Texto legal sin aprobación bloquea la implementación → Mitigación: checkpoint explícito en tasks (T-aprobación); sin "aprobado" no se escribe `/politicas` ni se cierra el change (U2 espíritu: no dar por hecho contenido sensible).
- [Riesgo] Asset hero inexistente/pesado rompe LCP/CLS → Mitigación: placeholder dimensionado + `sizes` desde el día 1; la imagen final se optimiza (`.webp`/avif, ancho limitado) antes del gate Lighthouse; si no hay foto, hero tipográfico con reserva de espacio (CLS igual).
- [Trade-off] Rate limit in-memory heredado de C-03 → aceptado: vive por instancia (cold start lo reinicia, atacante distribuido lo diluye, clave por email mitiga parcial); freno suficiente para formulario de bajo tráfico + RLS/CHECK como defensa real. Reemplazo por backend persistente = change nuevo sin cambiar la Action.
- [Riesgo] Duplicado revela existencia por timing/error-code → Mitigación: sin SELECT previo, catch `23505` → misma copia amable; no log diferencial con PII; la diferencia de timing INSERT-vs-rechazo se acepta como inevitable (igual que C-03).
- [Riesgo] Botón `disabled` inaccesible/confuso (el usuario no entiende por qué no avanza) → Mitigación: texto de ayuda visible + `aria-describedby` al checkbox; el servidor re-valida igual (el `disabled` es UX, no seguridad).
- [Riesgo] Sesión live C-03+C-04 acopla dos changes → Mitigación: intencional y coordinado (el E2E de C-04 necesita login live de C-03); una sola sesión verifica matriz 2.2/4.1 de C-03 + registro→/admin de C-04; si C-03 no está verde, el E2E queda pendiente sin bloquear el resto de tasks.

## Migration Plan

1. Implementación (sin DB): `app/page.tsx` + formulario cliente + `app/actions/leads.ts` + `app/politicas/page.tsx` + `lib/politicas.ts` + extensión `lib/rate-limit.ts`; hero asset en `public/`; estilos con tokens Figma.
2. Verificación: `tsc + lint + build` verdes; flujos (validación FE, re-validación BE, duplicado exacto + case-insensitive, submit sin checkbox FE+BE, honeypot/rate-limit sin INSERT, INSERT guarda versión/consent_at, RLS anon-INSERT ok); Lighthouse móvil ≥ 85 + CLS ≤ 0.1; pasada teclado/lector (foco visible, `role="alert"`, checkbox operable, `disabled` con ayuda); E2E live combinado con C-03 (lead → /admin).
3. Rollback: revert del change (C-02/C-03 intactos; `/` vuelve a placeholder C-01); sin datos que migrar (filas de prueba efímeras se borran, regla C-02).
4. Post-merge: C-05 consume los leads + columnas de consentimiento sin modificar captura.

## Open Questions

- Fecha de vigencia de v1.0: ¿fecha de aprobación del texto o fecha de deploy a producción? (No cambia specs/approach/tasks: la constante `POLITICAS_EFFECTIVE_DATE` se setea con la que el usuario indique en el checkpoint.)
- Asset final del hero: ¿foto propia de cultivos o placeholder optimizado hasta contar con material? (No cambia el diseño: reserva de espacio + `sizes` iguales en ambos casos.)
