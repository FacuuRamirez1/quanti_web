/**
 * Alert shadcn-style — C-03 auth-admin-shell, re-skin spec §4.2.
 * `role="alert"` por defecto; variante `success` (tokens success) para la
 * confirmación "¡Te avisaremos del lanzamiento!" y `destructive` (tokens
 * error) para fallos. Texto en tintas 700 (AA sobre fondos 50).
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-white text-slate-900",
        success:
          "border-success-500/40 bg-success-50 text-success-700 [&>svg]:text-success-500",
        destructive:
          "border-error-500/40 bg-error-50 text-error-700 [&>svg]:text-error-500",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  role = "alert",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"h5">) {
  return (
    <h5
      data-slot="alert-title"
      className={cn("mb-1 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
