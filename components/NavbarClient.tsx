"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UserRound, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";

interface NavbarClientProps {
  username: string;
}

export default function NavbarClient({ username }: NavbarClientProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logoutAction();
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 text-text-muted hover:text-text"
      >
        <UserRound size={18} />
        <span className="hidden sm:inline max-w-24 truncate">{username}</span>
        <ChevronDown size={14} className="hidden sm:inline" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-overlay shadow-xl z-50 py-1">
          <div className="px-3 py-2 text-xs text-text-muted border-b border-border truncate">
            {username}
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-card-hover hover:text-text transition-colors"
          >
            <UserRound size={14} />
            Perfil
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-card-hover hover:text-text transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
