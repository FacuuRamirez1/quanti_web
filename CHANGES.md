# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **quanti-web** (Quanti Vegetales Hidropónicos).
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Leer este archivo antes de ejecutar cualquier `/opsx:propose`.**

> **Orden locked**: la Instancia 1 (C-01 → C-05) va PRIMERO y completa. La Instancia 2 (C-06 → C-11) va DESPUÉS, en orden de hitos del DRF.
> **Adición fuera de KB (mandato de usuario, vigente)**: el formulario de Instancia 1 incluye casilla obligatoria de aceptación de Políticas de Seguridad/Privacidad + página/sección de políticas a redactar/aprobar + validación FE+BE + registro del consentimiento. Vive en C-04 (UI + Action) sobre la columna creada en C-02. La KB predates este requisito: ante conflicto, vale este mandato con trazabilidad aquí.

---

## Cómo usar este documento

1. Identificar el change a implementar (verificar que sus dependencias están en `openspec/changes/archive/`).
2. Leer los docs de la knowledge-base indicados en "Leer antes".
3. Ejecutar `/opsx:propose <nombre-del-change>` (p. ej. `/opsx:propose C-01-foundation-infra`).
4. Al terminar el change, archivarlo con `/opsx:archive <nombre-del-change>`.
5. Marcar el checkbox `[x]` en este archivo.

---

## Árbol de dependencias

```
C-01 foundation-infra
  └── C-02 leads-data-model
        ├── C-03 auth-admin-shell
        │     └── C-05 admin-leads-view ──← sincroniza Instancia 1 ──┐
        │                                                           │
        └── C-04 landing-captura-politicas ──← paralelo con C-03 ────┘
                              │
                    (C-05 requiere C-03 + C-04)
                                    │
                      C-05 admin-leads-view
                        ├── C-06 sitio-institucional
                        │     ├── C-08 catalogo-publico ──┐
                        │     │     (+ C-07)              │
                        │     └── C-09 contacto-resend-faq │← paralelo con C-07/C-08
                        │                                │
                        └── C-07 catalog-models-storage ──┤
                                └── C-10 admin-catalogo-crud
                                        │
                          C-08 + C-09 + C-10 ✓
                                    │
                              C-11 hardening-lanzamiento
```

### Paralelismo por fase

> Cada "gate" es un punto de sincronización. Los changes dentro de un grupo pueden ejecutarse en paralelo.

```
GATE 0: ninguna
  → C-01 foundation-infra (solo)

GATE 1: C-01 ✓
  → C-02 leads-data-model (solo)

GATE 2: C-02 ✓                          ← PRIMER FORK (2 paralelos, Instancia 1)
  → C-03 auth-admin-shell               [Agente A]
  → C-04 landing-captura-politicas      [Agente C]

GATE 3: C-03 + C-04 ✓                   ← SYNC Instancia 1
  → C-05 admin-leads-view (solo)        [Agente A]

GATE 4: C-05 ✓                          ← SEGUNDO FORK (2 paralelos, arranca Instancia 2)
  → C-06 sitio-institucional            [Agente C]
  → C-07 catalog-models-storage         [Agente A]

GATE 5: C-06 ✓
  → C-09 contacto-resend-faq            [Agente B — en paralelo con C-07/C-08]
  → C-10 admin-catalogo-crud            [Agente A — si C-07 ✓]

GATE 6: C-06 + C-07 ✓
  → C-08 catalogo-publico               [Agente C]
  → C-10 admin-catalogo-crud            [Agente A — si aún no tomado en GATE 5]

GATE 7: C-08 + C-09 + C-10 ✓
  → C-11 hardening-lanzamiento (solo)
```

### Camino crítico (7 changes — mínimo irreducible)

```
C-01 → C-02 → C-03 → C-05 → C-06 → C-08 → C-11
```

> C-04 se absorbe en paralelo con C-03 (no alarga). C-07 se resuelve en paralelo con C-06 (C-08 la espera a ambas). C-09 y C-10 corren en paralelo sin alargar el crítico. Excepción documentada a la regla "admin al final": C-05 va en Instancia 1 por DD-02 (admin de lectura adelantado, decisión del responsable).

### Plan óptimo con 3 agentes

```
Paso │ Agente A (Backend Core)      │ Agente B (Backend Aux)       │ Agente C (Frontend)
─────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────
  1  │ C-01 foundation-infra        │ —                            │ —
  2  │ C-02 leads-data-model        │ —                            │ —
  3  │ C-03 auth-admin-shell        │ —                            │ C-04 landing-captura-politicas
  4  │ C-05 admin-leads-view        │ —                            │ —
  5  │ C-07 catalog-models-storage  │ C-09 contacto-resend-faq *    │ C-06 sitio-institucional
  6  │ C-10 admin-catalogo-crud     │ — (apoya review C-08)        │ C-08 catalogo-publico
  7  │ —                            │ —                            │ C-11 hardening-lanzamiento
```

> \* C-09 puede arrancar en cuanto C-06 tiene layout + vars Resend (GATE 5); no espera a C-07/C-08. C-11 lo ejecuta un solo agente (auditoría global); los otros dos hacen review/QA en paralelo fuera del camino crítico.

---

## FASE 1 — Instancia 1: Infraestructura, datos y acceso

> C-03 y C-04 corren en paralelo tras C-02. C-05 sincroniza y cierra la Instancia 1 desplegable.

### [C-01] `foundation-infra`
- **Estado**: `[ ]` pendiente
- **Scope**: Scaffolding + infra base del Hito 1 (un producto, dos releases — DD-01)
  - Next.js 15 (App Router) + React + Tailwind v4 + Framer Motion (última estable) + `next/image`; estructura `app/ (publico) + admin + actions + api mínimo / components / lib/supabase + validaciones.ts + clientes.ts / public/clientes/ / supabase/migrations + seed.sql / middleware.ts` según `08`
  - Clientes Supabase `@supabase/ssr` (`lib/supabase/client, server, middleware`) + `.env.example` con `NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (solo servidor), RESEND_API_KEY, CONTACTO_DESTINO, RESEND_REMITENTE`; service role jamás en cliente
  - Proyecto Supabase creado (Postgres 15+), proyecto Vercel conectado a `quantihidroponia.com.ar` con HTTPS + previews por PR; cuenta Resend + dominio/remitente en proceso de verificación (cierre total en C-09)
  - `middleware.ts` stub que protege `/admin/*` (lógica completa en C-03); health check mínimo
  - Lighthouse CI en cada PR con umbrales del presupuesto (PageSpeed móvil ≥ 85, LCP ≤ 2.5s, CLS ≤ 0.1, JS inicial ≤ 170KB gzip); `lang="es"`, skip-link y tokens Figma como guía (no pixel-perfect)
  - Tests: build + health + envs requeridas presentes; checklist WCAG base verificado en scaffold
- **Dependencias**: ninguna
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Alcance v1.0
  - `knowledge-base/02_descripcion_general.md` §Stack
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios + §Variables de entorno + §Decisiones de deploy
  - `knowledge-base/10_preguntas_abiertas.md` §Acceso DNS + §Planes Vercel/Supabase/Resend

---

### [C-02] `leads-data-model`
- **Estado**: `[ ]` pendiente
- **Scope**: Modelo de captación + roles (base de todo lo demás)
  - Migración 001: `posibles_clientes (id UUID PK default gen_random_uuid(), nombre TEXT NOT NULL, apellido TEXT NOT NULL, email CITEXT NOT NULL, acepta_politicas BOOLEAN NOT NULL DEFAULT false, politicas_version TEXT, consent_at TIMESTAMPTZ, created_at TIMESTAMPTZ default now())` + `CHECK (nombre <> '' AND apellido <> '')` + `UNIQUE (lower(email))` + índice `created_at DESC`
  - **NUEVO (mandato fuera de KB)**: columnas de consentimiento (`acepta_politicas`, `politicas_version` p. ej. `v1.0`, `consent_at`); `CHECK (acepta_politicas = true)` a nivel app + constraint DB documentado; sin consentimiento no hay INSERT válido
  - Roles: UNA sola fuente de verdad (decidir en este change y documentar en `09`: `auth.users.user_metadata.role` o tabla `perfiles (id UUID PK→auth.users, role CHECK admin|superadmin)`)
  - RLS: `posibles_clientes` → `INSERT` público solo vía Server Action validada + rate limit; `SELECT` solo `admin/superadmin`; sin `UPDATE/DELETE` público
  - Seed: 1 usuario admin inicial (manual en Supabase Auth + rol); 0 leads de prueba persistentes (o efímeros documentados)
  - Tests: INSERT válido, email duplicado (case-insensitive) rechazado, INSERT sin `acepta_politicas=true` rechazado, SELECT anónimo denegado, SELECT admin permitido
- **Dependencias**: C-01
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §posibles_clientes + §perfiles + §RLS
  - `knowledge-base/05_reglas_de_negocio.md` §RN-LEAD + §RN-AU-02
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad (RLS como última defensa)
  - `knowledge-base/10_preguntas_abiertas.md` §Fuente de roles + §Filtro de leads

---

### [C-03] `auth-admin-shell`
- **Estado**: `[ ]` pendiente
- **Scope**: Autenticación y cáscara protegida del admin (adelantado a Instancia 1 por DD-02)
  - `/admin/login` (pública, solo formulario): email + password → `signInWithPassword`; error genérico sin revelar existencia de usuario; `aria-describedby`/`role="alert"` en errores
  - `middleware.ts` Supabase completo: protege `/admin/*`, crea/refresca cookies `httpOnly`/`secure`, redirige con sesión válida a `/admin`
  - Resolución de rol por la fuente elegida en C-02 (metadata o `perfiles`); sin rol suficiente → 403 + aviso interno; logout cierra sesión en cliente y servidor
  - Link discreto al admin en el footer (RN-AU-03, visible desde Instancia 1; footer completo en C-06/C-09)
  - Tests: login ok, credenciales inválidas, sesión expirada/refresh, ruta `/admin` sin sesión redirige, rol insuficiente → 403
- **Dependencias**: C-02
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §RBAC + §Rutas protegidas
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AU
  - `knowledge-base/07_flujos_principales.md` §Flujo 3: Login admin
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad (Auth + Middleware)

---

## FASE 2 — Instancia 1: Captación y panel de leads

> Cierra la Instancia 1 desplegable: landing + políticas + captura con consentimiento + /admin de lectura. Incluye el scope NUEVO de políticas/checkbox (no está en la KB).

### [C-04] `landing-captura-politicas`
- **Estado**: `[ ]` pendiente
- **Scope**: Landing "Próximamente" + captura con consentimiento + políticas (US-001, US-002 + mandato NUEVO)
  - `/` landing: hero con logo, mensaje institucional e imagen de cultivos prioritaria (`priority`+`fetchpriority`, CLS ≤ 0.1), guía Figma (tokens, no pixel-perfect); responsive móvil/tablet/desktop; PageSpeed móvil ≥ 85
  - Formulario: nombre + apellido + email (los 3 obligatorios, validación en tiempo real) + **casilla obligatoria "Acepto las Políticas de Seguridad/Privacidad"** con enlace a las políticas; submit deshabilitado sin checkbox; errores anunciados (`aria-describedby`/`role="alert"`, sin depender solo del color)
  - Página/sección `/politicas` (o sección anclada): **texto legal a redactar y aprobar** (versión `v1.0`, fecha de vigencia visible); `politicas_version` se persiste con cada lead; cambios futuros de texto = nueva versión (migración de contenido, no de este change)
  - Server Action `registrarLead` (`app/actions/leads.ts`, schema zod compartido `lib/validaciones.ts`): re-valida todo incl. `acepta_politicas === true`, normaliza email (`lower+trim`), INSERT en `posibles_clientes` con `politicas_version + consent_at=now()`; email duplicado → aviso amable "ya estás en la lista" sin crear ni modificar; email inválido → error de campo sin guardar; honeypot + rate limit básicos; caída Supabase → error genérico + reintento
  - Confirmación visual de éxito ("¡Te avisaremos del lanzamiento!"); el registro aparece en /admin (verificación E2E con C-05)
  - Tests: validación FE, re-validación BE, duplicado case-insensitive, submit sin checkbox rechazado FE+BE, INSERT guarda `politicas_version/consent_at`, RLS permite INSERT anónimo validado
- **Dependencias**: C-02
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-001 + §US-002
  - `knowledge-base/05_reglas_de_negocio.md` §RN-LEAD
  - `knowledge-base/07_flujos_principales.md` §Flujo 1: Registro de lead
  - `knowledge-base/11_rendimiento_y_accesibilidad.md` §Presupuesto + §Checklist WCAG formularios
  - `knowledge-base/08_arquitectura_propuesta.md` §RSC + Server Actions

---

### [C-05] `admin-leads-view`
- **Estado**: `[ ]` pendiente
- **Scope**: Panel de lectura de leads (US-007, US-010 en lo que toca a esta vista)
  - `/admin` (RSC, tras middleware + rol): tabla `posibles_clientes` ordenada `created_at DESC`, paginada; columnas nombre/apellido/email/fecha (+ versión de políticas y fecha de consentimiento como columnas visibles, por el mandato NUEVO)
  - Filtros server-side por fecha/email/nombre (búsqueda en servidor, no en cliente; alcance SU-02 — si piden más filtros, change nuevo)
  - Sin exportación a archivos (RN-LEAD-04 / DD-03, explícito: nada de CSV/Excel); gestión vive en el panel
  - Tabla accesible (`<table>` semántica, foco visible, paginación operable por teclado); estados vacíos y de error amables
  - Tests: requiere sesión + rol (anónimo → login, sin rol → 403), filtros fecha/email/nombre, paginación, no existe ruta/acción de export
- **Dependencias**: C-03, C-04
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-007 + §US-010
  - `knowledge-base/07_flujos_principales.md` §Flujo 4: Ver y filtrar leads
  - `knowledge-base/03_actores_y_roles.md` §RBAC + §Rutas protegidas
  - `knowledge-base/05_reglas_de_negocio.md` §RN-LEAD-04 + §RN-AU-01/02
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-02 + §DD-03 + §SU-02

---

## FASE 3 — Instancia 2: Sitio definitivo y catálogo

> Evoluciona el mismo codebase (DD-01). C-06 y C-07 en paralelo tras C-05. C-09 corre en paralelo con C-07/C-08.

### [C-06] `sitio-institucional`
- **Estado**: `[ ]` pendiente
- **Scope**: Home + Nosotros + footer definitivo (US-003, US-004; `/` evoluciona de landing a Home)
  - Home: hero + CTAs a catálogo y contacto; carrusel interactivo de logos de clientes (assets fijos `public/clientes/*.webp` + lista única `lib/clientes.ts`); animaciones GPU (transform/opacity) a 60 FPS con `prefers-reduced-motion`; carrusel accesible (prev/next con nombre, pausa si hay autoplay, sin secuestro de foco)
  - Nosotros: historia + propuesta hidropónica (agua, sin pesticidas, sustentabilidad) + sección puntos de venta con LA MISMA lista de logos (doble placement, RN-CONT-01)
  - Footer definitivo: Instagram, Facebook, email institucional, link discreto admin; sin WhatsApp (DD-04); "cobertura" no existe como sección (IN-03)
  - Textos institucionales, FAQ-base y hero versionados en repo (sin CMS); `next/image` con `sizes` reales; PageSpeed móvil ≥ 85 por página
  - Tests: misma lista en carrusel y puntos de venta (single source), `alt` con nombre del cliente, navegación por teclado, Lighthouse por página
- **Dependencias**: C-05
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-003 + §US-004
  - `knowledge-base/05_reglas_de_negocio.md` §RN-CONT
  - `knowledge-base/08_arquitectura_propuesta.md` §Contenido estático versionado
  - `knowledge-base/11_rendimiento_y_accesibilidad.md` §Estrategia de imágenes + §Checklist WCAG carrusel
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-06 + §DD-07

---

### [C-07] `catalog-models-storage`
- **Estado**: `[ ]` pendiente
- **Scope**: Datos del catálogo + Storage (base de US-006/US-008/US-009)
  - Migración 002: `categorias (id BIGINT IDENTITY PK, nombre TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE kebab-case en app, orden INT default 0, created_at)` + `productos (id BIGINT IDENTITY PK, categoria_id BIGINT FK→categorias NOT NULL ON DELETE RESTRICT, nombre TEXT NOT NULL, descripcion TEXT, imagen_url TEXT, orden INT default 0, activo BOOLEAN default true, created_at/updated_at)`; **sin columna de precio en modelo ni payloads** (RN-CAT-01)
  - RLS: `productos/categorias` → `SELECT` público (productos con `activo=true`); `INSERT/UPDATE/DELETE` solo `admin/superadmin`
  - Storage bucket `productos`: lectura pública, escritura solo admin/superadmin; validación tipo/tamaño en servidor (p. ej. máx. 2 MB, formatos modernos) + transformación a ancho limitado
  - Seed: 3 categorías (`Hojas Verdes`, `Hierbas Aromáticas`, `Microgreens`) + 2–3 productos ejemplo `activo=false` como plantilla
  - Tests: FK + RESTRICT al borrar categoría con productos, SELECT público no ve inactivos, escritura anónima denegada, upload inválido/pesado rechazado
- **Dependencias**: C-05
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §categorias + §productos + §RLS + §Seed data
  - `knowledge-base/05_reglas_de_negocio.md` §RN-CAT
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad (Storage) + §Estructura supabase/
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-06

---

### [C-08] `catalogo-publico`
- **Estado**: `[ ]` pendiente
- **Scope**: Catálogo público por solapas (US-006)
  - `/catalogo` (RSC): una query categorías + productos activos con `orden`; solapas (Hojas Verdes, Aromáticas, Microgreens); fichas con imagen optimizada + nombre + descripción; **sin precios en UI ni en payloads**
  - CTAs hacia contacto/redes en cada vista; revalidación bajo demanda al cambiar el catálogo (hook consumido por C-10); `next/image` + CLS reservado; PageSpeed móvil ≥ 85
  - Tests: solo `activo=true` visibles, payloads sin campo precio, solapas por teclado, revalidación refleja cambios
- **Dependencias**: C-06, C-07
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-006
  - `knowledge-base/07_flujos_principales.md` §Flujo 6: Navegación pública del catálogo
  - `knowledge-base/04_modelo_de_datos.md` §categorias + §productos
  - `knowledge-base/05_reglas_de_negocio.md` §RN-CAT-01 + §RN-CAT-04/05
  - `knowledge-base/11_rendimiento_y_accesibilidad.md` §Estrategia de imágenes

---

### [C-09] `contacto-resend-faq`
- **Estado**: `[ ]` pendiente
- **Scope**: FAQ + formulario único vía Resend (US-005; cierra RF-07)
  - `/faq-contacto` (o secciones en Home según layout de C-06): acordeón FAQ operable por teclado con las preguntas del cliente; formulario ÚNICO nombre + email + mensaje (todos obligatorios, B2C+B2B+general — DD-05)
  - Server Action `enviarContacto` (`app/actions/contacto.ts`, schema compartido): re-valida, llama Resend con `RESEND_REMITENTE` verificado → `CONTACTO_DESTINO`; remitente sin verificar o Resend caído → error amable + sugerencia de redes; honeypot + rate limit; ningún mensaje se pierde en silencio (log interno)
  - Confirmación ("te responderemos a la brevedad"); footer con Instagram/Facebook/email ya definitivo desde C-06
  - RF-07 no se considera cerrado sin casilla destino + remitente verificado (RN-FORM-02; bloqueadores en `10`: DNS NIC.ar, casilla destino, registros Resend)
  - Tests: validación FE+BE, envío ok (mock Resend), remitente sin verificar → error amable, spam bloqueado por honeypot/rate limit
- **Dependencias**: C-06
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-005
  - `knowledge-base/07_flujos_principales.md` §Flujo 2: Contacto vía formulario único
  - `knowledge-base/05_reglas_de_negocio.md` §RN-FORM + §RN-CONT-03
  - `knowledge-base/08_arquitectura_propuesta.md` §Variables de entorno (Resend)
  - `knowledge-base/10_preguntas_abiertas.md` §Casilla destino + §Remitente verificado + §DNS

---

## FASE 4 — Instancia 2: Administración y lanzamiento

### [C-10] `admin-catalogo-crud`
- **Estado**: `[ ]` pendiente
- **Scope**: CRUD admin de categorías y productos con imágenes (US-008, US-009; mantiene vista de leads)
  - `/admin/categorias`: alta/edición/baja; slug auto-generado kebab-case; eliminar bloqueado con productos (RESTRICT) + mensaje claro
  - `/admin/productos`: alta/edición/baja + activar/desactivar; upload validado (tipo/tamaño) en cliente y servidor → Storage bucket `productos` → URL pública optimizada; vista previa de ficha tal como la ve el público
  - Mutaciones en `app/actions/admin/*` protegidas (sesión + rol + RLS); revalidación bajo demanda del catálogo público solo si `activo=true`; `/admin` de leads (C-05) intacto
  - Tests: CRUD por rol (anónimo denegado), RESTRICT con mensaje, toggle `activo` refleja/oculta en público, upload inválido rechazado antes de subir
- **Dependencias**: C-05, C-07
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-008 + §US-009
  - `knowledge-base/07_flujos_principales.md` §Flujo 5: CRUD de producto con imagen
  - `knowledge-base/04_modelo_de_datos.md` §categorias + §productos + §RLS Storage
  - `knowledge-base/05_reglas_de_negocio.md` §RN-CAT-02/03/04 + §RN-AU-02
  - `knowledge-base/03_actores_y_roles.md` §RBAC Admin

---

### [C-11] `hardening-lanzamiento`
- **Estado**: `[ ]` pendiente
- **Scope**: Endurecimiento final y conformidad de lanzamiento (RNF-01…RNF-04 + métricas)
  - Auditoría por página: PageSpeed móvil ≥ 85, LCP ≤ 2.5s, CLS ≤ 0.1, JS ≤ 170KB gzip; pasada WCAG 2.1 AA completa (contraste ≥ 4.5:1, foco visible, `h1` único, landmarks, `alt` significativos, FAQ/carrusel/tablas por teclado, NVDA/VoiceOver); `prefers-reduced-motion` verificado; SEO SSR (títulos únicos, `lang="es"`, metadata)
  - Producción: DNS + TLS verificados en `quantihidroponia.com.ar`, previews por PR, env vars solo en servidor, service role nunca expuesto; Resend remitente + casilla destino verificados E2E
  - Criterios de cierre: 0 errores a11y críticos, catálogo administrable sin dev (adopción admin), rebote del formulario < 30%, conformidad liviana del cliente por hito (SU-04) registrada
  - Tests: Lighthouse CI en verde en todas las rutas, pasada manual de teclado + lector documentada, smoke E2E (lead → admin → catálogo → contacto)
- **Dependencias**: C-08, C-09, C-10
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/11_rendimiento_y_accesibilidad.md` (completo: presupuesto + WCAG + verificación)
  - `knowledge-base/01_vision_y_objetivos.md` §Métricas de éxito + §Fuera de alcance
  - `knowledge-base/02_descripcion_general.md` §Deploy + §Arquitectura general
  - `knowledge-base/10_preguntas_abiertas.md` §Textos FAQ/fotos + §Framer Motion vs CSS + §Aprobación

---
