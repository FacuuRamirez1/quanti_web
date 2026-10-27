# Checklist WCAG 2.1 AA base — scaffold C-01

Verificado contra el build local (`next build && next start`, LHCI 2026-10-06).
Fuente: `knowledge-base/11_rendimiento_y_accesibilidad.md`.

## Pasa en C-01

| Ítem | Estado | Evidencia |
|------|--------|-----------|
| `lang="es"` + título único por página | ✅ | `app/layout.tsx` (`<html lang="es">`); metadata `/` y `/admin/login` |
| Skip-link al contenido | ✅ | `.skip-link` en `app/globals.css`, verificado en DOM servido |
| Un `h1` por página, jerarquía sin saltos | ✅ | `/` y `/admin/login` con exactamente 1 `<h1>` (curl + regex) |
| Landmarks `header`/`main`/`footer` | ✅ | En `app/layout.tsx`, verificados en DOM |
| Contraste texto/fondo ≥ 4.5:1 | ✅ | Placeholder `#171717` sobre `#ffffff` (~17:1); foco `#166534` sobre blanco (~7.5:1); skip-link blanco sobre `#171717` |
| Foco visible por teclado | ✅ | `:focus-visible` global + estilo de foco del skip-link |
| `alt` donde aplique | ✅ | N/A en C-01 (sin imágenes de contenido; `placeholder.svg` con `aria-label`) |
| `prefers-reduced-motion` | ✅ | Media query en `globals.css` (R8); C-01 no tiene animaciones |
| Presupuestos KB (LHCI local, Edge Chromium) | ✅ | Performance 1.0 (≥ 0.85), LCP 482 ms (≤ 2.5 s), CLS 0 (≤ 0.1), JS 102 KB (≤ 170 KB gzip) |

## Pendiente para C-04 / C-06 (no bloquea C-01)

- Labels asociados + errores anunciados (`aria-describedby`/`role="alert"`) del formulario → C-04.
- Acordeón FAQ operable por teclado, carrusel con controles accesibles y pausa → C-06.
- Contraste con la paleta final del Figma (el placeholder usa grises/verde provisorios) → C-06.
- Pasada manual con lector de pantalla (NVDA/VoiceOver) por hito → Hito 4.
- `next/image` con `sizes` reales + Storage optimizado al agregar imágenes → C-06 (R6).
