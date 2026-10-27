/**
 * Botón de cierre de sesión (cliente mínimo) — C-03 auth-admin-shell.
 * Pide confirmación en un modal antes de cerrar la sesión.
 * Tras invalidar en servidor: `replace('/admin/login')` + `refresh()` para
 * que el back-button no re-exponga contenido admin cacheado.
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { signOut } from "../actions";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-haspopup="dialog"
        className={className}
        onClick={() => setConfirmOpen(true)}
      >
        Cerrar Sesión
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Cerrar sesión?"
        description="Vas a salir del panel de administración. Para volver a entrar tendrás que iniciar sesión de nuevo."
        confirmLabel="Cerrar sesión"
        pending={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            await signOut();
            router.replace("/admin/login");
            router.refresh();
          })
        }
      />
    </>
  );
}
