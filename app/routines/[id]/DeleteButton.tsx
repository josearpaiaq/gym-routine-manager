"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";

export default function DeleteButton({ routineId }: { routineId: number }) {
  const router = useRouter();
  const { confirm, ConfirmModal } = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const [confirmed] = await confirm({
      title: "¿Eliminar rutina?",
      message: "Esta acción no se puede deshacer. Se eliminará la rutina y todos sus días.",
      confirmLabel: "Sí, eliminar",
    });
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      router.push("/routines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la rutina");
      setLoading(false);
    }
  }

  return (
    <>
      {ConfirmModal}
      <div className="flex flex-col items-end gap-1">
        <Button
          variant="destructive"
          size="default"
          className="rounded-md cursor-pointer"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Eliminando…" : "Eliminar"}
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </>
  );
}
