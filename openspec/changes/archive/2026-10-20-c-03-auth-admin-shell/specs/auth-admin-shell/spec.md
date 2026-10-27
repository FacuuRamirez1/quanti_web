# Spec Delta — auth-admin-shell

## Purpose

Proporciona la autenticación real del panel admin y su cáscara protegida: login con Supabase Auth, guardia de sesión en middleware, autorización por tabla perfiles y salida segura, base que C-05 usa para mostrar leads.

## ADDED Requirements

### Requirement: Página de login pública con error genérico y accesibilidad

El sistema SHALL exponer `/admin/login` como ruta pública que muestra solo el formulario de autenticación (email + password más un campo honeypot invisible para humanos) y SHALL autenticar vía Supabase Auth con `signInWithPassword` del lado servidor. Ante credenciales inválidas o usuario inexistente el sistema SHALL responder con el mensaje genérico byte-idéntico de copia exacta "Credenciales inválidas o cuenta no encontrada." que no revele si el email existe. Si el honeypot llega completo, el sistema SHALL rechazar silenciosamente con el MISMO mensaje genérico byte-idéntico "Credenciales inválidas o cuenta no encontrada.", SHALL NOT llamar a Supabase Auth, SHALL NOT incrementar ni resetear los contadores de rate limit (el honeypot no contamina contadores) y SHALL NOT registrar diferencias observables (misma respuesta, mismo anuncio; única diferencia aceptada: el skip inevitable de la llamada Auth). El sistema SHALL aplicar rate limit server-side en la Server Action con clave dual por IP y por email (contadores SOLO en servidor): 5 intentos fallidos por ventana de 10 minutos, backoff progresivo pineado (5.º fallo → bloqueo 2 min, 6.º → bloqueo 10 min, 7.º en adelante → bloqueo 30 min); ante exceso el sistema SHALL NOT llamar a Supabase Auth y SHALL responder el MISMO mensaje genérico byte-idéntico "Credenciales inválidas o cuenta no encontrada." que no distingue si las credenciales eran correctas. Todo enforcement anti-abuso SHALL ejecutarse solo en el servidor (ninguna validación solo-cliente). Los errores de validación, de autenticación, de honeypot y de throttling SHALL anunciarse con `aria-describedby` y `role="alert"`, sin depender solo del color. El honeypot SHALL ser invisible para usuarios y tecnologías de asistencia (`aria-hidden`, fuera del orden de tab, sin autofill). Si ya existe sesión válida con rol suficiente, el sistema SHALL redirigir directamente a `/admin` sin mostrar el formulario.

#### Scenario: Login válido redirige al panel

- **WHEN** un admin ingresa email y password correctos en `/admin/login` y envía el formulario
- **THEN** la sesión queda establecida y el navegador es redirigido a `/admin`

#### Scenario: Credenciales inválidas muestran error genérico

- **WHEN** se envía el formulario con password incorrecto o email no registrado
- **THEN** la página muestra exactamente "Credenciales inválidas o cuenta no encontrada." en un contenedor con `role="alert"` y no se establece ninguna sesión

#### Scenario: Sesión existente salta el formulario

- **WHEN** un usuario con sesión válida y rol `admin`/`superadmin` navega a `/admin/login`
- **THEN** es redirigido a `/admin` sin ver el formulario de login

#### Scenario: Errores de campo son anunciados por lector de pantalla

- **WHEN** se envía el formulario con email vacío, formato inválido o password vacío
- **THEN** cada campo inválido muestra su mensaje asociado vía `aria-describedby` y el resumen de error usa `role="alert"`

#### Scenario: Honeypot completo es rechazado con el mismo error genérico

- **WHEN** se envía el formulario con el campo honeypot completo (comportamiento de bot) con cualquier credencial
- **THEN** la página muestra exactamente "Credenciales inválidas o cuenta no encontrada." (byte-idéntica a credenciales inválidas y a bloqueo) en un contenedor con `role="alert"`, no se establece ninguna sesión, no se invoca a Supabase Auth y los contadores de rate limit quedan intactos

#### Scenario: Ráfaga de fuerza bruta es frenada sin filtrar validez

- **WHEN** se acumulan 5 intentos fallidos en 10 minutos desde la misma IP o para el mismo email
- **THEN** el 5.º intento es rechazado sin invocar a Supabase Auth con exactamente "Credenciales inválidas o cuenta no encontrada." anunciado vía `role="alert"`, con bloqueo de 2 min; el 6.º dentro de la ventana extiende el bloqueo a 10 min; el 7.º en adelante a 30 min, sin revelar si las credenciales eran correctas

#### Scenario: Los tres rechazos son byte-idénticos

- **WHEN** se comparan las respuestas de credenciales inválidas, honeypot completo y bloqueo por rate limit excedido
- **THEN** el cuerpo del mensaje es byte-idéntico ("Credenciales inválidas o cuenta no encontrada.") con el mismo `role="alert"` y sin diferencias de copy ni de anuncio

#### Scenario: Honeypot invisible para usuarios y lectores de pantalla

- **WHEN** un usuario legítimo (con o sin lector de pantalla) o con autofill navega el formulario de login
- **THEN** el campo honeypot no es visible, no entra en el orden de tab, no es anunciado por el lector y no es autocompletado

### Requirement: Middleware protege /admin, refresca sesión y preserva destino

El sistema SHALL proteger `/admin` y toda ruta bajo `/admin/*` (excepto `/admin/login`) exigiendo sesión Supabase válida en el middleware: SHALL crear y refrescar cookies de sesión `httpOnly`/`secure` en cada request y SHALL redirigir sin sesión a `/admin/login` conservando el destino original (parámetro `next`). Tras login exitoso el sistema SHALL redirigir al destino conservado si es una ruta interna `/admin`, o a `/admin` en caso contrario. La sesión expirada SHALL comportarse como sin sesión (redirección a login) y el refresh automático SHALL mantener la sesión válida sin intervención del usuario mientras el refresh token sea válido.

#### Scenario: Ruta /admin sin sesión redirige con destino

- **WHEN** un visitante sin sesión navega a `/admin`
- **THEN** es redirigido a `/admin/login?next=/admin` y no ve contenido administrativo

#### Scenario: Login completa el destino conservado

- **WHEN** un admin autenticado con éxito tras haber sido redirigido con `?next=/admin`
- **THEN** aterriza en `/admin` con sesión establecida

#### Scenario: Sesión expirada exige re-login

- **WHEN** la sesión expiró y el refresh token ya no es válido al navegar a `/admin`
- **THEN** el usuario es redirigido a `/admin/login` sin contenido admin visible

#### Scenario: Rutas públicas no afectadas

- **WHEN** un visitante navega a `/` o a `/api/health`
- **THEN** el middleware las deja pasar sin redirección ni 403

### Requirement: Autorización solo por tabla perfiles, 403 ante rol insuficiente

El sistema SHALL resolver el rol exclusivamente desde la tabla `perfiles` (`role IN ('admin','superadmin')`) mediante consulta server-side en cada verificación; NUNCA SHALL basar decisiones de autorización en `auth.users.user_metadata`. El layout y las páginas bajo `/admin` (excepto login) SHALL verificar sesión + rol en el servidor antes de renderizar. Si el usuario autenticado no tiene fila en `perfiles` con rol suficiente, el sistema SHALL responder 403 sin renderizar contenido admin y SHALL registrar un aviso interno en el servidor (sin exponer datos ni detalles al cliente).

#### Scenario: Admin con fila en perfiles accede

- **WHEN** un usuario autenticado con `perfiles.role = 'admin'` navega a `/admin`
- **THEN** ve la cáscara del panel (sin contenido de leads hasta C-05)

#### Scenario: Autenticado sin rol recibe 403

- **WHEN** un usuario autenticado sin fila en `perfiles` (o con rol distinto) navega a `/admin`
- **THEN** recibe 403, no ve contenido admin y el servidor registra el aviso interno

#### Scenario: user_metadata no otorga acceso

- **WHEN** un usuario autenticado tiene `user_metadata.role = 'admin'` pero ninguna fila en `perfiles`
- **THEN** el sistema lo trata como sin rol y responde 403

### Requirement: Logout cierra sesión en cliente y servidor

El sistema SHALL ofrecer cierre de sesión desde la cáscara admin que invalida la sesión tanto en el browser como en el servidor (cookies de sesión eliminadas). Tras el logout, navegar a `/admin` SHALL redirigir a `/admin/login` y el botón atrás del navegador NO SHALL re-exponer contenido admin cacheado como sesión válida.

#### Scenario: Logout invalida el acceso

- **WHEN** un admin autenticado ejecuta el cierre de sesión
- **THEN** la sesión queda invalidada y un acceso posterior a `/admin` redirige a `/admin/login`

### Requirement: Cáscara admin mínima y link discreto en footer

El sistema SHALL proveer una cáscara admin mínima bajo `/admin` (layout + página placeholder que indica que el listado de leads llega en C-05) visible solo tras sesión + rol verificados en servidor. El footer público SHALL incluir un link discreto al admin (p. ej. texto "Acceso admin" → `/admin/login`) visible desde Instancia 1, sin alterar los landmarks (`header`/`main`/`footer`), el `h1` único por página ni el skip-link existentes.

#### Scenario: Placeholder admin tras login

- **WHEN** un admin autenticado con rol suficiente navega a `/admin`
- **THEN** ve la cáscara admin con el placeholder (sin tabla de leads) y la opción de logout

#### Scenario: Footer expone acceso discreto

- **WHEN** un visitante ve cualquier página pública con footer
- **THEN** encuentra el link discreto al admin que navega a `/admin/login`
