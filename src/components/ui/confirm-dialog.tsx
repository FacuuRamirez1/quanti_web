/**
 * Diálogo de confirmación sobre `<dialog>` nativo (modal).
 *
 * `showModal()` aporta foco atrapado, `inert` del resto de la página, cierre
 * con Esc y backdrop sin dependencias extra. Estado controlado por `open`;
 * Esc y click en el backdrop llaman a `onCancel`, salvo mientras `pending`.
 * Sin animaciones (R8).
 */
"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={pending || undefined}
      onCancel={(event) => {
        // Esc: el cierre lo decide el estado controlado.
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(event) => {
        // Click fuera del panel (sobre el backdrop) = cancelar.
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#e9eae6] bg-white p-0 text-left shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-xl font-semibold text-[#1d1f1b]">{title}</h2>
        <p id={descriptionId} className="mt-2 text-[15px] text-[#6b6d68]">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="bg-[#548523] shadow-none hover:bg-[#456f1c]"
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
