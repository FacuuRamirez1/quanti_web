# Tasks — C-01 foundation-infra

> Convención: cada tarea trae su verificación en la descripción. Paso manual del usuario (pegar keys Supabase en `.env.local`) va en 2.1 como nota: la implementación usa dummies documentados y el fail-fast de 2.2 lo cubre.

## 1. Scaffold y estructura

- [x] 1.1 Generar scaffold Next.js 15 (App Router + TypeScript estricto + Tailwind v4) en la raíz sin pisar `knowledge-base/`, `CHANGES.md`, `openspec/`, `discovery/` y verificar que `package.json`, `tsconfig.json` (strict), `next.config` y `app/layout.tsx` existen
- [x] 1.2 Instalar dependencias (`@supabase/ssr`, `zod`, `framer-motion` última estable compatible con Next 15) y verificar que la instalación completa y el lockfile queda commiteado en working tree
- [x] 1.3 Crear la estructura de directorios según `08` (`app/(publico)`, `app/admin`, `app/actions`, `app/api`, `components/`, `lib/supabase`, `public/clientes/`, `supabase/migrations`) y verificar que el árbol resultante coincide con el diseño (sin código de negocio todavía)

## 2. Entorno y wiring Supabase (sin DB writes)

- [x] 2.1 Crear `.env.example` con las seis variables comentadas + asegurar `.env.local` en `.gitignore`, y verificar con `git check-ignore .env.local` que el archivo real nunca entraría al repo (nota: el usuario pega los valores reales — URL + anon + service_role — en `.env.local` al implementar; hasta entonces se usan dummies documentados)
- [x] 2.2 Implementar `lib/env.ts` (zod, fail-fast que nombra la variable faltante) y verificar que arrancar sin una variable requerida falla con mensaje claro que la nombra
- [x] 2.3 Implementar `lib/supabase/{client,server,middleware}.ts` con `@supabase/ssr` leyendo solo envs (cero claves hardcodeadas) y verificar con typecheck + `grep` que no hay keys en código y que ambos clientes se instancian con envs presentes

## 3. Guardia stub, health y shell accesible

- [x] 3.1 Implementar `middleware.ts` stub (matcher `/admin/:path*`, redirección a `/admin/login` o 403, resto pasa) + página `/admin/login` stub, y verificar que `GET /admin` sin sesión no muestra contenido admin mientras `/` y `/api/health` pasan sin redirección
- [x] 3.2 Implementar `GET /api/health` (`200` + `{ "status": "ok" }`, sin auth) y verificar con curl que responde 200 con ese JSON exacto
- [x] 3.3 Ajustar layout raíz (`lang="es"`, skip-link, landmarks) + página `/` placeholder con `h1` único, y verificar en el DOM servido que existen `<html lang="es">`, skip-link, un solo `h1` y landmarks
- [x] 3.4 Crear `lib/validaciones.ts` (módulo zod compartido, stub documentado para C-04) y `lib/clientes.ts` + `public/clientes/` placeholder, y verificar que importan sin errores bajo typecheck estricto (R2)

## 4. Convenciones de migraciones y runbook

- [x] 4.1 Documentar convención de nombrado `supabase/migrations/YYYYMMDDHHMMSS_nombre.sql`, crear `supabase/APLICAR.md` (runbook: pegar SQL en dashboard + queries de verificación) y `supabase/seed.sql` placeholder, y verificar que los tres archivos existen y el runbook describe aplicar + verificar sin ejecutar ninguna escritura contra la DB en este change

## 5. Gates de calidad y verificación integral

- [x] 5.1 Configurar Lighthouse CI (`lighthouserc` con los cuatro umbrales KB exactos + script npm contra `next build && next start` + workflow CI listo para PRs) y verificar que una corrida local completa evalúa los cuatro umbrales (pasa o reporta cuál falla)
- [x] 5.2 Corrida integral en verde (`install` + `tsc --noEmit` + `lint` + `build` + `start` + `curl /api/health` + LHCI) y verificar que todo está verde en local — es el criterio de cierre de C-01 (sin deploy)
- [x] 5.3 Verificar checklist WCAG base del scaffold (contraste placeholder ≥ 4.5:1, foco visible por teclado, labels/landmarks, `alt` donde aplique) y verificar que queda registrado el pase con notas de lo pendiente para C-04/C-06
