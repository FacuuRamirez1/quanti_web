# Actores y Roles — Quanti Vegetales Hidropónicos

## Actores del sistema

| Actor | Descripción | Cómo interactúa |
|---|---|---|
| Visitante B2C | Consumidor final: busca origen, beneficios sin agrotóxicos, puntos de venta y contacto | Navegación pública, landing, catálogo, FAQ, formulario único |
| Cliente B2B mayorista | Comprador comercial (restaurantes, verdulerías, supermercados): evalúa catálogo y provisión | Mismo sitio público + mismo formulario único (sin canal separado) |
| Admin Quanti | Personal designado: gestiona leads y catálogo | `/admin` autenticado (email + password vía Supabase Auth); ingreso por link discreto en el footer desde Instancia 1 |
| SuperAdmin Dev | Equipo técnico: auditoría, soporte, infra | `/admin` con privilegios ampliados (gestión de usuarios, RLS, deploys) |

## RBAC — Matriz de permisos

| Rol | `posibles_clientes` | `productos` | `categorias` | Usuarios/Roles |
|---|---|---|---|---|
| Anónimo (público) | INSERT (vía Server Action validada) | SELECT solo `activo = true` | SELECT todas | — |
| Admin Quanti | SELECT + filtrar | CRUD completo | CRUD completo | Ver su propio usuario |
| SuperAdmin Dev | Todo lo de Admin | Todo lo de Admin | Todo lo de Admin | Gestionar usuarios y roles |

Implementación: RLS en Postgres + rol resuelto por `user_metadata` (`role: admin | superadmin`) o tabla `perfiles`. El Middleware oficial de Supabase protege `/admin` y refresca la sesión.

## Rutas públicas

- `/` — landing (Instancia 1) → Home (Instancia 2)
- `/nosotros` — historia + propuesta hidropónica + puntos de venta (Instancia 2)
- `/catalogo` — catálogo por categorías (Instancia 2)
- `/faq-contacto` (o secciones en Home) — FAQ + formulario único (Instancia 2)

## Rutas protegidas

- `/admin` — panel (requiere sesión + rol admin/superadmin). Desde Instancia 1: ver/filtrar leads. Desde Instancia 2: + CRUD productos/categorías.
- `/admin/login` — ingreso (pública, solo formulario de autenticación).
