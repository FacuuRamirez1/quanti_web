/**
 * Formulario de login admin (Client Component mínimo, solo UX) — C-03.
 *
 * - Layout con shadcn `FieldGroup` + `Field` (`data-invalid` en el Field,
 *   `aria-invalid` en el control, errores vía `FieldError`).
 * - Error genérico en `Alert` (`role="alert"` heredado del componente).
 * - Botón con `Spinner` + `disabled` en pending (sin `isPending`).
 * - Honeypot `website`: invisible para usuarios y AT (`aria-hidden`, fuera
 *   de tab con `tabIndex={-1}`, `autoComplete="off"`, off-screen SIN
 *   `display:none`); fuera del schema de credenciales (solo lo lee la
 *   Server Action).
 */
"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signInWithPassword } from "./actions";

// Inputs claros sobre la tarjeta glass del diseño Figma del login.
const LOGIN_INPUT_CLASS =
  "h-8 rounded-lg border-0 bg-[#dcdcdc] px-2.5 text-sm text-slate-900 shadow-none placeholder:text-slate-500 focus-visible:outline-white";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(
    signInWithPassword,
    null,
  );

  const emailErrors = state?.fieldErrors?.email;
  const passwordErrors = state?.fieldErrors?.password;
  const emailInvalid = !!emailErrors?.length;
  const passwordInvalid = !!passwordErrors?.length;

  return (
    <form action={formAction} noValidate={false} aria-label="Iniciar sesión">
      <FieldGroup className="gap-2">
        <Field data-invalid={emailInvalid || undefined}>
          <FieldLabel htmlFor="email" className="sr-only">
            Correo electrónico
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Correo electrónico"
            className={LOGIN_INPUT_CLASS}
            required
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? "error-email" : undefined}
          />
          <FieldError
            id="error-email"
            className="text-red-100"
            errors={emailErrors?.map((message) => ({ message }))}
          />
        </Field>

        <Field data-invalid={passwordInvalid || undefined}>
          <FieldLabel htmlFor="password" className="sr-only">
            Contraseña
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            className={LOGIN_INPUT_CLASS}
            required
            aria-invalid={passwordInvalid}
            aria-describedby={passwordInvalid ? "error-password" : undefined}
          />
          <FieldError
            id="error-password"
            className="text-red-100"
            errors={passwordErrors?.map((message) => ({ message }))}
          />
        </Field>

        {/* Señuelo anti-bots: solo la Server Action lo lee. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute top-auto left-[-9999px] h-px w-px overflow-hidden"
        />

        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <input type="hidden" name="next" value={next} />

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 h-8 self-center rounded-lg bg-[#689F38] px-5 text-sm font-medium shadow-none hover:bg-[#456f20]"
        >
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          Ingresar
        </Button>
      </FieldGroup>
    </form>
  );
}
