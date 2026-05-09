import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/users";
import { Dumbbell, Calendar, ScanLine, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavbarClient from "@/components/NavbarClient";
import NavLink from "@/components/NavLink";

export default async function Navbar() {
  const session = await getSession();
  const user = session ? await getUserById(session.userId) : null;

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 bg-gray-950">
      <Link href="/" className="font-bold text-base sm:text-lg tracking-tight shrink-0">
        GymManager
      </Link>

      <div className="flex items-center gap-1">
        <NavLink href="/machines">
          <Dumbbell size={18} />
          <span className="hidden sm:inline">Máquinas</span>
        </NavLink>

        {user?.analyzerEnabled && (
          <NavLink href="/analyze">
            <ScanLine size={18} />
            <span className="hidden sm:inline">Analizar</span>
          </NavLink>
        )}

        {session ? (
          <>
            <NavLink href="/routines">
              <Calendar size={18} />
              <span className="hidden sm:inline">Rutinas</span>
            </NavLink>
            <NavbarClient username={session.username} />
          </>
        ) : (
          <Button asChild size="sm" className="ml-1">
            <Link href="/login" className="flex items-center gap-1.5">
              <LogIn size={16} />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
