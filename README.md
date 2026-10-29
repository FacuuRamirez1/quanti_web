# Quanti — Web Institucional y Panel de Administración de Leads

Plataforma web desarrollada para la captación y gestión segura de interesados en vegetales hidropónicos, diseñada bajo un enfoque estricto de **Security-by-Design** y cumplimiento de normativas de privacidad.

---

## Alcance funcional — Instancia 1

- **Landing page de captura**: interfaz pública con presentación de los pilares de marca y un formulario de registro de leads con validación estricta.
- **Panel de administración (`/admin`)**: vista protegida para la consulta, filtrado (por nombre, email y rango de fechas UTC) y paginación de los contactos registrados.
- **Garantía de cero exportación**: bloqueo absoluto de mecanismos de descarga masiva (CSV/Excel) para proteger los datos de los usuarios.

---

## Seguridad y cumplimiento normativo

- **Privacidad y Ley 25.326**: consentimiento explícito y versionado (v1.0), obligatorio en la captura de datos, con almacenamiento auditado de la marca temporal de consentimiento (`consent_at`).
- **Autenticación y guardia de roles**: login mediante Supabase Auth, con resolución de roles aislada estrictamente en la tabla `perfiles` (se descartan los metadatos de usuario).
- **Defensas anti-abuso en el login**:
  - Campo *honeypot* invisible para detección de bots, con respuesta genérica byte-idéntica.
  - Rate-limiting en servidor con clave dual (IP / email) y *backoff* progresivo (bloqueos de 2, 10 y 30 minutos).
- **Doble defensa de datos (Double-Guard)**: verificación de roles en servidor previa a las consultas, combinada con las políticas de seguridad a nivel de filas (RLS) de Supabase.

---

## Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router, Server Actions, Server Components) |
| Estilos | Tailwind CSS v4 |
| Base de datos y Auth | Supabase (PostgreSQL, Row Level Security, Auth, CITEXT) |
| Validación de datos | Zod |
| Testing | Vitest (lógica unitaria) y Playwright con canal Edge (E2E y accesibilidad con axe-core) |

---

## Primeros pasos

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/FacuuRamirez1/quanti_web.git
   cd quanti_web
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar las variables de entorno locales copiando la plantilla y completando las credenciales de Supabase:

   ```bash
   cp .env.example .env.local
   ```

   > `.env.local` nunca se commitea. `SUPABASE_SERVICE_ROLE_KEY` es exclusiva del servidor.

4. Aplicar las migraciones de base de datos de `supabase/migrations/` (ver `supabase/APLICAR.md` y `supabase/APLICAR_C02.md`).

5. Ejecutar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

---

## Ejecución de pruebas

| Comando | Descripción |
|---------|-------------|
| `npm run test:unit` | Tests unitarios con Vitest |
| `npm run test:e2e` | Suite end-to-end con Playwright (requiere Microsoft Edge instalado) |
| `npm run typecheck` | Verificación de tipos con TypeScript |
| `npm run lint` | Análisis estático con ESLint |
| `npm run build` | Build de producción |

`typecheck`, `lint` y `build` son verificaciones estáticas obligatorias.
