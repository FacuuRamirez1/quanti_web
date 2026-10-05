# Quanti Vegetales Hidropónicos — Base de Conocimiento

Base de conocimiento del ecosistema web institucional de Quanti (sitio + /admin), construida desde el DRF v1.0, el Discovery con Q&A (2 rondas + ajustes) y decisiones de arquitectura validadas. Un producto, dos releases (Instancia 1 → Instancia 2).

## Índice de Archivos

| Archivo | Contenido |
|---------|-----------|
| [01_vision_y_objetivos.md](01_vision_y_objetivos.md) | Propósito, objetivos por actor, alcance I1/I2, fuera de alcance, métricas |
| [02_descripcion_general.md](02_descripcion_general.md) | Stack, arquitectura monolítica, integraciones, sin API propia |
| [03_actores_y_roles.md](03_actores_y_roles.md) | 4 actores, RBAC, rutas públicas y protegidas, link admin en footer |
| [04_modelo_de_datos.md](04_modelo_de_datos.md) | `posibles_clientes`, `categorias`, `productos`, `perfiles`, RLS, contenido estático |
| [05_reglas_de_negocio.md](05_reglas_de_negocio.md) | Reglas RN-LEAD/RN-CAT/RN-FORM/RN-AU/RN-CONT + globales |
| [06_funcionalidades.md](06_funcionalidades.md) | 6 épicas, US-001…US-011 con criterios de aceptación |
| [07_flujos_principales.md](07_flujos_principales.md) | Lead, contacto, login, ver/filtrar leads, CRUD producto, catálogo |
| [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md) | Patrones, carpetas, seguridad, env vars, deploy |
| [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md) | DD-01…DD-08 + SU-01…SU-04 |
| [10_preguntas_abiertas.md](10_preguntas_abiertas.md) | 4 inconsistencias DRF↔Discovery + 9 preguntas priorizadas |
| [11_rendimiento_y_accesibilidad.md](11_rendimiento_y_accesibilidad.md) | Presupuesto PageSpeed, imágenes, checklist WCAG 2.1 AA |

## Quick Start para Desarrolladores

1. Entender el dominio → [01](01_vision_y_objetivos.md), [03](03_actores_y_roles.md)
2. Entender los datos → [04](04_modelo_de_datos.md)
3. Entender las reglas → [05](05_reglas_de_negocio.md)
4. Entender la arquitectura → [02](02_descripcion_general.md), [08](08_arquitectura_propuesta.md)
5. Implementar → [07](07_flujos_principales.md), [06](06_funcionalidades.md)
6. Rendimiento/accesibilidad → [11](11_rendimiento_y_accesibilidad.md)
7. Antes de codificar → [10](10_preguntas_abiertas.md)

## Resumen Ejecutivo

Sitio institucional + /admin en un único Next.js con Supabase: primero landing con captura de leads, después catálogo gestionable sin precios visibles. Los leads viven en Postgres y se consultan en el panel; el contacto es por formulario o redes; el listón de calidad es PageSpeed ≥ 85 y WCAG 2.1 AA.
