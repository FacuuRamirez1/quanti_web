/**
 * Copias pineadas del flujo de captura — C-04 landing-captura-politicas.
 *
 * Módulo PURO (sin `server-only`): lo usan la Server Action
 * (`app/actions/leads.ts`) y cualquier verificador/temporal de tests.
 * La identidad honeypot === éxito válido es intencional (locked decision 4).
 */

/** Éxito aparente: envío válido Y honeypot responden esta MISMA copia. */
export const LEAD_SUCCESS_MESSAGE = "¡Te avisaremos del lanzamiento!";

/** Aviso amable ante duplicado (RN-LEAD-05): no crea ni modifica. */
export const LEAD_DUPLICATE_MESSAGE =
  "Ya estás en la lista. ¡Te avisaremos del lanzamiento!";

/** Genérico ante exceso o falla infra: sin fugar si fue spam o caída. */
export const LEAD_GENERIC_ERROR =
  "No pudimos registrarte ahora. Probá de nuevo en unos minutos.";
