import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/users";
import NavbarMenu from "@/components/NavbarMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar() {
  const session = await getSession();
  const user = session ? await getUserById(session.userId) : null;

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-canvas">
      <Link
        href={session ? "/dashboard" : "/"}
        className="font-bold text-base sm:text-lg tracking-tight shrink-0"
      >
        GymManager
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NavbarMenu
          session={session ? { username: session.username, isAdmin: session.isAdmin } : null}
          analyzerEnabled={user?.analyzerEnabled ?? false}
        />
      </div>
    </nav>
  );
}
