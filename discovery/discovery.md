# Discovery — Quanti Vegetales Hidropónicos

**Fecha**: 2026-10-02
**Fuentes investigadas**: DRF v1.0 (Julio 2026, PDF en repo) + guía visual en Figma + 2 rondas de Q&A con el responsable del proyecto. Sin competidores con URL — no hubo scraping.

> Nota de trazabilidad: este Discovery **modifica el DRF en 4 puntos** — (1) el formulario de Instancia 1 pide nombre + apellido + email, no solo email; (2) el Admin Page deja de ser "En Evaluación" y va en ambas instancias; (3) los leads viven en la DB Postgres gestionada vía Supabase y el admin los ve/filtra desde /admin, sin exportación a archivos; (4) el contacto del visitante es por formulario o redes (Instagram/Facebook), sin WhatsApp. `kb-creator` debe tomar estos puntos como vigentes sobre el DRF.

## 1. Problema que resuelve

Quanti vende hoy por redes sociales + contactos personales, sin presencia web propia. Necesita posicionar la marca y generar expectativa capturando interesados (Instancia 1: landing "Próximamente"), para luego operar un sitio institucional completo que presente su historia, su método hidropónico, su catálogo y sus canales de contacto, con gestión propia del contenido (Instancia 2: sitio definitivo + /admin).

## 2. Usuarios / roles

- **Visitante B2C**: busca origen de los vegetales, beneficios del cultivo sin agrotóxicos, puntos de venta y contacto.
- **Cliente B2B mayorista**: evalúa catálogo disponible y capacidad de provisión (usa el mismo formulario genérico que B2C — decisión consciente, ver punto 6).
- **Admin Quanti**: ve y filtra los posibles_clientes (desde Instancia 1); hace CRUD de productos y categorías con imágenes (desde Instancia 2).
- **SuperAdmin Dev**: auditoría, soporte, autenticación e infraestructura.

## 3. Casos de uso

1. Como visitante, quiero dejar mi nombre, apellido y email en la landing para enterarme del lanzamiento.
2. Como visitante, quiero ver el catálogo por categorías (Hojas Verdes, Hierbas Aromáticas, Microgreens) sin precios, para conocer la oferta.
3. Como visitante o mayorista, quiero contactar por el formulario genérico o por redes (Instagram/Facebook) para consultar o pedir provisión.
4. Como admin, quiero ver y filtrar los posibles_clientes desde la Instancia 1.
5. Como admin, quiero dar de alta, editar, eliminar y categorizar productos (con imágenes) desde la Instancia 2.

## 4. Competidores / soluciones existentes

Sin sitio de referencia directo (confirmado por el responsable). La "competencia" es el canal actual: venta informal por redes sociales + contactos personales.

| Canal actual | Problema que resuelve | Limitación |
|---|---|---|
| Redes sociales + contactos | Visibilidad básica y venta directa sin costos | Sin marca posicionada, sin captura sistemática de interesados, sin catálogo consultable |

**Diferenciador a construir**: hidroponía, ahorro de agua, ausencia de pesticidas, compromiso con la sustentabilidad — es lo que el sitio debe contrastar contra la venta informal.

## 5. Funcionalidades necesarias

**Instancia 1 (landing + base operativa)**:
- Landing "Próximamente" responsiva con identidad Quanti (RF-01), usando el Figma como guía visual.
- Formulario de captura con **nombre + apellido + email**, validación en front-end y back-end (RF-02 modificado).
- DB Postgres gestionada vía Supabase con tabla `posibles_clientes` (nombre, apellido, email) (RF-03 modificado).
- **/admin con Supabase Auth + RLS desde Instancia 1**: ver y filtrar los leads (RF-09 adelantado y promovido a necesario, sin exportación a archivos).
- Infra Hito 1: proyecto Vercel + dominio `quantihidroponia.com.ar` + proyecto Supabase + cuenta Resend + verificación de remitente.

**Instancia 2 (sitio definitivo)**:
- Home con Hero + CTAs + **carrusel interactivo con las imágenes de los logos de clientes** (provistas por la empresa) + 60 FPS (RF-04).
- Sección "Sobre Nosotros" (RF-05).
- Catálogo por solapas con ficha (imagen optimizada, nombre, descripción) **sin precios visibles** (RF-06).
- FAQ acordeón + formulario genérico (nombre + email + mensaje) vía Resend (RF-07).
- Footer: Instagram, Facebook (RF-08).
- Admin suma **CRUD completo de productos y categorías con imágenes** (requiere Storage + optimización), manteniendo vista y filtrado de leads.

## 6. Funcionalidades opcionales

- Formulario diferenciado B2B (descartado del MVP por decisión — si los leads mayoristas se mezclan con consultas generales, se retoma post-lanzamiento).
- Analítica de leads, notificaciones automáticas, multi-idioma — backlog, no MVP.

## 7. Reglas de negocio

- Las fichas de producto **no exhiben precios visibles** (restricción explícita del negocio).
- Leads con nombre, apellido y email obligatorios, validados en front + back.
- Formulario de contacto con campos obligatorios (nombre, email, mensaje).
- RBAC: ruta /admin restringida por RLS/roles (admin vs superadmin Dev).
- Cada hito se aprueba progresivamente por el desarrollador a medida que las tareas se completan correctamente; se recomienda una conformidad liviana del cliente al cierre de cada hito (el DRF la ata a pagos).

## 8. Integraciones

- **Supabase**: DB Postgres (`posibles_clientes`, `productos`, `categorias`) + Auth + Storage (imágenes). Los leads viven en la DB y se consultan desde /admin, sin exportación a archivos. A crear en Hito 1.
- **Resend**: envío del formulario a la casilla corporativa + verificación de remitente por DNS. A crear/verificar en Hito 1/3.
- **Vercel**: deploy conectado a `quantihidroponia.com.ar`. A crear en Hito 1.
- **Instagram, Facebook**: enlaces en footer.
- **Estado actual**: solo existe el dominio `quantihidroponia.com.ar`. Sin hosting (no hace falta: Vercel lo cubre), sin cuentas creadas.

## 9. Restricciones

- 6 semanas, 4 hitos, aprobación progresiva por el desarrollador.
- Stack: Next.js/React (SEO SSR) + Tailwind + Framer Motion/CSS Transitions.
- PageSpeed ≥ 85 en móvil, responsive móvil/tablet/desktop, WCAG 2.1 AA, HTTPS.
- Figma como **guía visual** (tokens: colores, tipos, imágenes) — no como maqueta ([link](https://www.figma.com/design/wynTa9TbgQl8LrHFWXhUU5/Quanti-Web?node-id=0-1&t=7hd0ZkeIZu4Z2L9W-1)).
- Textos ("Sobre Nosotros", FAQ) + fotos finales: listos según el responsable.
- Leads gestionados en la DB Postgres vía Supabase y consultados desde /admin; sin exportación a archivos.

## 10. Riesgos

- **Hito 1 más pesado de lo estimado en el DRF**: suma crear cuentas (Vercel/Supabase/Resend) + conectar dominio + Auth/RLS//admin adelantado — la Semana 1 puede no alcanzar tal como está estimada.
- **Acceso al DNS del dominio**: sin acceso al registrador (NIC.ar) no hay deploy en Vercel ni verificación de Resend — es el desbloqueador #1 (a cargo del responsable).
- **Upload de imágenes**: el CRUD con imágenes exige Storage + optimización — si se subestima, traba el Hito 3.
- **Supuesto sin probar**: que el formulario genérico no mezcle leads B2B críticos entre consultas generales — a vigilar post-lanzamiento (dispara el backlog del formulario diferenciado).
- **Supuesto**: que "filtrar" leads = filtro simple por fecha/email/nombre — sin búsqueda avanzada.

## 11. Preguntas abiertas

- [ ] Acceso al registrador/DNS de `quantihidroponia.com.ar` (NIC.ar) — **a cargo del responsable, antes del Hito 1**.
- [ ] Casilla destino del formulario (ej. `contacto@quantihidroponia.com.ar`, alias o email hosting) — **a cargo del responsable, necesaria para cerrar RF-07**.
- [ ] Remitente verificado en Resend (verificación DNS) — **a cargo del responsable, Hito 1/3**.
- [ ] ¿"Filtrar" leads requiere algo más que fecha/email/nombre?
- [x] Carrusel de clientes: usa las imágenes de los logos (las provee la empresa).
