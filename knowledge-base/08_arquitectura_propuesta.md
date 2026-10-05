# Arquitectura Propuesta — Quanti Vegetales Hidropónicos

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|---|---|---|
| Monolito modular (App Router) | Todo el proyecto, un deploy | Equipo chico, 6 semanas, un solo dominio; evita microservicios innecesarios |
| RSC + Server Actions | Páginas públicas y mutaciones | SEO por SSR + mutaciones sin API propia; validación siempre en servidor |
| Middleware de sesión | `/admin/*` | Protección de rutas + refresh de tokens con el SDK oficial (`@supabase/ssr`) |
| RLS como última defensa | `posibles_clientes`, `productos`, `categorias`, Storage | La UI no es frontera de seguridad; la DB decide |
| Contenido estático versionado | Logos clientes, textos, FAQ | Sin CMS en MVP: simple, rápido, trazable en git |
| Presupuesto de performance | Imágenes, animaciones, JS | P5 = rendimiento primero: cada agregado debe caber en el presupuesto (ver `11`) |

## Estructura de directorios

```
quanti-web/
├── app/
│   ├── (publico)/
│   │   ├── page.tsx              # landing (I1) → Home (I2)
│   │   ├── nosotros/page.tsx     # historia + puntos de venta (I2)
│   │   ├── catalogo/page.tsx     # catálogo por solapas (I2)
│   │   └── faq-contacto/page.tsx # FAQ + formulario único (I2)
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx              # ver/filtrar leads (I1)
│   │   ├── productos/…           # CRUD productos (I2)
│   │   └── categorias/…          # CRUD categorías (I2)
│   ├── actions/
│   │   ├── leads.ts              # registrarLead
│   │   ├── contacto.ts           # enviarContacto (Resend)
│   │   └── admin/…               # mutaciones protegidas
│   └── api/                      # solo lo imprescindible (ej. revalidación)
├── components/ (ui/ + secciones/ + admin/)
├── lib/
│   ├── supabase/ (client, server, middleware)
│   ├── validaciones.ts           # zod o equivalente, compartido front/back
│   └── clientes.ts               # lista fija de logos (doble placement)
├── public/clientes/              # imágenes de logos (fijas, optimizadas)
├── supabase/
│   ├── migrations/               # tablas + RLS + Storage (versionados)
│   └── seed.sql                  # categorías + productos ejemplo
└── middleware.ts                 # Supabase Auth (protege /admin)
```

## Seguridad

- Autenticación: Supabase Auth (email + password), sesiones en cookies `httpOnly`/`secure`, refresh automático.
- Autorización: Middleware (ruta) + RLS (dato). Roles: `admin` / `superadmin` (metadata o tabla `perfiles` — una sola fuente, decidir en Hito 1).
- Validación de input: schemas compartidos (front para UX, back como autoridad); rate limit + honeypot en formularios públicos.
- Secrets management: solo env vars del servidor (nunca `NEXT_PUBLIC_*` para claves); service role jamás en cliente.

## Variables de entorno

| Variable | Descripción | Ejemplo | Sensible |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xyz.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (RLS mediante) | `eyJ…` | Parcial |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor (tareas admin puntuales) | `eyJ…` | Sí |
| `RESEND_API_KEY` | Envío de formulario | `re_…` | Sí |
| `CONTACTO_DESTINO` | Casilla corporativa destino | `contacto@quantihidroponia.com.ar` | No |
| `RESEND_REMITENTE` | Remitente verificado | `notificaciones@quantihidroponia.com.ar` | No |

## Decisiones de deploy

Vercel conectado a `quantihidroponia.com.ar` (requiere acceso al DNS — desbloqueador Hito 1). Previews por PR para validar con el responsable antes de producción. Migraciones Supabase versionadas en el repo.
