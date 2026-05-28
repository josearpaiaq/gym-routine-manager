import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-canvas text-text">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <div className="flex gap-4 mt-4 border-b border-border pb-0">
            <Link
              href="/admin/machines"
              className="pb-3 text-sm font-medium text-text-muted hover:text-text border-b-2 border-transparent hover:border-indigo-500 transition-colors"
            >
              Máquinas
            </Link>
            <Link
              href="/admin/users"
              className="pb-3 text-sm font-medium text-text-muted hover:text-text border-b-2 border-transparent hover:border-indigo-500 transition-colors"
            >
              Usuarios
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
