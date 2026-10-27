/**
 * Field shadcn-style — C-03 auth-admin-shell, re-skin spec §4.2.
 *
 * Layout de formularios con `FieldGroup` + `Field` (nunca `div` crudo).
 * Validación: `data-invalid` en `Field`, `aria-invalid` en el control,
 * errores anunciados vía `FieldError` (regla shadcn forms). Error visual en
 * tokens error (`error-500` borde, `error-700` texto AA).
 */
import * as React from "react";
import { cn } from "@/lib/utils";

function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function Field({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("group/field flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "text-sm font-medium text-slate-900 group-data-invalid/field:text-error-700",
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-slate-600", className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  errors,
  children,
  ...props
}: React.ComponentProps<"p"> & { errors?: Array<{ message?: string } | undefined> }) {
  const content = children ?? errors?.map((e) => e?.message).filter(Boolean).join(" ");
  if (!content) return null;
  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn("text-sm font-medium text-error-700", className)}
      {...props}
    >
      {content}
    </p>
  );
}

export { FieldGroup, Field, FieldLabel, FieldDescription, FieldError };
