# leads-data-model Specification

## Purpose

Define el contrato de datos de captación de Instancia 1: la tabla `posibles_clientes` con consentimiento versionado, la tabla `perfiles` como única fuente de roles, y las garantías RLS que C-03 (auth), C-04 (captura) y C-05 (panel) consumen.

## Requirements

### Requirement: Tabla posibles_clientes con identidad BIGINT y consentimiento

El sistema SHALL persistir cada lead en `posibles_clientes` con `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `nombre TEXT NOT NULL`, `apellido TEXT NOT NULL`, `email CITEXT NOT NULL`, `acepta_politicas BOOLEAN NOT NULL DEFAULT false`, `politicas_version TEXT`, `consent_at TIMESTAMPTZ` y `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, con `CHECK (nombre <> '' AND apellido <> '')`.

#### Scenario: Lead válido persiste con todos los campos

- **WHEN** se inserta una fila con nombre/apellido no vacíos, email válido, `acepta_politicas = true`, `politicas_version = 'v1.0'` y `consent_at` presente
- **THEN** la fila persiste con `id` autogenerado y `created_at` cercano a `now()`

#### Scenario: Nombre o apellido vacío rechazado

- **WHEN** se intenta insertar con `nombre = ''` o `apellido = ''`
- **THEN** la base de datos rechaza la fila por violación de CHECK y no persiste nada

### Requirement: Email único case-insensitive

El sistema SHALL rechazar cualquier INSERT en `posibles_clientes` cuyo email coincida con uno existente ignorando mayúsculas/minúsculas (`UNIQUE` sobre `lower(email)`, RN-LEAD-05), sin crear duplicado ni modificar el registro existente.

#### Scenario: Duplicado exacto rechazado

- **WHEN** ya existe `ana@mail.com` y se inserta `ana@mail.com`
- **THEN** la inserción falla por unicidad y la tabla sigue con una sola fila para ese email

#### Scenario: Duplicado con distinta capitalización rechazado

- **WHEN** ya existe `ana@mail.com` y se inserta `ANA@MAIL.COM`
- **THEN** la inserción falla por unicidad (comparación case-insensitive)

### Requirement: Sin consentimiento no hay INSERT válido

El sistema SHALL rechazar todo INSERT en `posibles_clientes` con `acepta_politicas <> true`. Cada fila válida SHALL conservar `politicas_version` (ej. `v1.0`) y `consent_at` como registro auditable del consentimiento.

#### Scenario: INSERT sin consentimiento rechazado

- **WHEN** se intenta insertar con `acepta_politicas = false` (o se omite la columna y aplica `DEFAULT false`)
- **THEN** la base de datos rechaza la fila y no persiste nada

#### Scenario: INSERT con consentimiento conserva versión y fecha

- **WHEN** se inserta con `acepta_politicas = true`, `politicas_version = 'v1.0'` y `consent_at = now()`
- **THEN** la fila persiste y una lectura posterior muestra la misma versión y una fecha de consentimiento no nula

### Requirement: Esquema compartido leadSchema (zod) como contrato de validación

El sistema SHALL exponer `leadSchema` en `lib/validaciones.ts` como único contrato de validación app del lead (R2 + KB `08`, RN-LEAD-01/02/05): `nombre`/`apellido` `z.string().trim().min(1)` (no vacíos ni solo espacios), `email` `z.string().trim().toLowerCase().email()` (formato válido y normalizado), `acepta_politicas` `z.literal(true)` (checkbox obligatorio). C-04 SHALL importarlo en formulario y Server Action sin redefinirlo; la DB SHALL re-validar (CHECK/UNIQUE) como última defensa.

#### Scenario: Lead válido pasa el schema

- **WHEN** se valida `{ nombre: 'Ana', apellido: 'García', email: 'ana@mail.com', acepta_politicas: true }` con `leadSchema`
- **THEN** la validación tiene éxito y el email normalizado queda en minúsculas sin espacios

#### Scenario: Nombre o apellido vacío o solo espacios rechazado

- **WHEN** se valida con `nombre = ''`, `apellido = ''` o solo espacios (`'   '`)
- **THEN** `leadSchema` rechaza el input (aunque la DB también lo rechazaría por CHECK)

#### Scenario: Email con formato inválido rechazado

- **WHEN** se valida con `email = 'no-es-email'` o sin `@`
- **THEN** `leadSchema` rechaza el input antes de cualquier INSERT

#### Scenario: Sin aceptación de políticas rechazado

- **WHEN** se valida con `acepta_politicas = false` (o ausente)
- **THEN** `leadSchema` rechaza el input y no se intenta ningún INSERT

#### Scenario: Email con mayúsculas y espacios se normaliza

- **WHEN** se valida con `email = '  ANA@Mail.COM  '`
- **THEN** el valor parseado es `'ana@mail.com'` (trim + lowercase), listo para el chequeo de unicidad case-insensitive

### Requirement: RLS en posibles_clientes — INSERT público, SELECT solo admin

El sistema SHALL habilitar RLS en `posibles_clientes` con exactamente este modelo: `INSERT` permitido a `anon` y `authenticated` (el único camino de escritura, consumido por la Server Action validada de C-04) con `WITH CHECK (acepta_politicas = true)`; `SELECT` permitido solo a usuarios `authenticated` cuya fila en `perfiles` tenga `role IN ('admin','superadmin')`; sin policies de `UPDATE` ni `DELETE` para roles públicos (denegados por defecto). La lectura anónima SHALL devolver cero filas o error de permiso, nunca contenido.

#### Scenario: INSERT anónimo válido permitido

- **WHEN** un cliente sin sesión inserta un lead válido con consentimiento
- **THEN** la inserción tiene éxito

#### Scenario: SELECT anónimo denegado

- **WHEN** un cliente sin sesión intenta leer `posibles_clientes`
- **THEN** no recibe ninguna fila de leads

#### Scenario: SELECT admin permitido, SELECT sin rol denegado

- **WHEN** un usuario autenticado con fila `perfiles.role = 'admin'` (o `'superadmin'`) lee `posibles_clientes`
- **THEN** recibe las filas; y **WHEN** un autenticado sin fila en `perfiles` lee, **THEN** recibe cero filas

### Requirement: Tabla perfiles como única fuente de roles

El sistema SHALL resolver el rol exclusivamente desde `perfiles` (`id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `role TEXT NOT NULL CHECK (role IN ('admin','superadmin'))`, `created_at TIMESTAMPTZ DEFAULT now()`). Ninguna decisión de autorización SHALL basarse en `auth.users.user_metadata`. `perfiles` SHALL tener RLS habilitado con lectura de la propia fila para `authenticated` (lo que permite a las policies de leads resolver el rol sin recursión); cualquier otro acceso público SHALL estar denegado por defecto.

#### Scenario: Rol se resuelve por perfiles, no por metadata

- **WHEN** un usuario autenticado tiene `perfiles.role = 'admin'` independientemente del contenido de su `user_metadata`
- **THEN** el modelo de autorización lo trata como admin, y un `user_metadata.role = 'admin'` sin fila en `perfiles` no otorga acceso

#### Scenario: Usuario lee su propio perfil, ajenos no

- **WHEN** un autenticado lee `perfiles` filtrando por su propio `auth.uid()`
- **THEN** recibe su fila; y **WHEN** intenta leer filas de otros usuarios, **THEN** no las recibe (salvo gestión vía `service_role`, fuera del modelo público)

### Requirement: Índices y acceso Data API para el panel

El sistema SHALL exponer un índice `created_at DESC` para el ordenado/paginado del panel (C-05) y SHALL otorgar los grants mínimos para que la Data API funcione bajo RLS: `INSERT` en leads a `anon`/`authenticated`, `SELECT` en leads a `authenticated`, `USAGE, SELECT` en la secuencia de identidad a ambos, `SELECT` en `perfiles` a `authenticated`. La extensión `citext` SHALL estar habilitada para la columna `email`.

#### Scenario: Listado ordenado por fecha soportado por índice

- **WHEN** el panel consulta leads ordenados por `created_at DESC`
- **THEN** el plan de consulta usa el índice de fecha y devuelve el orden correcto

#### Scenario: Grants permiten el flujo anon-INSERT / admin-SELECT

- **WHEN** un anónimo inserta (con consentimiento) y luego un admin autenticado lee
- **THEN** ninguna de las dos operaciones falla por falta de permisos de tabla/secuencia (solo RLS decide las filas visibles)

### Requirement: Bootstrap manual del admin y cero seeds persistentes

El sistema SHALL documentar (fuera de la DB, en runbook) el alta manual del primer admin: crear usuario en Dashboard Auth y luego insertar su fila en `perfiles`; ninguna credencial SHALL existir en el repo. El sistema SHALL NOT incluir leads de prueba persistentes: las filas de verificación son efímeras y se borran tras la prueba.

#### Scenario: Alta manual otorga acceso y queda trazada

- **WHEN** se crea un usuario por dashboard y se inserta su fila `perfiles` con `role = 'admin'`
- **THEN** ese usuario puede leer `posibles_clientes` y el procedimiento queda registrado sin secretos en el repo

#### Scenario: Sin leads semilla tras la verificación

- **WHEN** finaliza la verificación de la migración
- **THEN** `posibles_clientes` contiene cero filas de prueba
