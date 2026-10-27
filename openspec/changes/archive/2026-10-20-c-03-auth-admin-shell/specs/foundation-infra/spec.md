# Spec Delta — foundation-infra

## MODIFIED Requirements

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
