# Rendimiento y Accesibilidad — Quanti Vegetales Hidropónicos

> Extra no-canónico (motivado por P5: rendimiento + accesibilidad primero). Complementa RNF-01…RNF-04 con estrategia ejecutable.

## Presupuesto de performance (móvil, Moto G4 equivalente)

| Métrica | Presupuesto | Cómo se cumple |
|---|---|---|
| PageSpeed móvil | ≥ 85 (mínimo contractual) | Todo lo de abajo |
| LCP | ≤ 2.5 s | Hero con imagen prioritaria (`priority` + `fetchpriority`), sin JS bloqueante |
| CLS | ≤ 0.1 | Dimensiones reservadas en hero, carrusel y fichas; nada de inyección tardía de layout |
| JS inicial | ≤ 170 KB gzip | Framer Motion solo donde aporte; si no entra, CSS Transitions; `next/dynamic` para lo pesado (admin, carrusel) |
| Imágenes | 100% optimizadas | `next/image` (formatos modernos, `sizes` reales); productos vía Storage + transformación; logos en `.webp` fijos |

## Estrategia de imágenes y media

- Productos: upload validado (tipo, peso máx. p. ej. 2 MB) → Storage → servir con transformación (ancho limitado) + `next/image`.
- Logos clientes: `.webp` en `public/clientes/`, dimensiones conocidas, `loading="lazy"` salvo el primer visible.
- Hero Instancia 1/2: una sola imagen prioritaria, precargada; resto diferido.
- Animaciones: transform/opacity por GPU; `prefers-reduced-motion` desactiva lo no esencial (RN-CONT-03); objetivo 60 FPS en scroll y carrusel.

## Checklist WCAG 2.1 AA (verificar por página antes de cada hito)

- [ ] Contraste texto/fondo ≥ 4.5:1 (≥ 3:1 en texto grande) con la paleta del Figma.
- [ ] Navegación completa por teclado: foco visible, orden lógico, acordeón FAQ operable.
- [ ] Formularios: labels asociados, errores anunciados (`aria-describedby`/`role="alert"`), sin depender solo del color.
- [ ] Imágenes con `alt` significativo (logos: nombre del cliente); decorativas con `alt=""`.
- [ ] Estructura: un `h1` por página, jerarquía sin saltos, landmarks (`header/main/nav/footer`).
- [ ] Carrusel: controles accesibles (prev/next con nombre), pausa si hay autoplay, no secuestra el foco.
- [ ] `lang="es"`, títulos de página únicos, skip-link al contenido.

## Verificación

- Lighthouse CI en cada PR (móvil, umbrales = presupuesto) + pasada manual de teclado y lector de pantalla por hito (NVDA/VoiceOver). RNF-01…RNF-04 se auditan en Hito 4, pero los umbrales se miden desde Hito 1.
