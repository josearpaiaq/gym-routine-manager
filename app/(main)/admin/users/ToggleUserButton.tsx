"use client";

import { useState, useTransition } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

type Field = "isEnabled" | "analyzerEnabled" | "isAdmin";

export default function ToggleUserButton({
  userId,
  field,
  value,
  disabled: disabledProp,
}: {
  userId: number;
  field: Field;
  value: boolean;
  disabled?: boolean;
}) {
  const [current, setCurrent] = useState(value);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !current;
    setCurrent(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) setCurrent(!next);
    });
  }

  const Icon = current ? ToggleRight : ToggleLeft;

  return (
    <button
      onClick={toggle}
      disabled={pending || disabledProp}
      className={`transition-colors disabled:opacity-30 ${current ? "text-indigo-400 hover:text-indigo-300" : "text-text-muted hover:text-text-muted"}`}
      title={current ? "Desactivar" : "Activar"}
    >
      <Icon size={24} strokeWidth={1.5} />
    </button>
  );
}
