# Runbook C-02 — aplicar migración leads (dashboard-first)

> El agente NUNCA aplica SQL contra la DB. El USUARIO pega y ejecuta en el
> dashboard. Sin credenciales en el repo (R3): solo placeholders en `.env.example`.

## Paso 1 — Aplicar

1. Supabase Dashboard → proyecto → **SQL Editor** → **New query**.
2. Pegar el contenido completo de
   `supabase/migrations/20261007191058_posibles_clientes_y_perfiles.sql`.
3. **Run** → debe terminar sin errores (transacción única: todo o nada).
4. Si falla `CREATE EXTENSION citext`: Database → Extensions → habilitar
   `citext` y reintentar.

## Paso 2 — Correctiva 002 (grants service_role, después de 001)

> Sin esta 002 el JWT legacy de `service_role` recibe `42501 permission denied`
> en `posibles_clientes` y `perfiles`. La 001 solo otorgó a `anon`/`authenticated`.
> Las policies RLS están probadas (bloque B verde); esto solo repone el permiso
> a nivel tabla/secuencia para ops server-side (verificación admin, limpieza C, C-05).

1. SQL Editor → **New query**.
2. Pegar el contenido completo de
   `supabase/migrations/20261007194943_grants_service_role.sql`.
3. **Run** → debe terminar sin errores (re-ejecutable: `GRANT` es idempotente).
4. Verificación esperada (SQL Editor, corre como superusuario):

```sql
-- Grants de service_role presentes (3+ filas: 2 tablas + secuencia)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('posibles_clientes', 'perfiles')
  and grantee = 'service_role';
-- Esperado: ALL (o SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) en ambas tablas

select grantee, privilege_type
from information_schema.role_usage_grants
where object_schema = 'public'
  and object_name = 'posibles_clientes_id_seq'
  and grantee = 'service_role';
-- Esperado: USAGE (+ SELECT en role_routine_grants/role_table_grants según versión)
```

5. Verificación funcional: repetir la verificación del admin / bloque C usando
   el cliente con `service_role` (solo servidor, nunca en el browser): el
   `SELECT` sobre `posibles_clientes` ya no devuelve `42501`.

## Bloque A — Verificación por catálogo (SQL Editor, corre como superusuario; NO prueba RLS)

```sql
-- A1. Tablas + RLS activo (ambas rowsecurity = true)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('posibles_clientes', 'perfiles');

-- A2. Policies exactas (3 filas)
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('posibles_clientes', 'perfiles')
order by tablename, policyname;
-- Esperado: posibles_clientes_insert_public/INSERT/{anon,authenticated},
--   posibles_clientes_select_admin/SELECT/{authenticated},
--   perfiles_select_own/SELECT/{authenticated}

-- A3. Índices (único email + fecha DESC)
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'posibles_clientes';

-- A4. Extensión citext habilitada (1 fila)
select extname from pg_extension where extname = 'citext';

-- A5. Constraints (2 CHECK en leads + CHECK de rol en perfiles)
select conname, contype
from pg_constraint
where conrelid in ('public.posibles_clientes'::regclass, 'public.perfiles'::regclass)
order by conname;
```

## Bloque B — Pruebas RLS (con anon key, NUNCA en SQL Editor)

El SQL Editor corre como superusuario y bypasea RLS: daría falso verde.
Ejecutar desde la app local (usa `lib/supabase/client.ts` de C-01, que solo
lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cero
secretos hardcodeados) o con curl contra la Data API. Emails de prueba con
`+test` para identificarlos y borrarlos después.

```ts
// Consola del navegador con la app en local (sin sesión iniciada)
import { createClient } from "@/lib/supabase/client";
const db = createClient();

// B1. INSERT válido ok
await db.from("posibles_clientes").insert({
  nombre: "Ana", apellido: "Prueba",
  email: "ana+test@mail.com",
  acepta_politicas: true, politicas_version: "v1.0", consent_at: new Date().toISOString(),
}); // esperado: sin error

// B2. Duplicado exacto rechazado
await db.from("posibles_clientes").insert({
  nombre: "Ana", apellido: "Prueba",
  email: "ana+test@mail.com",
  acepta_politicas: true, politicas_version: "v1.0", consent_at: new Date().toISOString(),
}); // esperado: error 23505 (unicidad)

// B3. Duplicado con mayúsculas rechazado (RN-LEAD-05)
await db.from("posibles_clientes").insert({
  nombre: "Ana", apellido: "Prueba",
  email: "ANA+TEST@MAIL.COM",
  acepta_politicas: true, politicas_version: "v1.0", consent_at: new Date().toISOString(),
}); // esperado: error 23505
// NOTA: Gmail ignora lo que sigue a `+`, así que `ana+test@mail.com` y
// `ANA+TEST@MAIL.COM` colisionan también para el proveedor — es solo
// coincidencia del ejemplo, la unicidad la impone la DB (lower(email)).

// B4. INSERT sin consentimiento rechazado
await db.from("posibles_clientes").insert({
  nombre: "Sin", apellido: "Consentimiento",
  email: "nada+test@mail.com",
  acepta_politicas: false,
}); // esperado: error 23514 (CHECK) o 42501 (policy WITH CHECK)

// B5. SELECT anónimo sin filas (denegación estricta aceptada)
await db.from("posibles_clientes").select("id"); // esperado: error 42501 (permission denied) — más estricto que [] y aceptado; en ningún caso devuelve filas
```

## Alta manual del admin + Bloque C

1. Dashboard → **Authentication** → **Add user** → crear usuario manualmente
   (email + password provisorios, entregados por canal seguro fuera del repo).
2. Copiar el UUID del usuario y ejecutar en SQL Editor:
   ```sql
   insert into public.perfiles (id, role) values ('<UUID-DEL-USUARIO>', 'admin');
   ```
3. Iniciar sesión como ese usuario en la app y repetir el SELECT del bloque B:
   debe devolver las filas `+test` (SELECT admin ok).
4. Un usuario autenticado SIN fila en `perfiles` debe recibir cero filas.

## Bloque C — Limpieza (cero seeds persistentes)

```sql
-- Borrar filas de prueba y confirmar tabla vacía
delete from public.posibles_clientes where email like '%+test@%';
select count(*) from public.posibles_clientes; -- esperado: 0
```

## Reversa (solo pre-deploy, sin datos reales)

```sql
-- Orden inverso; la extensión citext se conserva.
drop table if exists public.posibles_clientes;
drop table if exists public.perfiles;
```

## Reglas

- Ninguna credencial (passwords, service_role, anon key) existe ni existirá
  en el repo — solo placeholders en `.env.example` (R3).
- No quedan leads semilla: tras la verificación la tabla contiene cero filas.
- Nunca editar la migración ya aplicada: corregir con migración nueva.
- Registrar la aplicación (fecha + archivo) en el hilo del change.
