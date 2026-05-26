import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/users";
import NavbarMenu from "@/components/NavbarMenu";

export default async function Navbar() {
  const session = await getSession();
  const user = session ? await getUserById(session.userId) : null;

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 bg-gray-950">
      <Link
        href={session ? "/dashboard" : "/"}
        className="font-bold text-base sm:text-lg tracking-tight shrink-0"
      >
        GymManager
      </Link>

      <NavbarMenu
        session={session ? { username: session.username, isAdmin: session.isAdmin } : null}
        analyzerEnabled={user?.analyzerEnabled ?? false}
      />
    </nav>
  );
}
