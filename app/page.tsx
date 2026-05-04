import Link from "next/link";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Tu gym,<br />
          <span className="text-indigo-400">organizado.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
          Analiza máquinas con IA, crea rutinas personalizadas por grupo muscular y descubre qué máquinas usar cada día.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/analyze"
            className="rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold hover:bg-indigo-500 transition-colors"
          >
            Analizar máquina
          </Link>
          {session ? (
            <Link
              href="/routines"
              className="rounded-xl bg-gray-800 px-6 py-3.5 font-semibold hover:bg-gray-700 transition-colors"
            >
              Ver mis rutinas
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-xl bg-gray-800 px-6 py-3.5 font-semibold hover:bg-gray-700 transition-colors"
            >
              Crear cuenta gratis
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-24 grid sm:grid-cols-3 gap-6">
        <FeatureCard
          icon="🤖"
          title="Análisis con IA"
          description="Sube una foto de cualquier máquina y obtén ejercicios recomendados al instante."
          href="/analyze"
        />
        <FeatureCard
          icon="🏋️"
          title="Catálogo de máquinas"
          description="Explora todas las máquinas disponibles con sus grupos musculares."
          href="/machines"
        />
        <FeatureCard
          icon="📅"
          title="Rutinas inteligentes"
          description="Crea rutinas por día y músculo, y ve automáticamente qué máquinas usar."
          href={session ? "/routines" : "/signup"}
        />
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-gray-900 border border-gray-800 p-6 hover:border-indigo-700 transition-colors"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-3 font-semibold text-white group-hover:text-indigo-300 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </Link>
  );
}
