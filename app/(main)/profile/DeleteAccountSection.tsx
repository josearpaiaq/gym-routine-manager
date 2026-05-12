"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  username: string;
}

export default function DeleteAccountSection({ username }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (typed !== username) return;

    try {
      setError(null);
      setLoading(true);

      const res = await fetch("/api/profile", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Error al eliminar la cuenta");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar la cuenta";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <div>
        <p className="text-sm text-gray-400 mb-4">
          Esta acción elimina permanentemente tu cuenta y todos tus datos. No se puede deshacer.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300"
          onClick={() => setStep("confirm")}
        >
          Eliminar mi cuenta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Para confirmar, escribe tu nombre de usuario:{" "}
        <span className="text-white font-medium">{username}</span>
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-username">Nombre de usuario</Label>
        <Input
          id="confirm-username"
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={username}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          variant="destructive"
          disabled={typed !== username || loading}
          onClick={handleDelete}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Confirmar eliminación
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setStep("idle");
            setTyped("");
            setError(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
