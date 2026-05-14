"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ActivateButton({ routineId }: { routineId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleActivate(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/routines/${routineId}/activate`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleActivate}
      disabled={loading}
      className="shrink-0 text-xs border-gray-700 hover:border-indigo-500 hover:text-indigo-300"
    >
      {loading ? "..." : "Activar"}
    </Button>
  );
}
