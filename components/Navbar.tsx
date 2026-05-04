import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Dumbbell, Calendar, ScanLine, LogIn, LogOut, UserRound } from "lucide-react";

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 bg-gray-950">
      <Link href="/" className="font-bold text-base sm:text-lg tracking-tight shrink-0">
        GymManager
      </Link>

      <div className="flex items-center gap-1">
        <NavLink href="/machines" icon={<Dumbbell size={18} />} label="Máquinas" />
        <NavLink href="/analyze" icon={<ScanLine size={18} />} label="Analizar" />

        {session ? (
          <>
            <NavLink href="/routines" icon={<Calendar size={18} />} label="Rutinas" />
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500">
              <UserRound size={14} />
              <span className="max-w-24 truncate">{session.username}</span>
            </span>
            <LogoutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500 transition-colors ml-1"
          >
            <LogIn size={16} />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { clearSessionCookie } = await import("@/lib/auth");
        const { redirect } = await import("next/navigation");
        await clearSessionCookie();
        redirect("/");
      }}
    >
      <button
        type="submit"
        title="Cerrar sesión"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
      >
        <LogOut size={18} />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </form>
  );
}
