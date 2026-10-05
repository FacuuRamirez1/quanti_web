# Decisiones y Supuestos — Quanti Vegetales Hidropónicos

## Decisiones documentadas

### DD-01 — Un producto, dos releases (enfoque a)
**Decisión**: Instancia 2 evoluciona Instancia 1 en el mismo codebase y deploy. **Contexto**: dos formas de encarar las instancias. **Alternativas**: (b) landing descartable + sistema aparte. **Justificación**: el /admin ya es exigible en Instancia 1, así que (b) no ahorra nada y duplica auth/admin. **Trade-off**: Hito 1 diseña modelo + admin completos desde el día uno.

### DD-02 — Admin con Auth + RLS desde Instancia 1
**Decisión**: RF-09 deja de ser "En Evaluación" y se adelanta (ver/filtrar leads en I1, CRUD en I2). **Contexto**: el responsable lo exigió en Discovery. **Justificación**: sin esto no hay consulta de leads en 6 semanas. **Trade-off**: Hito 1 más pesado que lo estimado en el DRF.

### DD-03 — Leads en Postgres, sin exportación a archivos
**Decisión**: los leads viven en `posibles_clientes` y se gestionan en /admin; nada de CSV/Excel. **Contexto**: el DRF pedía consultar/filtrar/exportar; el responsable recortó a ver + filtrar. **Justificación**: menos código, una sola fuente de verdad. **Trade-off**: si algún día piden análisis externo, habrá que agregar export.

### DD-04 — Contacto sin WhatsApp
**Decisión**: canales = formulario único (Resend) + Instagram/Facebook. **Contexto**: el DRF incluía WhatsApp en el footer. **Justificación**: decisión explícita del responsable. **Trade-off**: se pierde el canal más inmediato para el público general.

### DD-05 — Formulario único para todos
**Decisión**: B2C, B2B y general usan el mismo formulario (confirmado 3 veces). **Justificación**: simplicidad del MVP. **Trade-off/riesgo**: leads mayoristas mezclados con consultas generales — vigilar post-lanzamiento; el formulario diferenciado queda en backlog.

### DD-06 — Logos fijos, fuera de la DB
**Decisión**: imágenes de logos en `public/clientes/` + lista fija en código; misma lista en carrusel Home y puntos de venta en About Us. **Justificación**: contenido estable que no justifica CRUD. **Trade-off**: agregar/quitar un cliente requiere deploy (aceptado).

### DD-07 — Rendimiento + accesibilidad primero (P5 = b)
**Decisión**: los RNF (PageSpeed ≥ 85, WCAG 2.1 AA, 60 FPS) mandan sobre la velocidad de entrega. **Justificación**: prioridad explícita del responsable. **Trade-off**: Hito 3 puede necesitar una pasada de optimización dedicada; documentada en `11_rendimiento_y_accesibilidad.md`.

### DD-08 — Sin API REST propia
**Decisión**: mutaciones solo por Server Actions; integraciones vía SDKs de terceros. **Justificación**: menos superficie que mantener para el alcance actual. **Trade-off**: si aparece una app móvil o terceros, habrá que abrir API.

## Supuestos inferidos

### SU-01 — Link admin discreto en footer
**Supuesto**: texto pequeño, sin protagonismo. **Origen**: pedido del responsable ("se debe ver en el footer"). **Riesgo si es falso**: el cliente quería un acceso prominente. **Cómo validar**: mostrar mock en Hito 1.

### SU-02 — Filtro de leads = fecha/email/nombre, búsqueda en servidor
**Supuesto**: sin búsqueda avanzada ni paginación compleja. **Origen**: Discovery (pregunta abierta pendiente). **Riesgo si es falso**: retrabajo del /admin en Hito 2. **Cómo validar**: confirmar antes de codificar US-007.

### SU-03 — Roles por metadata o `perfiles` (una sola fuente)
**Supuesto**: alcanza con dos roles sin jerarquías. **Origen**: RBAC simple del DRF. **Riesgo si es falso**: re-modelar auth. **Cómo validar**: decisión técnica Hito 1, documentarla acá.

### SU-04 — Aprobación progresiva sin fricción
**Supuesto**: el esquema "aprueba el desarrollador por tarea" + conformidad liviana del cliente por hito evita bloqueos. **Origen**: respuesta del responsable. **Riesgo si es falso**: el cronograma de 6 semanas se corre. **Cómo validar**: dejar el esquema por escrito al arrancar Hito 1.
