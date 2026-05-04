import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import Navbar from "@/components/Navbar";
import AnalyzeForm from "./AnalyzeForm";

export default async function AnalyzePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/analyze");

  const user = getUserById(session.userId);

  if (!user || user.analyzer_enabled !== 1) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-10">
            <span className="text-5xl">🔒</span>
            <h1 className="mt-4 text-2xl font-bold">Función no disponible</h1>
            <p className="mt-3 text-gray-400 text-sm">
              El análisis de máquinas con IA está disponible próximamente para tu cuenta.
            </p>
            <p className="mt-1 text-gray-500 text-xs">Próximamente</p>
          </div>
        </div>
      </main>
    );
  }

  return <AnalyzeForm />;
}
