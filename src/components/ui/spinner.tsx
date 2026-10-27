/**
 * Spinner shadcn-style — C-03 auth-admin-shell.
 * Indicador de carga para componer dentro de `Button` junto a `disabled`.
 */
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <LoaderCircle
      role="status"
      aria-label="Cargando"
      data-slot="spinner"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
