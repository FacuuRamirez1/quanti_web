# Funcionalidades — Quanti Vegetales Hidropónicos

Organizadas por **épica** y luego por **historia de usuario** (US-NNN). Mapean RF-01…RF-09 con los 4 cambios vigentes del Discovery.

## Épica 1: Lanzamiento y captación (Instancia 1)

### US-001 — Landing "Próximamente"
**Como** visitante **Quiero** ver una página de expectativa con identidad Quanti **Para** conocer la marca antes del lanzamiento.
**Criterios de aceptación**:
- [ ] Hero con logo, mensaje institucional e imagen de cultivos (guía Figma)
- [ ] Responsive móvil/tablet/desktop, PageSpeed móvil ≥ 85
- [ ] Link discreto al admin en el footer
**Reglas relacionadas**: RN-CONT-02, RN-AU-03

### US-002 — Captura de lead
**Como** visitante **Quiero** dejar nombre, apellido y email **Para** enterarme del lanzamiento.
**Criterios de aceptación**:
- [ ] Los 3 campos obligatorios con validación en tiempo real (front)
- [ ] Re-validación en servidor; email inválido → error claro sin guardar nada
- [ ] Email ya registrado → aviso amable ("ya estás en la lista"), sin duplicar
- [ ] Confirmación visual de registro exitoso; el registro aparece en /admin
**Reglas relacionadas**: RN-LEAD-01, RN-LEAD-02, RN-LEAD-03, RN-LEAD-05

## Épica 2: Sitio institucional (Instancia 2)

### US-003 — Home con prueba social
**Como** visitante **Quiero** un Home con CTAs a catálogo y contacto más un carrusel de clientes **Para** entender la oferta y confiar en la marca.
**Criterios de aceptación**:
- [ ] Hero + CTAs claros; animaciones a 60 FPS
- [ ] Carrusel rápido e interactivo con las imágenes de logos (assets fijos)
- [ ] PageSpeed móvil ≥ 85
**Reglas relacionadas**: RN-CONT-01, RN-CONT-03

### US-004 — Sobre Nosotros con puntos de venta
**Como** visitante **Quiero** leer la historia, el método hidropónico y ver los puntos de venta **Para** valorar la propuesta (agua, sin pesticidas, sustentabilidad).
**Criterios de aceptación**:
- [ ] Bloques: historia, propuesta de valor, sustentabilidad
- [ ] Sección puntos de venta con la misma lista de logos de clientes
**Reglas relacionadas**: RN-CONT-01

### US-005 — FAQ + contacto único
**Como** visitante o mayorista **Quiero** resolver dudas en un acordeón y contactar por formulario o redes **Para** comunicarme sin WhatsApp.
**Criterios de aceptación**:
- [ ] FAQ desplegable con las preguntas del cliente
- [ ] Formulario único (nombre + email + mensaje) con validación; envío vía Resend a casilla corporativa
- [ ] Footer con Instagram, Facebook y email institucional
**Reglas relacionadas**: RN-FORM-01, RN-FORM-02, RN-FORM-03

## Épica 3: Catálogo (Instancia 2)

### US-006 — Explorar catálogo por categorías
**Como** visitante **Quiero** filtrar por solapas (Hojas Verdes, Aromáticas, Microgreens) y ver fichas **Para** conocer la oferta.
**Criterios de aceptación**:
- [ ] Navegación por solapas con imagen optimizada, nombre y descripción por ficha
- [ ] Sin precios en UI ni en payloads; solo productos activos
**Reglas relacionadas**: RN-CAT-01, RN-CAT-04, RN-CAT-05

## Épica 4: Admin leads (desde Instancia 1)

### US-007 — Ver y filtrar posibles clientes
**Como** admin **Quiero** listar y filtrar leads (fecha/email/nombre) en /admin **Para** gestionar los interesados.
**Criterios de aceptación**:
- [ ] Acceso por footer → login → tabla con filtros; requiere rol admin
- [ ] Sin exportación a archivos (decisión vigente)
**Reglas relacionadas**: RN-LEAD-04, RN-AU-01, RN-AU-02

## Épica 5: Admin catálogo (Instancia 2)

### US-008 — CRUD de categorías
**Como** admin **Quiero** crear, editar y (si no tiene productos) eliminar categorías **Para** mantener la taxonomía.
**Criterios de aceptación**:
- [ ] Slug auto-generado; eliminar bloqueado con productos (RESTRICT) y mensaje claro
**Reglas relacionadas**: RN-CAT-02, RN-CAT-03, RN-AU-02

### US-009 — CRUD de productos con imágenes
**Como** admin **Quiero** gestionar productos con foto **Para** publicar la oferta sin ayuda técnica.
**Criterios de aceptación**:
- [ ] Alta/edición/baja + activar/desactivar; upload validado (tipo/tamaño) a Storage con optimización
- [ ] Vista previa de ficha tal como la ve el público
**Reglas relacionadas**: RN-CAT-04, RN-CAT-05, RN-AU-02

## Épica 6: Plataforma e infra

### US-010 — Autenticación y sesiones
**Como** admin **Quiero** entrar con email + password y mantener sesión segura **Para** operar el panel.
**Criterios de aceptación**:
- [ ] Middleware Supabase protege /admin; refresh de tokens sin fricción; logout cierra todo
**Reglas relacionadas**: RN-AU-01, RN-AU-04

### US-011 — Deploy con dominio propio
**Como** equipo **Quiero** deploys en Vercel sobre `quantihidroponia.com.ar` con HTTPS **Para** operar en producción.
**Criterios de aceptación**:
- [ ] DNS conectado y verificado; preview por PR; env vars solo en servidor
**Reglas relacionadas**: RN-AU-04
