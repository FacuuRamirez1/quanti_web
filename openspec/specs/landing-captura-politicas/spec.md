# landing-captura-politicas Specification

## Purpose
Landing "Próximamente" con captura de leads y consentimiento de políticas versionado: la cara pública de Instancia 1 que convierte visitantes en filas de `posibles_clientes` verificables en /admin.

## Requirements

### Requirement: Landing "Próximamente" en `/`

El sistema SHALL servir en `/` una landing con hero (logo, mensaje institucional, imagen de cultivos prioritaria con `priority` + `fetchpriority` y dimensiones reservadas para CLS ≤ 0.1), responsive móvil/tablet/desktop, PageSpeed móvil ≥ 85, guía visual Figma por tokens (no pixel-perfect), y base accesible heredada (un `h1`, `lang="es"`, skip-link, landmarks `header`/`main`/`footer`). El link discreto al admin en el footer SHALL seguir presente y visible.

#### Scenario: Hero completo y accesible

- **WHEN** un visitante navega a `/`
- **THEN** ve logo, mensaje institucional e imagen de cultivos prioritaria, con un único `h1`, landmarks y skip-link presentes en el DOM

#### Scenario: Responsive sin layout shift

- **WHEN** se renderiza en viewports móvil (∼360px), tablet (∼768px) y desktop (∼1280px)
- **THEN** no hay scroll horizontal ni solapamientos y la imagen del hero tiene dimensiones reservadas (CLS ≤ 0.1)

#### Scenario: Presupuesto de performance

- **WHEN** se corre Lighthouse CI móvil contra `/`
- **THEN** PageSpeed ≥ 85 con LCP ≤ 2.5s y JS inicial ≤ 170KB gzip

#### Scenario: Link admin discreto presente

- **WHEN** un visitante mira el footer de `/`
- **THEN** existe un link discreto hacia el acceso admin (RN-AU-03)

### Requirement: Formulario de captura con consentimiento obligatorio

El sistema SHALL ofrecer en `/` un formulario con nombre + apellido + email (los tres obligatorios, RN-LEAD-01) con validación en tiempo real en el frontend, más casilla obligatoria "Acepto las Políticas de Seguridad/Privacidad" con enlace a `/politicas`; el botón submit "Notificarme" SHALL estar DESHABILITADO hasta que la casilla esté aceptada. Los errores SHALL anunciarse con `aria-describedby`/`role="alert"` sin depender solo del color (RN-LEAD-02 a nivel UX). Ante registro exitoso el sistema SHALL mostrar confirmación visual ("¡Te avisaremos del lanzamiento!").

#### Scenario: Submit deshabilitado sin checkbox

- **WHEN** el visitante completa nombre/apellido/email válidos pero NO tilda la casilla
- **THEN** el botón "Notificarme" permanece deshabilitado y no se envía nada

#### Scenario: Validación en tiempo real

- **WHEN** el visitante escribe un email con formato inválido o deja un campo vacío
- **THEN** ve un error de campo inmediato asociado vía `aria-describedby` antes de cualquier envío

#### Scenario: Éxito con confirmación

- **WHEN** el visitante completa los 3 campos válidos, acepta las políticas y envía
- **THEN** el formulario muestra la confirmación de éxito anunciada a tecnologías de asistencia

### Requirement: Server Action `registrarLead` con schema compartido y consentimiento auditable

El sistema SHALL exponer una Server Action `registrarLead` que importa el `leadSchema` COMPARTIDO de `lib/validaciones.ts` sin redefinirlo (R2), re-valida todo en servidor incluyendo `acepta_politicas === true`, normaliza el email (`trim` + `lowercase`) e inserta en `posibles_clientes` con `politicas_version` (v1.0) + `consent_at = now()` (RN-LEAD-02/03 + mandato de consentimiento). Un email ya registrado (incl. case-insensitive por índice `lower(email)`, RN-LEAD-05) SHALL responder aviso amable "ya estás en la lista" SIN crear ni modificar ningún registro. Un email inválido SHALL responder error de campo sin guardar nada. La Action SHALL aplicar honeypot + rate limit en servidor con el mismo enfoque de `lib/rate-limit.ts` de C-03. Ante caída de Supabase SHALL responder error genérico con opción de reintento, sin exponer detalles. RLS SHALL permitir el INSERT anónimo validado (contrato C-02 intacto). Ninguna query Supabase SHALL ejecutarse desde Client Components (R1).

#### Scenario: Lead válido persiste con versión y consentimiento

- **WHEN** la Action recibe `{ nombre, apellido, email válido, acepta_politicas: true }`
- **THEN** valida con `leadSchema`, inserta con `politicas_version = 'v1.0'` y `consent_at` no nulo, y retorna éxito

#### Scenario: Duplicado exacto no crea ni modifica

- **WHEN** ya existe `ana@mail.com` y se registra `ana@mail.com`
- **THEN** la Action responde "ya estás en la lista" y la tabla sigue con una sola fila inalterada para ese email

#### Scenario: Duplicado case-insensitive

- **WHEN** ya existe `ana@mail.com` y se registra `ANA@MAIL.COM` (o con espacios)
- **THEN** tras normalizar a `ana@mail.com` responde el mismo aviso amable sin crear ni modificar

#### Scenario: Submit sin checkbox rechazado en servidor

- **WHEN** la Action recibe `acepta_politicas = false` o ausente (bypass del cliente)
- **THEN** rechaza por validación y no intenta ningún INSERT (la DB también lo rechazaría por CHECK)

#### Scenario: Email inválido no guarda

- **WHEN** la Action recibe un email con formato inválido
- **THEN** responde error de campo y no persiste nada

#### Scenario: Spam bloqueado en servidor

- **WHEN** llega un envío con honeypot completo o excediendo el rate limit
- **THEN** la Action lo rechaza en servidor sin INSERT (sin fugar si fue spam o exceso)

#### Scenario: Caída de Supabase degradada

- **WHEN** Supabase no responde durante un registro válido
- **THEN** la Action responde error genérico con opción de reintento, sin exponer detalles internos

### Requirement: Página de Política de Privacidad versionada

El sistema SHALL servir `/politicas` con el texto COMPLETO de la Política de Privacidad v1.0 redactada en este change, con fecha de vigencia visible. Cada lead SHALL conservar el `politicas_version` vigente al momento del registro. Cambios futuros del texto SHALL publicarse como nueva versión (contenido, no schema de este change).

#### Scenario: Texto completo con vigencia visible

- **WHEN** un visitante navega a `/politicas`
- **THEN** lee el texto íntegro v1.0 con su fecha de vigencia y puede volver al formulario (enlace desde la casilla)

#### Scenario: Versión persistida por lead

- **WHEN** se registra un lead con la v1.0 vigente
- **THEN** su fila conserva `politicas_version = 'v1.0'` legible luego en /admin

### Requirement: E2E lead visible en /admin

El sistema SHALL garantizar que todo lead registrado por el flujo de captura aparece en `/admin` (orden `created_at DESC`, con versión de políticas y fecha de consentimiento visibles — columnas consumidas por C-05). Esta verificación ejercita el login de C-03 en vivo (solape intencional).

#### Scenario: Registro punta a punta

- **WHEN** un visitante se registra con datos válidos y consentimiento, y luego un admin con rol inicia sesión
- **THEN** el lead aparece en `/admin` con nombre/apellido/email/fecha más `politicas_version` y `consent_at`
