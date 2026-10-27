# Runbook: aplicar migraciones Supabase (dashboard-first)

Flujo acordado (diseño 7): el usuario pega el SQL en el dashboard Supabase
desde C-02. En C-01 no se ejecuta ninguna escritura contra la DB.

## Aplicar

1. Abrir Supabase Dashboard → proyecto → **SQL Editor** → **New query**.
2. Pegar el contenido de `supabase/migrations/YYYYMMDDHHMMSS_nombre.sql`.
3. **Run** y confirmar que termina sin errores.
4. Registrar la aplicación (fecha + archivo) en el hilo del change.

## Verificar (después de cada migración)

```sql
-- 1. La tabla existe y RLS está activo
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';

-- 2. Policies creadas
select policyname, cmd, roles
from pg_policies
where schemaname = 'public';

-- 3. Grants de Data API (anon/authenticated según el modelo de acceso)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public';
```

## Reglas

- Si una verificación falla: NO seguir al siguiente change; abrir issue en el
  change correspondiente.
- Nunca aplicar con `service_role` en cliente ni pegar claves en el SQL (R3).
- Cada policy RLS necesita su test de verificación (quién ve qué fila).
