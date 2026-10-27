/**
 * Schemas zod COMPARTIDOS front + back — C-01 foundation-infra + C-02 leads-data-model.
 *
 * `leadSchema` es owned by C-02 como parte del contrato de datos (R2 + KB 08):
 * C-04 lo IMPORTA en formulario cliente (UX) y Server Action (autoridad) sin
 * redefinirlo; la DB re-valida (CHECK/UNIQUE) como última defensa (R1).
 */
import { z } from "zod";

/** Bloque compartido mínimo de ejemplo: un email válido. */
export const emailSchema = z
  .string()
  .email("Debe ser un email válido");

export type Email = z.infer<typeof emailSchema>;

/**
 * Contrato de validación app del lead (RN-LEAD-01/02/05 a nivel app).
 * - nombre/apellido: no vacíos ni solo espacios (RN-LEAD-01).
 * - email: formato válido + normalizado trim+lowercase (RN-LEAD-02/05).
 * - acepta_politicas: literal true = checkbox obligatorio (mandato I1).
 */
export const leadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellido: z.string().trim().min(1, "El apellido es obligatorio"),
  email: z.string().trim().toLowerCase().email("Debe ser un email válido"),
  acepta_politicas: z.literal(true, {
    error: "Debés aceptar las Políticas",
  }),
});

export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Contrato de validación del login admin (C-03 auth-admin-shell).
 * - email: normalizado trim+lowercase + formato válido.
 * - password: solo presencia mínima (la autoridad es Supabase Auth; no imponer
 *   longitud acá evita filtrar política de credenciales).
 * - El honeypot se valida SOLO en servidor, fuera de este schema.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Debe ser un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;
