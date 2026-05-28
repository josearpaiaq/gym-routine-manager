import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/users";
import { Card, CardContent } from "@/components/ui/card";
import AnalyzeForm from "./AnalyzeForm";

export default async function AnalyzePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/analyze");

  const user = await getUserById(session.userId);

  if (!user || !user.analyzerEnabled) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Card>
          <CardContent className="pt-10 pb-10 space-y-3">
            <div className="flex justify-center mb-1">
              <Lock size={40} className="text-text-muted" />
            </div>
            <h1 className="text-2xl font-bold">Función no disponible</h1>
            <p className="text-text-muted text-sm">
              El análisis de máquinas con IA está disponible próximamente para tu cuenta.
            </p>
            <p className="text-text-muted text-xs">Próximamente</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AnalyzeForm />;
}
