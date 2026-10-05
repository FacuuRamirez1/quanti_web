# Visión y Objetivos — Quanti Vegetales Hidropónicos

## Propósito del sistema

Ser el ecosistema web institucional de Quanti: posicionar la marca de vegetales hidropónicos, capturar interesados antes y después del lanzamiento, y operar un catálogo gestionable sin depender de desarrolladores para el contenido del día a día.

Quanti vende hoy por redes sociales y contactos personales. Este sistema es el salto de la venta informal a una plataforma propia, en dos releases sobre el mismo proyecto: Instancia 1 (landing "Próximamente" + captura de leads + /admin de lectura) e Instancia 2 (evolución al sitio definitivo + CRUD de catálogo).

## Objetivos por actor

| Actor | Objetivo principal | Objetivos secundarios |
|---|---|---|
| Visitante B2C | Conocer el origen y beneficios de los vegetales y cómo contactar/comprar | Ver catálogo, ubicar puntos de venta, resolver dudas (FAQ) |
| Cliente B2B mayorista | Evaluar catálogo y capacidad de provisión para decidir una compra comercial | Contactar con contexto comercial vía el formulario único |
| Admin Quanti | Gestionar leads y catálogo sin ayuda técnica | Ver/filtrar posibles clientes; alta/edición/baja de productos y categorías |
| SuperAdmin Dev | Mantener la plataforma sana con acceso global | Auditoría, soporte de autenticación, infra y deploys |

## Alcance v1.0 (Instancia 1)

- Landing "Próximamente" responsiva con identidad Quanti (guía visual Figma).
- Formulario de captura con nombre + apellido + email, validación front + back.
- Persistencia en DB Postgres vía Supabase (`posibles_clientes`).
- Ruta `/admin` protegida con Supabase Auth + RLS: ver y filtrar leads (sin exportación a archivos).
- Link discreto de acceso al admin en el footer, visible desde Instancia 1.
- Infra base: proyecto Vercel + dominio `quantihidroponia.com.ar` + proyecto Supabase + cuenta Resend + remitente verificado.

## Alcance v2.0 (Instancia 2 — evolución, mismo proyecto)

- Home con Hero + CTAs + carrusel interactivo con las imágenes de los logos de clientes (assets fijos) + bloque 60 FPS.
- Sección "Sobre Nosotros" con historia, propuesta hidropónica y **sección puntos de venta** (misma lista de clientes, logos provistos al armar la página).
- Catálogo por solapas (Hojas Verdes, Hierbas Aromáticas, Microgreens) con ficha sin precios visibles.
- FAQ acordeón + formulario único de contacto (nombre + email + mensaje) vía Resend.
- Footer: Instagram, Facebook, email institucional, link admin.
- Admin suma CRUD completo de productos y categorías con imágenes (Storage + optimización), manteniendo vista y filtrado de leads.

## Fuera de alcance

- Precios visibles, carrito, checkout o pagos online.
- Formulario diferenciado B2B (backlog post-lanzamiento).
- Exportación de leads a archivos (CSV/Excel) — los leads se consultan en /admin.
- Contacto por WhatsApp como canal del sitio.
- Multi-idioma, analítica avanzada, notificaciones automáticas.

## Métricas de éxito

- Instancia 1: leads capturados/semana > 0 con tasa de rebote del formulario < 30%.
- Instancia 2: PageSpeed móvil ≥ 85, 0 errores de accesibilidad críticos (WCAG 2.1 AA), catálogo administrable sin intervención dev.
- Adopción admin: 100% de altas de productos hechas por personal Quanti (no por devs) a los 30 días del lanzamiento.
