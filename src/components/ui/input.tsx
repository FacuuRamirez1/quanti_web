/**
 * Input shadcn-style — C-03 auth-admin-shell, re-skin spec §3.2/§4.2.
 * `rounded-xl border-slate-200` + anillo `brand-500`; invalidez con
 * `aria-invalid` en el control y `data-invalid` en el `Field` padre.
 * Errores: borde/anillo `error-500`; texto de error en `error-700`
 * (derivado AA — `error-500` puro no llega a 4.5:1 sobre blanco).
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      data-slot="input"
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-xs transition-colors outline-none placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600 aria-invalid:border-error-500 aria-invalid:focus-visible:outline-error-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
