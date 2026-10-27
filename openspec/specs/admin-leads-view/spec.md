# admin-leads-view Specification

## Purpose
Panel de lectura de leads de Instancia 1: acceso autorizado en servidor, tabla ordenada y paginada, filtros por nombre/email/fecha transportados en la URL, estados amables y ausencia explícita de exportación a archivos.

## Requirements

### Requirement: Lectura server-side con doble defensa de autorización

El panel `/admin` SHALL leer `posibles_clientes` durante el renderizado en servidor con el cliente Supabase server-side bajo la sesión del usuario, y SHALL exigir sesión + rol `admin`/`superadmin` mediante la guardia server-side de `auth-admin-shell` antes de ejecutar la consulta (RN-AU-01/02); la RLS de `posibles_clientes` SHALL permanecer como última defensa. Ningún Client Component SHALL consultar Supabase ni recibir credenciales para hacerlo (R1). El comportamiento de acceso no autorizado SHALL ser el ya especificado en `auth-admin-shell`: sin sesión → redirect a `/admin/login?next=/admin`; autenticado sin rol → 403 sin contenido admin.

#### Scenario: Admin y superadmin leen los leads

- **WHEN** un usuario con `perfiles.role = 'admin'` o `'superadmin'` navega a `/admin`
- **THEN** el servidor consulta `posibles_clientes` con su sesión y la página renderiza los leads que la RLS le permite ver

#### Scenario: Acceso no autorizado no llega a la consulta

- **WHEN** un visitante sin sesión o un autenticado sin rol en `perfiles` solicita `/admin`
- **THEN** se aplica el comportamiento de `auth-admin-shell` (redirect a login o 403) y no se renderiza ningún lead

#### Scenario: Cero consultas Supabase desde el cliente

- **WHEN** se inspecciona el bundle y los Client Components que participan de `/admin`
- **THEN** ninguno importa el cliente Supabase ni ejecuta consultas a `posibles_clientes`

### Requirement: Tabla de leads con orden determinista y datos auditables

El sistema SHALL renderizar una `<table>` semántica con los leads de `posibles_clientes` ordenados por `created_at DESC` y desempate estable por `id DESC`, mostrando las columnas nombre, apellido, email, fecha de alta, `politicas_version` y `consent_at`. La fecha de alta SHALL mostrarse en formato legible es-AR dentro de un elemento `<time datetime>` con el instante ISO 8601, usando UTC como zona horaria explícita y visible. Los valores `null` de `politicas_version` o `consent_at` SHALL mostrarse con un placeholder accesible (p. ej. "Sin registro"), nunca como celda vacía silenciosa.

#### Scenario: Orden por fecha descendente con desempate estable

- **WHEN** existen leads con distintas fechas y varios con el mismo `created_at`
- **THEN** se muestran del más nuevo al más viejo y, entre timestamps iguales, por `id` descendente, sin repetir ni saltear filas entre páginas

#### Scenario: Columnas visibles y fechas legibles

- **WHEN** se renderiza la tabla con un lead completo
- **THEN** se ven nombre, apellido, email, la fecha de alta en formato es-AR dentro de `<time datetime="...">` con indicación de UTC, `politicas_version` y `consent_at`

#### Scenario: Consentimiento nulo tiene placeholder accesible

- **WHEN** un lead tiene `politicas_version` o `consent_at` en `null`
- **THEN** la celda muestra un placeholder textual accesible en lugar de quedar vacía

### Requirement: Filtros server-side por nombre, email y rango de fechas

El sistema SHALL aceptar los parámetros de URL `nombre`, `email`, `from` y `to`, y SHALL aplicarlos en la consulta del servidor (nunca filtrando en el cliente). `nombre` y `email` SHALL ser búsquedas parciales case-insensitive, con `%` y `_` del input tratados como caracteres literales (escapados, no como comodines). `from` y `to` SHALL tener formato `YYYY-MM-DD` válido e interpretarse en UTC: `from` incluye desde `00:00:00.000Z` de ese día y `to` incluye hasta el final de ese día (equivalente a `<` del día siguiente a `00:00:00.000Z`). Los filtros SHALL combinarse con AND y el total paginado SHALL reflejar el conjunto filtrado. Los parámetros inválidos (formato incorrecto, fecha inexistente, `from > to`, nombre/email de más de 100 caracteres) SHALL descartarse sin producir error de página, manteniendo los demás filtros válidos.

#### Scenario: Búsqueda parcial de nombre case-insensitive

- **WHEN** se solicita `/admin?nombre=gar`
- **THEN** aparecen los leads cuyo nombre contiene "gar" sin distinguir mayúsculas/minúsculas (p. ej. "García")

#### Scenario: Comodines del usuario se buscan literalmente

- **WHEN** el nombre buscado contiene `%` o `_`
- **THEN** esos caracteres se buscan como texto literal y no amplían ni alteran el patrón de búsqueda

#### Scenario: Rango de fechas inclusivo en UTC

- **WHEN** se solicita `/admin?from=2026-10-01&to=2026-10-20`
- **THEN** se incluyen los leads creados desde `2026-10-01T00:00:00.000Z` hasta `2026-10-20T23:59:59.999Z` y se excluyen los de `2026-10-21T00:00:00.000Z`

#### Scenario: Rango inválido o invertido no rompe la página

- **WHEN** `from`/`to` tienen formato inválido, una fecha inexistente o `from > to`
- **THEN** el rango se descarta, la página responde normalmente y el resto de los filtros válidos sigue aplicándose

#### Scenario: Filtros combinados y compartibles por URL

- **WHEN** se combinan `nombre`, `email` y fechas en la URL
- **THEN** la consulta aplica todos con AND, el resultado es reproducible al compartir la URL y la paginación conserva los filtros

### Requirement: Paginación server-side acotada y accesible

El sistema SHALL paginar en el servidor con un tamaño fijo de 20 filas, `range()` y conteo exacto, aceptando `page` como entero entre 1 y un tope de 1000; valores fuera de ese rango SHALL descartarse y usar página 1. Los controles SHALL ser navegables por teclado, mostrar "Página X de Y", conservar los filtros activos y exponer los estados sin página anterior/siguiente de forma real (no solo visual), sin href ni foco cuando no correspondan. Si `page` supera la última página existente, el sistema SHALL mostrar un estado amable con enlace a la primera página en lugar de un error.

#### Scenario: Página 1 y 2 no se solapan

- **WHEN** hay más de 20 leads y se navega de la página 1 a la 2
- **THEN** la página 1 muestra los 20 más nuevos y la 2 los siguientes 20, sin filas repetidas ni omitidas

#### Scenario: Timestamps iguales no duplican ni saltean filas

- **WHEN** varios leads comparten `created_at` en el límite entre páginas
- **THEN** el desempate por `id DESC` mantiene cada fila en una sola página

#### Scenario: Página inválida cae en la primera

- **WHEN** `page` es `0`, negativo, decimal, no numérico o mayor a 1000
- **THEN** se muestra la página 1

#### Scenario: Página fuera del total muestra estado amable

- **WHEN** `page` es válido pero supera la última página disponible
- **THEN** se muestra un aviso amable con enlace a la primera página, sin error

#### Scenario: Controles anuncian posición y límites

- **WHEN** se renderiza la paginación
- **THEN** se lee "Página X de Y" y los controles anterior/siguiente reflejan su disponibilidad real y conservan los filtros

### Requirement: Sin exportación de leads a archivos

El sistema SHALL NOT exponer ninguna ruta, Server Action, control ni enlace que exporte o descargue leads en formato de archivo (CSV, Excel, JSON adjunto u otro). La gestión de leads SHALL ocurrir exclusivamente en el panel mediante consulta y filtrado (RN-LEAD-04, DD-03).

#### Scenario: El panel no ofrece descarga

- **WHEN** un admin recorre `/admin` con teclado y lector de pantalla
- **THEN** no encuentra botón, enlace ni control de exportación/descarga

#### Scenario: No existe ruta de exportación

- **WHEN** se solicitan rutas plausibles de exportación bajo `/admin` o `/api`
- **THEN** responden 404/405 y ninguna devuelve un archivo con leads

#### Scenario: No existe acción de exportación

- **WHEN** se auditan las Server Actions, Route Handlers y rutas del proyecto
- **THEN** ninguna devuelve leads como archivo descargable

### Requirement: Estados vacío, error y loading accesibles

El sistema SHALL distinguir el estado sin leads (`posibles_clientes` vacía) del estado sin resultados por filtros, ofreciendo en este último un enlace para limpiar los filtros. Ante un error de base de datos SHALL mostrar un mensaje genérico y amable, sin detalles internos, anunciado con `role="alert"` y conservando la cáscara del panel. Mientras la consulta se resuelve SHALL existir un estado de carga con `aria-busy` que no rompa el layout.

#### Scenario: Sin leads registrados

- **WHEN** `posibles_clientes` no tiene filas y no hay filtros activos
- **THEN** se muestra un mensaje que indica que todavía no hay leads registrados

#### Scenario: Filtros sin resultados

- **WHEN** una consulta filtrada devuelve cero filas
- **THEN** se muestra "No hay resultados para los filtros aplicados" con un enlace que limpia los filtros y vuelve a `/admin`

#### Scenario: Error de base de datos

- **WHEN** la consulta a Supabase falla
- **THEN** se muestra un mensaje genérico anunciado con `role="alert"`, sin exponer códigos, mensajes internos ni datos

#### Scenario: Estado de carga anunciado

- **WHEN** la página espera la respuesta de la consulta
- **THEN** se muestra un estado de carga con `aria-busy` y sin salto de layout perceptible

### Requirement: Accesibilidad de tabla, filtros y paginación

La tabla SHALL tener un `<caption>` o título asociado y encabezados `<th scope="col">`; el formulario de filtros SHALL tener etiquetas asociadas y enviarse con Enter; la paginación SHALL usar controles operables por teclado con foco visible. La información no SHALL depender solo del color y el contraste SHALL ser ≥ 4.5:1. Los cambios de resultado SHALL producirse por navegación server-side que actualiza la URL (anunciada por la carga de página); si se usara navegación cliente, SHALL existir una región `aria-live="polite"` que anuncie la cantidad de resultados.

#### Scenario: Tabla semántica

- **WHEN** un lector de pantalla recorre la tabla
- **THEN** anuncia el título de la tabla y cada encabezado de columna con su ámbito

#### Scenario: Filtros operables por teclado

- **WHEN** se navega solo con teclado
- **THEN** se alcanzan y completan los campos de filtro, se envían con Enter y el foco es visible en todo momento

#### Scenario: Paginación operable por teclado

- **WHEN** se navega la paginación solo con teclado
- **THEN** anterior/siguiente son alcanzables cuando están disponibles, muestran foco visible y no son enfocables cuando están deshabilitados

#### Scenario: Sin dependencia exclusiva del color

- **WHEN** se revisa la tabla, los estados y la paginación con contraste y sin percibir color
- **THEN** la información sigue siendo comprensible (texto/aria) y el contraste cumple ≥ 4.5:1
