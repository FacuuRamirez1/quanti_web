# foundation-infra Specification

## Purpose

Proporciona la base ejecutable y verificable del sitio Quanti (scaffold Next.js 15, wiring Supabase, guardia stub de /admin, health check y gates de calidad) sobre la que se construyen todos los changes de Instancia 1 y 2.

## Requirements

### Requirement: Scaffold arranca y sirve la raíz en español accesible

El sistema SHALL servir la página raíz desde el scaffold Next.js 15 con `lang="es"`, un único `h1`, landmarks (`header`/`main`/`footer`) y skip-link al contenido.

#### Scenario: Arranque local limpio

- **WHEN** se ejecuta el comando de dev/build del scaffold sin `.env.local` salvo valores dummy documentados
- **THEN** la app compila sin errores y `GET /` responde 200 con `<html lang="es">`, un `h1` y skip-link presente en el DOM

#### Scenario: Build de producción verde

- **WHEN** se ejecuta el build de producción
- **THEN** el build completa sin errores de tipos (TS estricto) ni de lint bloqueante

### Requirement: Health check mínimo

El sistema SHALL exponer `GET /api/health` que responde `200` con JSON `{ "status": "ok" }` sin requerir autenticación ni variables de entorno sensibles.

#### Scenario: Health responde ok

- **WHEN** un cliente hace `GET /api/health` con la app corriendo
- **THEN** recibe status `200` y cuerpo JSON con `status` igual a `"ok"`

### Requirement: Rutas /admin están protegidas por stub

El sistema SHALL impedir que una petición sin sesión válida de Supabase a cualquier ruta bajo `/admin/*` (excepto `/admin/login`) renderice contenido admin: el middleware verifica la sesión con Supabase, refresca las cookies `httpOnly`/`secure` y redirige a `/admin/login` conservando el destino (o responde 403 ante rol insuficiente según `auth-admin-shell`). La validación real de sesión/rol con Supabase es responsabilidad de C-03 y reemplaza al stub de C-01.

#### Scenario: Acceso anónimo a /admin no muestra contenido

- **WHEN** un visitante sin sesión navega a `/admin`
- **THEN** no ve contenido administrativo (es redirigido al login con el destino conservado o recibe 403)

#### Scenario: Rutas públicas no afectadas por el stub

- **WHEN** un visitante navega a `/` o a `/api/health`
- **THEN** el middleware las deja pasar sin redirección ni 403

#### Scenario: /admin/login pública no redirige en loop

- **WHEN** un visitante sin sesión navega a `/admin/login`
- **THEN** la página de login se renderiza sin redirección adicional

### Requirement: Contrato de variables de entorno sin secretos en cliente

El repo SHALL incluir `.env.example` con las seis variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CONTACTO_DESTINO`, `RESEND_REMITENTE`) y SHALL fallar en arranque con mensaje claro si falta una variable requerida. Ninguna clave sensible (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) SHALL aparecer en código cliente ni en variables `NEXT_PUBLIC_*` (R3).

#### Scenario: Falta variable requerida

- **WHEN** se arranca la app sin una variable requerida
- **THEN** el arranque falla con un mensaje que nombra la variable faltante (no un crash opaco)

#### Scenario: Secretos fuera del bundle cliente

- **WHEN** se inspecciona el bundle/servidor por las claves sensibles
- **THEN** `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY` solo son importables en código servidor y `.env.local` está en `.gitignore`

### Requirement: Clientes Supabase cableados vía @supabase/ssr

El sistema SHALL proveer clientes Supabase de browser y de servidor construidos desde las variables de entorno (sin claves hardcodeadas), siguiendo la estructura `lib/supabase/` (client, server, middleware).

#### Scenario: Clientes se construyen desde envs

- **WHEN** las envs Supabase están presentes y un Server Component crea el cliente servidor
- **THEN** el cliente se instancia sin errores y apunta a la URL configurada (sin realizar escrituras en C-01)

### Requirement: Presupuestos de performance medidos desde el día 1

El repo SHALL incluir configuración Lighthouse CI con los umbrales KB (PageSpeed móvil ≥ 85, LCP ≤ 2.5s, CLS ≤ 0.1, JS inicial ≤ 170 KB gzip) ejecutable contra el build local y lista para correr en PRs.

#### Scenario: LHCI corre con umbrales KB

- **WHEN** se ejecuta Lighthouse CI contra el build local de la raíz
- **THEN** la corrida completa y evalúa exactamente los cuatro umbrales del presupuesto (pasa o reporta qué métrica falla, sin umbrales inventados)

### Requirement: Convenciones de migraciones versionadas sin escrituras en C-01

El repo SHALL contener `supabase/migrations/` con convención de nombrado versionado documentada y un runbook corto de aplicación manual (pegar SQL en el dashboard Supabase + queries de verificación). En C-01 no se ejecuta ninguna escritura contra la base de datos.

#### Scenario: Estructura y runbook presentes

- **WHEN** se lista `supabase/` tras el change
- **THEN** existen `migrations/` y `seed.sql` (placeholder documentado) más un runbook que indica cómo aplicar y verificar una migración, listo para que C-02 agregue la migración 001
