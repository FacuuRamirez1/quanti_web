/**
 * Formulario de captura de leads (Client Component mínimo, solo UX) — C-04.
 * Re-skin glassmorphism sobre hero oscuro (spec "Landing Próximamente" §A.4):
 * labels blancos, inputs translúcidos, errores en rojo claro (contraste sobre
 * fondo oscuro), botón #689F38 → hover #558B2F (tokens de la spec; transición
 * barata + `prefers-reduced-motion` global en `globals.css`, R8).
 *
 * COMPORTAMIENTO C-04 INTACTO (los contratos prevalecen sobre la spec visual):
 * - Layout con shadcn `FieldGroup` + `Field` (`data-invalid` en el Field,
 *   `aria-invalid` en el control, errores vía `FieldError` con `role="alert"`).
 * - Validación en tiempo real con el `leadSchema` COMPARTIDO de
 *   `lib/validaciones.ts` (owned by C-02 — importado, nunca redefinido);
 *   la autoridad sigue siendo la Server Action (R2).
 * - Checkbox obligatorio `acepta_politicas` con label + enlace a `/politicas`;
 *   botón "Notificarme" `disabled` hasta aceptar + texto de ayuda visible
 *   (el `disabled` solo no se anuncia, el texto sí).
 * - Mensaje de la Action (éxito/error genérico) en `Alert` (`role="alert"`):
 *   `state?.message` gatea el Alert y `state.ok` elige `success`/`destructive`
 *   (copia exacta "¡Te avisaremos del lanzamiento!") — feedback siempre visible.
 * - Honeypot `website`: invisible para usuarios y AT (`aria-hidden`, fuera
 *   de tab con `tabIndex={-1}`, `autoComplete="off"`, off-screen SIN
 *   `display:none`); fuera del schema (solo lo lee la Server Action).
 * - Cero queries Supabase desde el cliente (R1): solo invoca la Action
 *   `registrarLead` de `app/actions/leads.ts` vía `useActionState`.
 */
"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { leadSchema } from "@/lib/validaciones";
import { registrarLead } from "@/app/actions/leads";

const CHECKBOX_HELP_ID = "ayuda-acepta-politicas";

/** Inputs sobre glass oscuro: fondo translúcido, texto blanco, foco blanco. */
const GLASS_INPUT_CLASS =
  "border-white/40 bg-white/15 text-white placeholder:text-white/60 focus-visible:border-white focus-visible:outline-white";

export function LeadForm() {
  const [state, formAction, isPending] = useActionState(registrarLead, null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validación espejo en vivo (UX); la Action re-valida todo en servidor.
  const live = leadSchema.safeParse({
    nombre,
    apellido,
    email,
    acepta_politicas: acepta,
  });
  const liveFieldErrors = live.success
    ? {}
    : (live.error.flatten().fieldErrors as Record<string, string[] | undefined>);

  const serverErrors = state?.fieldErrors ?? {};
  const show = (name: string): string[] | undefined => {
    const server = (serverErrors as Record<string, string[] | undefined>)[name];
    if (server?.length) return server;
    if (touched[name]) return liveFieldErrors[name] ?? undefined;
    return undefined;
  };

  const nombreErrors = show("nombre");
  const apellidoErrors = show("apellido");
  const emailErrors = show("email");
  const aceptaErrors = show("acepta_politicas");

  const markTouched = (name: string) =>
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));

  return (
    <form
      action={formAction}
      aria-label="Aviso de lanzamiento"
      onSubmit={() =>
        setTouched({ nombre: true, apellido: true, email: true, acepta_politicas: true })
      }
    >
      <FieldGroup>
        {state?.message ? (
          <Alert variant={state.ok ? "success" : "destructive"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!nombreErrors?.length || undefined}>
            <FieldLabel htmlFor="lead-nombre" className="text-white">
              Nombre
            </FieldLabel>
            <Input
              id="lead-nombre"
              name="nombre"
              type="text"
              autoComplete="given-name"
              required
              maxLength={120}
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => markTouched("nombre")}
              aria-invalid={!!nombreErrors?.length}
              aria-describedby={nombreErrors?.length ? "error-lead-nombre" : undefined}
              className={GLASS_INPUT_CLASS}
            />
            <FieldError
              id="error-lead-nombre"
              errors={nombreErrors?.map((message) => ({ message }))}
              className="text-red-100"
            />
          </Field>

          <Field data-invalid={!!apellidoErrors?.length || undefined}>
            <FieldLabel htmlFor="lead-apellido" className="text-white">
              Apellido
            </FieldLabel>
            <Input
              id="lead-apellido"
              name="apellido"
              type="text"
              autoComplete="family-name"
              required
              maxLength={120}
              placeholder="Tu apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              onBlur={() => markTouched("apellido")}
              aria-invalid={!!apellidoErrors?.length}
              aria-describedby={
                apellidoErrors?.length ? "error-lead-apellido" : undefined
              }
              className={GLASS_INPUT_CLASS}
            />
            <FieldError
              id="error-lead-apellido"
              errors={apellidoErrors?.map((message) => ({ message }))}
              className="text-red-100"
            />
          </Field>
        </div>

        <Field data-invalid={!!emailErrors?.length || undefined}>
          <FieldLabel htmlFor="lead-email" className="text-white">
            Correo electrónico
          </FieldLabel>
          <Input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            aria-invalid={!!emailErrors?.length}
            aria-describedby={emailErrors?.length ? "error-lead-email" : undefined}
            className={GLASS_INPUT_CLASS}
          />
          <FieldError
            id="error-lead-email"
            errors={emailErrors?.map((message) => ({ message }))}
            className="text-red-100"
          />
        </Field>

        <Field data-invalid={!!aceptaErrors?.length || undefined}>
          <div className="flex items-start gap-2">
            <input
              id="lead-acepta"
              name="acepta_politicas"
              type="checkbox"
              checked={acepta}
              onChange={(e) => {
                setAcepta(e.target.checked);
                markTouched("acepta_politicas");
              }}
              aria-invalid={!!aceptaErrors?.length}
              aria-describedby={
                [aceptaErrors?.length ? "error-lead-acepta" : null, CHECKBOX_HELP_ID]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className="mt-1 h-4 w-4 shrink-0 accent-[#689F38]"
            />
            <FieldLabel htmlFor="lead-acepta" className="font-normal text-white">
              Acepto la{" "}
              <Link
                href="/politicas"
                className="font-medium text-white underline decoration-white/60 underline-offset-2 transition-opacity duration-200 hover:opacity-80"
              >
                Política de Privacidad
              </Link>
            </FieldLabel>
          </div>
          <FieldDescription id={CHECKBOX_HELP_ID} className="text-white/70">
            {acepta
              ? "Gracias por aceptar las políticas."
              : "Aceptá las políticas para continuar."}
          </FieldDescription>
          <FieldError
            id="error-lead-acepta"
            errors={aceptaErrors?.map((message) => ({ message }))}
            className="text-red-100"
          />
        </Field>

        {/* Señuelo, solo la Server Action lo lee. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute top-auto left-[-9999px] h-px w-px overflow-hidden"
        />

        <Button
          type="submit"
          disabled={!acepta || isPending}
          className="w-full bg-[#689F38] shadow-lg shadow-black/20 hover:bg-[#456f20]"
        >
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          Notificarme
        </Button>
      </FieldGroup>
    </form>
  );
}
