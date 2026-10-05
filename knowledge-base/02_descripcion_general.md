# Descripción General — Quanti Vegetales Hidropónicos

## Stack tecnológico

| Capa | Tecnologías | Versión mínima |
|---|---|---|
| Framework full-stack | Next.js (App Router) + React | Next.js 16 |
| Estilos | Tailwind CSS | v4 |
| Animaciones | Framer Motion (o CSS Transitions si el presupuesto de JS lo exige) | Última estable |
| Base de datos | PostgreSQL gestionada vía Supabase | Supabase (Postgres 15+) |
| Auth + Storage | Supabase Auth, Supabase Storage | SDK `@supabase/ssr` |
| Email transaccional | Resend (SDK o REST) | Última estable |
| Deploy + hosting | Vercel + dominio `quantihidroponia.com.ar` | — |
| Imágenes | `next/image` + Storage de Supabase (productos) y `public/` (assets fijos) | — |

## Arquitectura general

Monolito web modular (web app monolítica, un deploy): el mismo proyecto Next.js sirve el sitio público y el `/admin`, con Server Actions como capa de mutación y Supabase como backend (Postgres + Auth + Storage). Las dos instancias son dos releases del mismo codebase, no dos sistemas.

```
                    ┌─────────────────────────────────────────┐
Visitante ─────────▶│  Next.js (Vercel, quantihidroponia.com.ar) │
                    │  ┌──────────┐  ┌───────────────────────┐  │
                    │  │ Público  │  │ /admin (Middleware    │  │
                    │  │ (RSC)    │  │  Supabase + RLS)      │  │
                    │  └────┬─────┘  └───────────┬───────────┘  │
                    │       │ Server Actions      │              │
                    └───────┼─────────────────────┼──────────────┘
                            ▼                     ▼
                    ┌─────────────────────────────────────────┐
                    │  Supabase: Postgres │ Auth │ Storage     │
                    └─────────────────────────────────────────┘
Formulario ──▶ Resend ──▶ casilla corporativa
```

Decisiones de alto nivel: SSR/RSC para SEO del contenido institucional; mutaciones solo vía Server Actions validadas (nunca SQL desde el cliente); lectura pública de catálogo con RLS; escritura restringida a roles.

## Integraciones externas

| Servicio | Propósito | Tipo |
|---|---|---|
| Supabase Postgres | Persistencia (`posibles_clientes`, `productos`, `categorias`) | SDK (`@supabase/ssr`) |
| Supabase Auth | Sesiones admin (cookies seguras, refresh de tokens) | SDK + Middleware oficial |
| Supabase Storage | Imágenes de productos (con optimización) | SDK |
| Resend | Envío del formulario de contacto a casilla corporativa | SDK/REST |
| Vercel | Deploy + hosting + TLS | Plataforma |
| Instagram / Facebook | Enlaces en footer (contacto y comunidad) | Enlaces externos |

## API REST

No hay API REST propia: las mutaciones viajan por Server Actions. Las únicas "APIs" son las de terceros (Supabase, Resend). Los formularios públicos usan Actions con validación en servidor + rate limiting básico.
