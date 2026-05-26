"use client";

import { useState, useTransition } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

export default function ToggleMachineButton({
  machineId,
  isActive,
}: {
  machineId: number;
  isActive: boolean;
}) {
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) setActive(!next);
    });
  }

  const Icon = active ? ToggleRight : ToggleLeft;

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`transition-colors disabled:opacity-50 ${active ? "text-indigo-400 hover:text-indigo-300" : "text-gray-600 hover:text-gray-400"}`}
      title={active ? "Desactivar" : "Activar"}
    >
      <Icon size={28} strokeWidth={1.5} />
    </button>
  );
}
