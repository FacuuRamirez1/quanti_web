/**
 * Versión de políticas de privacidad — C-04 landing-captura-politicas.
 *
 * Single source del `politicas_version` auditable:
 * - `src/app/actions/leads.ts` la persiste en cada INSERT.
 * - `src/app/politicas/page.tsx` la muestra (byte-idéntica).
 * - El texto legal vive en `legal/politica-de-privacidad-v1.0.md`
 *   (v1.0 aprobada por el usuario, vigencia 2026-10-15).
 *
 * Cambios futuros del texto = bump de constante + contenido
 * (migración de contenido, fuera de este change).
 */
export const POLITICAS_VERSION = "v1.0";

/** Fecha de vigencia visible de la v1.0 (aprobada por el usuario). */
export const POLITICAS_EFFECTIVE_DATE = "15 de octubre de 2026";
