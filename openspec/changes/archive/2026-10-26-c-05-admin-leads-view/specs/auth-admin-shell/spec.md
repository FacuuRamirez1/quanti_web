# Spec Delta — auth-admin-shell

## MODIFIED Requirements

### Requirement: Autorización solo por tabla perfiles, 403 ante rol insuficiente

El sistema SHALL resolver el rol exclusivamente desde la tabla `perfiles` (`role IN ('admin','superadmin')`) mediante consulta server-side en cada verificación; NUNCA SHALL basar decisiones de autorización en `auth.users.user_metadata`. El layout y las páginas bajo `/admin` (excepto login) SHALL verificar sesión + rol en el servidor antes de renderizar. Si el usuario autenticado no tiene fila en `perfiles` con rol suficiente, el sistema SHALL responder 403 sin renderizar contenido admin y SHALL registrar un aviso interno en el servidor (sin exponer datos ni detalles al cliente).

#### Scenario: Admin con fila en perfiles accede

- **WHEN** un usuario autenticado con `perfiles.role = 'admin'` navega a `/admin`
- **THEN** ve el panel de administración con el listado de leads habilitado por C-05

#### Scenario: Autenticado sin rol recibe 403

- **WHEN** un usuario autenticado sin fila en `perfiles` (o con rol distinto) navega a `/admin`
- **THEN** recibe 403, no ve contenido admin y el servidor registra el aviso interno

#### Scenario: user_metadata no otorga acceso

- **WHEN** un usuario autenticado tiene `user_metadata.role = 'admin'` pero ninguna fila en `perfiles`
- **THEN** el sistema lo trata como sin rol y responde 403

### Requirement: Cáscara admin mínima y link discreto en footer

El sistema SHALL proveer una cáscara admin bajo `/admin` (layout + listado de leads de C-05) visible solo tras sesión + rol verificados en servidor. El footer público SHALL incluir un link discreto al admin (p. ej. texto "Acceso admin" → `/admin/login`) visible desde Instancia 1, sin alterar los landmarks (`header`/`main`/`footer`), el `h1` único por página ni el skip-link existentes.

#### Scenario: Placeholder admin tras login

- **WHEN** un admin autenticado con rol suficiente navega a `/admin`
- **THEN** ve la cáscara admin con el listado de leads (o su estado vacío) y la opción de logout

#### Scenario: Footer expone acceso discreto

- **WHEN** un visitante ve cualquier página pública con footer
- **THEN** encuentra el link discreto al admin que navega a `/admin/login`
