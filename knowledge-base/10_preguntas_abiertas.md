# Preguntas Abiertas — Quanti Vegetales Hidropónicos

## Inconsistencias detectadas

### IN-01 — Admin: "En Evaluación" vs exigible desde Instancia 1
**DRF dice**: RF-09 "En Evaluación", Hito 3 "si se aprueba". **Discovery dice**: va en ambas instancias (ver/filtrar en I1, CRUD en I2). **Impacto**: cambia el peso de Hito 1 (Auth + RLS adelantados). **Resolución propuesta**: vale Discovery (decisión del responsable); re-estimar Hito 1.

### IN-02 — Export de leads: dashboard vs sin exportación
**DRF dice**: el cliente podrá "consultar, filtrar y exportar". **Discovery dice**: ver + filtrar, sin exportación a archivos. **Impacto**: alcance del /admin. **Resolución propuesta**: vale Discovery; si se necesita export, será change nuevo.

### IN-03 — Footer: WhatsApp + email vs solo redes
**DRF dice**: WhatsApp, redes, email institucional y cobertura. **Discovery dice**: Instagram, Facebook (sin WhatsApp); email como casilla destino del formulario. **Impacto**: contenido del footer. **Resolución propuesta**: footer con Instagram/Facebook/email + link admin; "cobertura" no existe como tal.

### IN-04 — Formulario Instancia 1: solo email vs 3 campos
**DRF dice**: campo de email. **Discovery dice**: nombre + apellido + email. **Impacto**: tabla `posibles_clientes` y validaciones. **Resolución propuesta**: vale Discovery (3 campos obligatorios).

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta | Bloquea | Decisor |
|---|---|---|---|
| Alta | Acceso al DNS/registrador de `quantihidroponia.com.ar` (NIC.ar) | Hito 1 (deploy + Resend) | Responsable |
| Alta | Casilla destino del formulario (¿`contacto@quantihidroponia.com.ar`? ¿alias o hosting?) | RF-07 / Hito 3 | Responsable |
| Alta | Remitente verificado en Resend (registros DNS) | RF-07 / Hito 3 | Responsable + dev |
| Media | ¿Filtrar leads requiere algo más que fecha/email/nombre? | US-007 / Hito 1-2 | Responsable |
| Media | Fuente de roles: ¿`user_metadata` o tabla `perfiles`? | Hito 1 (arquitectura auth) | Dev |
| Media | Framer Motion vs CSS Transitions (presupuesto JS en móvil) | Hito 2 (animaciones) | Dev |
| Baja | Plan de Vercel/Supabase/Resend: ¿free alcanza o se paga desde el día 1? | Costos operativos | Responsable |
| Baja | Textos FAQ + fotos finales: confirmar entrega antes de Hito 2 | Hito 2 | Responsable |
