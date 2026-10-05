# Flujos Principales — Quanti Vegetales Hidropónicos

## Flujo 1: Registro de lead (Instancia 1)

**Disparador**: submit del formulario de captura. **Actor**: visitante.

**Pasos**:
1. [Frontend] valida nombre/apellido/email en tiempo real y habilita el submit.
2. [Frontend] invoca la Server Action `registrarLead` (con protección anti-spam básica).
3. [Server Action] re-valida, normaliza el email e inserta en `posibles_clientes`.
4. [DB] RLS permite el INSERT anónimo; retorna confirmación.
5. [Frontend] muestra estado de éxito.

**Diagrama de secuencia**:
```
Visitante → Landing → Server Action → Supabase (INSERT posibles_clientes)
                                          ← ok
          ← "¡Te avisaremos del lanzamiento!"
```

**Casos de error**:
- Email inválido (front o back) → mensaje de campo, nada se guarda (RN-LEAD-02).
- Email duplicado → aviso amable ("ya estás en la lista"); no se crea ni se modifica nada (RN-LEAD-05).
- Caída de Supabase → error genérico + reintento, sin exponer detalles.

## Flujo 2: Contacto vía formulario único (Instancia 2)

**Disparador**: submit del formulario de contacto. **Actor**: visitante/mayorista.

**Pasos**:
1. [Frontend] valida nombre + email + mensaje.
2. [Server Action] re-valida y llama a Resend con remitente verificado.
3. [Resend] entrega en la casilla corporativa destino.
4. [Frontend] confirma recepción ("te responderemos a la brevedad").

**Casos de error**:
- Resend caído o remitente sin verificar → error amable + sugerencia de redes (RN-FORM-02).
- Spam/bots → honeypot + rate limit; el mensaje nunca se pierde en silencio (log interno).

## Flujo 3: Login admin

**Disparador**: acceso al link del footer → `/admin/login`. **Actor**: admin/superadmin.

**Pasos**:
1. [Middleware Supabase] si ya hay sesión válida, redirige a `/admin`.
2. [Formulario] email + password → `signInWithPassword`.
3. [Middleware] crea/refresca cookies de sesión seguras.
4. [RLS] resuelve el rol (metadata o `perfiles`) y habilita vistas/acciones.

**Casos de error**:
- Credenciales inválidas → mensaje genérico (sin revelar si el usuario existe).
- Sin rol suficiente → 403 + aviso al superadmin.

## Flujo 4: Ver y filtrar leads (desde Instancia 1)

**Disparador**: admin entra a `/admin`. **Actor**: admin.

**Pasos**:
1. [Middleware] verifica sesión + rol.
2. [RSC] consulta `posibles_clientes` ordenados por `created_at DESC` (paginado).
3. [UI] filtros por fecha/email/nombre (búsqueda en servidor, no en cliente).
4. No hay exportación: la gestión vive en el panel (RN-LEAD-04).

## Flujo 5: CRUD de producto con imagen (Instancia 2)

**Disparador**: admin crea/edita un producto. **Actor**: admin.

**Pasos**:
1. [Formulario admin] datos + imagen (validación de tipo/tamaño en cliente y servidor).
2. [Server Action] sube a Storage (bucket `productos`), obtiene URL pública optimizada.
3. [Server Action] inserta/actualiza en `productos` (RLS: solo admin/superadmin).
4. [Catálogo público] refleja el cambio (revalidación bajo demanda) solo si `activo = true`.

**Casos de error**:
- Imagen inválida/pesada → rechazo con límites claros antes de subir.
- Categoría inexistente → el select solo ofrece categorías reales (integridad por FK + RESTRICT al borrar).

## Flujo 6: Navegación pública del catálogo (Instancia 2)

**Disparador**: visita a `/catalogo`. **Actor**: visitante.

**Pasos**:
1. [RSC] lee categorías + productos activos (una query, con `orden`).
2. [UI] solapas por categoría; fichas con `next/image` (sin precios en ningún payload).
3. CTAs hacia contacto/redes en cada vista.
