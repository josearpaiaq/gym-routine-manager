"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmResult = [confirmed: boolean, data?: unknown];

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((result: ConfirmResult) => void) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<ConfirmResult> => {
      setOptions(opts);
      setOpen(true);
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [],
  );

  function handleConfirm() {
    setOpen(false);
    resolveRef.current?.([true]);
    resolveRef.current = null;
  }

  function handleCancel() {
    setOpen(false);
    resolveRef.current?.([false]);
    resolveRef.current = null;
  }

  const ConfirmModal =
    open && options ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={handleCancel}
      >
        <div
          className="mx-4 w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold text-white">{options.title}</h2>
          {options.message && (
            <p className="mt-2 text-sm text-gray-400">{options.message}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              className="cursor-pointer rounded-md"
            >
              {options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              className="cursor-pointer rounded-md"
            >
              {options.confirmLabel ?? "Confirmar"}
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  return { confirm, ConfirmModal };
}
