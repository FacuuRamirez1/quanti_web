# Reglas de Negocio — Quanti Vegetales Hidropónicos

Cada regla tiene código único `RN-{DOMINIO}-{NN}` para trazabilidad.

## Dominio: Captación de leads (RN-LEAD)

- **RN-LEAD-01**: el formulario de Instancia 1 exige nombre, apellido y email, los tres obligatorios.
- **RN-LEAD-02**: el email se valida en front-end (feedback inmediato) y en back-end (Server Action) — nunca solo en cliente.
- **RN-LEAD-03**: cada registro validado persiste de inmediato en `posibles_clientes` (Postgres vía Supabase).
- **RN-LEAD-04**: los leads se consultan exclusivamente desde /admin (ver + filtrar) — no existe exportación a archivos.
- **RN-LEAD-05**: el email es único en `posibles_clientes` (`UNIQUE (lower(email))`); un reintento con un email ya registrado se rechaza con aviso amable, sin crear duplicado ni modificar el registro existente.

## Dominio: Catálogo (RN-CAT)

- **RN-CAT-01**: las fichas de producto NO exhiben precios visibles (restricción explícita del negocio); el modelo ni siquiera almacena precio.
- **RN-CAT-02**: todo producto pertenece a exactamente una categoría.
- **RN-CAT-03**: no se puede eliminar una categoría con productos asociados (RESTRICT).
- **RN-CAT-04**: el público solo ve productos con `activo = true`; el admin ve todos.
- **RN-CAT-05**: toda imagen de producto pasa por Storage con optimización (formato moderno, `next/image`); los logos de clientes son assets fijos en `public/`, no van a la DB.

## Dominio: Contacto (RN-FORM)

- **RN-FORM-01**: existe un único formulario de contacto para todos los usuarios (B2C, B2B, general): nombre + email + mensaje, todos obligatorios.
- **RN-FORM-02**: el envío se procesa vía Resend a la casilla corporativa; sin casilla destino y remitente verificado, RF-07 no se considera cerrado.
- **RN-FORM-03**: WhatsApp NO es canal de contacto del sitio (solo formulario y redes Instagram/Facebook).

## Dominio: Autenticación y autorización (RN-AU)

- **RN-AU-01**: `/admin` exige sesión válida (Supabase Auth, Middleware oficial, App Router) — sin excepción.
- **RN-AU-02**: leer leads y operar catálogo exige rol admin o superadmin (RLS como última línea de defensa, no solo UI).
- **RN-AU-03**: el ingreso al admin es visible desde el footer (link discreto) a partir de Instancia 1.
- **RN-AU-04**: credenciales y tokens nunca en código ni en logs; solo env vars del servidor.

## Dominio: Contenido y presentación (RN-CONT)

- **RN-CONT-01**: la lista de clientes (logos) es única y fija: mismo set en el carrusel del Home y en puntos de venta de About Us.
- **RN-CONT-02**: Figma es guía visual (tokens), no maqueta a replicar pixel a pixel.
- **RN-CONT-03**: las animaciones deben sostener 60 FPS y respetar `prefers-reduced-motion` (ver `11_rendimiento_y_accesibilidad.md`).

## Dominio: Excepciones globales

- **RN-GLB-01**: ningún cambio a estas reglas entra por default en implementación — toda excepción se documenta en `09_decisiones_y_supuestos.md` antes de codificarse.
- **RN-GLB-02**: ante conflicto DRF ↔ Discovery ↔ KB, vale la fuente más nueva con trazabilidad explícita (hoy: KB + nota de trazabilidad del Discovery, 4 puntos).
