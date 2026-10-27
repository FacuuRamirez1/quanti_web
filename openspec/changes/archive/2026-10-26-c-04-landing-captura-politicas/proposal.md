# Proposal — C-04 landing-captura-politicas

## Why

Instancia 1 no es desplegable sin su cara pública: hoy `/` es un placeholder C-01 y no existe ningún camino para que un visitante deje sus datos. C-02 ya dejó la tabla `posibles_clientes` con columnas de consentimiento y RLS verificada live; falta la landing "Próximamente", el formulario de captura con consentimiento obligatorio y la página de Políticas que le da validez legal al `politicas_version` persistido.

## What Changes

- `/` landing "Próximamente" (US-001): hero con logo, mensaje institucional e imagen prioritaria de cultivos (`priority` + `fetchpriority`, CLS ≤ 0.1); guía Figma por tokens (no pixel-perfect); responsive móvil/tablet/desktop; PageSpeed móvil ≥ 85; `h1` único, `lang="es"`, skip-link y landmarks heredados de C-01 intactos.
- Formulario de captura (US-002, RN-LEAD-01/02/05): nombre + apellido + email (los 3 obligatorios, validación en tiempo real en FE) + checkbox obligatorio "Acepto las Políticas de Seguridad/Privacidad" con enlace a `/politicas`; botón submit "Notificarme" DESHABILITADO hasta aceptar el checkbox (decisión de usuario locked); errores anunciados (`aria-describedby`/`role="alert"`, no solo color); confirmación visual de éxito ("¡Te avisaremos del lanzamiento!").
- Server Action `registrarLead` (`app/actions/leads.ts`): importa el `leadSchema` COMPARTIDO de `lib/validaciones.ts` (owned by C-02 — NUNCA redefinir); re-valida todo incluyendo `acepta_politicas === true` (la DB ya tiene CHECK como última defensa); normaliza email (`trim`+`lowercase`, ya cubierto por el schema); INSERT con `politicas_version` (v1.0) + `consent_at=now()`; duplicado (incl. case-insensitive vía índice `lower(email)`) → aviso amable "ya estás en la lista" sin crear ni modificar; email inválido → error de campo sin guardar; honeypot + rate limit con el MISMO enfoque de `lib/rate-limit.ts` de C-03 (importar/compartir, mantener consistencia); caída Supabase → error genérico + reintento.
- Página `/politicas` ("Política de Privacidad"): texto legal COMPLETO redactado en este change (v1.0 con fecha de vigencia visible); `politicas_version` persistido por lead; cambios futuros de texto = nueva versión (migración de contenido, fuera de este change). El texto es contenido legal → requiere APROBACIÓN explícita del usuario antes de implementar (checkpoint en tasks).
- Prueba E2E: un lead registrado aparece en `/admin` (ejercita el login live de C-03 — solape intencional y coordinado; la sesión live combinada C-03+C-04 verifica matriz 2.2/4.1 pendiente de C-03 + E2E de C-04 en una sola sesión).

## Capabilities

### New Capabilities

- `landing-captura-politicas`: landing `/` + formulario de captura con consentimiento + página `/politicas` + Server Action `registrarLead` + garantías de accesibilidad/performance del flujo de captación (US-001/US-002, RN-LEAD, Flujo 1, presupuestos KB 11).

### Modified Capabilities

- (ninguna — `foundation-infra` y `leads-data-model` se consumen sin cambiar sus REQUIREMENTS: el scaffold sigue sirviendo `/` accesible y el contrato `leadSchema`/RLS de C-02 se importa intacto).

## Impact

- Afecta: `app/page.tsx` (landing), nuevo `app/politicas/page.tsx`, nuevo `app/actions/leads.ts` (+ Client Component de formulario), `app/layout.tsx` (solo si el footer/link lo requiere — el link discreto admin ya existe por C-03), estilos/hero assets (`public/` o Storage según decisión de diseño).
- Consume sin modificar: `lib/validaciones.ts` (`leadSchema`), `lib/rate-limit.ts` (enfoque/persistencia compartida), RLS de `posibles_clientes` (C-02), guardia `/admin` + login (C-03, para la verificación E2E).
- Desbloquea: C-05 `admin-leads-view` (requiere C-03 + C-04; el E2E de este change es su precondición viva).
- Sin migraciones DB. Sin secretos nuevos. Sin commits (U1). Orden: corre DESPUÉS de C-03 en secuencia por decisión del usuario (CHANGES.md preveía paralelo C-03/C-04; vale la decisión posterior).
