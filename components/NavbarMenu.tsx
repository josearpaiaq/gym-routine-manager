"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Dumbbell,
  Calendar,
  ScanLine,
  LogIn,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";
import NavLink from "@/components/NavLink";
import NavbarClient from "@/components/NavbarClient";

interface NavbarMenuProps {
  session: { username: string; isAdmin: boolean } | null;
  analyzerEnabled: boolean;
}

export default function NavbarMenu({ session, analyzerEnabled }: NavbarMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logoutAction();
  }

  return (
    <>
      {/* Desktop nav — visible sm+ */}
      <div className="hidden sm:flex items-center gap-1">
        <NavLink href="/machines">
          <Dumbbell size={18} />
          <span>Máquinas</span>
        </NavLink>

        {analyzerEnabled && (
          <NavLink href="/analyze">
            <ScanLine size={18} />
            <span>Analizar</span>
          </NavLink>
        )}

        {session ? (
          <>
            <NavLink href="/dashboard">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink href="/routines">
              <Calendar size={18} />
              <span>Rutinas</span>
            </NavLink>
            {session.isAdmin && (
              <NavLink href="/admin">
                <ShieldCheck size={18} />
                <span>Admin</span>
              </NavLink>
            )}
            <NavbarClient username={session.username} />
          </>
        ) : (
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm" }), "ml-1 flex items-center gap-1.5")}
          >
            <LogIn size={16} />
            <span>Entrar</span>
          </Link>
        )}
      </div>

      {/* Mobile hamburger — visible <sm */}
      <div ref={menuRef} className="sm:hidden relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-text-muted hover:text-text transition-colors"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-overlay shadow-2xl z-50 py-2 overflow-hidden">
            <MobileLink href="/machines" icon={<Dumbbell size={16} />} onClick={() => setOpen(false)}>
              Máquinas
            </MobileLink>

            {analyzerEnabled && (
              <MobileLink href="/analyze" icon={<ScanLine size={16} />} onClick={() => setOpen(false)}>
                Analizar
              </MobileLink>
            )}

            {session ? (
              <>
                <MobileLink href="/dashboard" icon={<LayoutDashboard size={16} />} onClick={() => setOpen(false)}>
                  Dashboard
                </MobileLink>
                <MobileLink href="/routines" icon={<Calendar size={16} />} onClick={() => setOpen(false)}>
                  Rutinas
                </MobileLink>
                {session.isAdmin && (
                  <MobileLink href="/admin" icon={<ShieldCheck size={16} />} onClick={() => setOpen(false)}>
                    Admin
                  </MobileLink>
                )}
                <div className="my-1 border-t border-border" />
                <MobileLink href="/profile" icon={<UserRound size={16} />} onClick={() => setOpen(false)}>
                  Perfil — {session.username}
                </MobileLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-card-hover hover:text-text transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <MobileLink href="/login" icon={<LogIn size={16} />} onClick={() => setOpen(false)}>
                Entrar
              </MobileLink>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MobileLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        isActive
          ? "text-text bg-card-hover"
          : "text-text-muted hover:bg-card-hover hover:text-text"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
