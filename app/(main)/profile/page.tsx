import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/users";
import { Card } from "@/components/ui/card";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountSection from "./DeleteAccountSection";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/profile");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  const memberSince = new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(user.createdAt);

  return (
    <main className="min-h-screen bg-canvas text-text">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mi perfil</h1>
          <p className="text-text-muted text-sm mt-1">Miembro desde {memberSince}</p>
        </div>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold text-lg">Información de cuenta</h2>
          <div className="space-y-1">
            <p className="text-sm text-text-muted">Usuario</p>
            <p className="text-text">{user.username}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-text-muted">Correo electrónico</p>
            <p className="text-text">{user.email}</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </Card>

        <Card className="p-6 space-y-4 border-red-900/30">
          <div>
            <h2 className="font-semibold text-lg text-red-400">Zona de peligro</h2>
            <p className="text-xs text-text-muted mt-0.5">Acciones irreversibles</p>
          </div>
          <DeleteAccountSection username={user.username} />
        </Card>
      </div>
    </main>
  );
}
