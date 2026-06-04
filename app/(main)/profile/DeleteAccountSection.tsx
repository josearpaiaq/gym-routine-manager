"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "idle" | "verify";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  async function requestOtp() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/profile/delete-otp", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al enviar el código");
      }
      setStep("verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar el código";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(i: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    if (value && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleDelete() {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar la cuenta");
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar la cuenta";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResent(false);
      setError(null);
      setLoading(true);
      await fetch("/api/profile/delete-otp", { method: "POST" });
      setResent(true);
    } catch {
      setError("Error al reenviar el código");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("idle");
    setDigits(["", "", "", "", "", ""]);
    setError(null);
    setResent(false);
  }

  if (step === "idle") {
    return (
      <div>
        <p className="text-sm text-text-muted mb-4">
          Esta acción elimina permanentemente tu cuenta y todos tus datos. No se puede deshacer.
        </p>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300"
          onClick={requestOtp}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Eliminar mi cuenta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Enviamos un código a tu correo. Ingrésalo para confirmar la eliminación de tu cuenta.
      </p>

      <div className="flex gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-10 h-12 rounded-lg bg-card border border-border text-center text-lg font-bold text-text focus:outline-none focus:border-red-500 transition-colors"
          />
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          variant="destructive"
          disabled={digits.join("").length !== 6 || loading}
          onClick={handleDelete}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Confirmar eliminación
        </Button>
        <Button variant="ghost" onClick={reset}>
          Cancelar
        </Button>
      </div>

      <div className="text-sm text-text-muted">
        {resent ? (
          <span className="text-green-400">Código reenviado</span>
        ) : (
          <>
            ¿No recibiste el código?{" "}
            <Button variant="link" onClick={handleResend} disabled={loading} className="text-sm p-0">
              Reenviar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
