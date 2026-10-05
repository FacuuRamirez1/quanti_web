# Modelo de Datos — Quanti Vegetales Hidropónicos

## Dominios

- **Captación**: interesados que dejan sus datos (Instancia 1 en adelante).
- **Catálogo**: productos y categorías gestionados por el admin (Instancia 2).
- **Acceso**: roles admin/superadmin sobre Supabase Auth.

## ERD

```
auth.users (Supabase Auth) 1──0..1 perfiles (id UUID PK/FK, role: admin|superadmin)
categorias (id PK) 1──N productos (categoria_id FK)
posibles_clientes (tabla independiente, sin FKs)
```

## Entidades

### posibles_clientes
- Atributos: `id UUID PK default gen_random_uuid()`, `nombre TEXT NOT NULL`, `apellido TEXT NOT NULL`, `email CITEXT NOT NULL`, `created_at TIMESTAMPTZ default now()`.
- Relaciones: ninguna.
- Constraints: `CHECK (nombre <> '' AND apellido <> '')`, `UNIQUE (lower(email))` — el email no se puede duplicar; formato de email validado en app (front + Server Action).
- Índices: `created_at DESC` (filtrado por fecha en /admin).

### categorias
- Atributos: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`, `nombre TEXT NOT NULL UNIQUE`, `slug TEXT NOT NULL UNIQUE`, `orden INT default 0`, `created_at TIMESTAMPTZ default now()`.
- Relaciones: 1──N con productos.
- Constraints: `slug` kebab-case generado en app.
- Seeds: `Hojas Verdes`, `Hierbas Aromáticas`, `Microgreens`.

### productos
- Atributos: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`, `categoria_id BIGINT FK → categorias NOT NULL`, `nombre TEXT NOT NULL`, `descripcion TEXT`, `imagen_url TEXT` (ruta en Storage), `orden INT default 0`, `activo BOOLEAN default true`, `created_at / updated_at TIMESTAMPTZ`.
- Relaciones: N──1 con categorias (`ON DELETE RESTRICT` — no borrar categoría con productos).
- Constraints: sin precio en el modelo (regla explícita: el sistema no almacena ni exhibe precios).

### perfiles (roles)
- Atributos: `id UUID PK → auth.users`, `role TEXT CHECK (role IN ('admin','superadmin'))`, `created_at`.
- Alternativa válida: rol en `auth.users.user_metadata`. Elegir una sola fuente de verdad en Hito 1 (ver `10_preguntas_abiertas.md`).

## RLS (resumen; policies exactas en implementación)

- `productos` / `categorias`: `SELECT` público (productos con `activo = true`); `INSERT/UPDATE/DELETE` solo `role IN (admin, superadmin)`.
- `posibles_clientes`: `INSERT` público (solo vía Server Action, con validación + rate limit); `SELECT` solo admin/superadmin; sin `UPDATE/DELETE` público.
- Storage (bucket `productos`): lectura pública; escritura solo admin/superadmin; validar tipo/tamaño en servidor.

## Contenido estático (NO en DB — decisión vigente)

- Logos de clientes: assets fijos en `public/clientes/` (ej. `.webp` optimizados) + lista fija en código/config. Doble placement: carrusel del Home y sección puntos de venta en About Us (misma lista).
- Textos institucionales, FAQ, imágenes hero: contenido versionado en el repo (no CMS en MVP).

## Seed data inicial

- 3 categorías seed; 1 usuario admin inicial (creado manualmente en Supabase Auth, rol por metadata/perfiles); 2-3 productos de ejemplo `activo = false` como plantilla.
