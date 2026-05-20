import Link from "next/link";
import { Bot, CalendarDays, ChevronRight, Dumbbell, Flame } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.15),transparent)]" />
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-800 bg-indigo-950/50 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-6">
          IA integrada · Sin costo
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
          Organiza tu gym,
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            entrena con inteligencia.
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Sube una foto de cualquier máquina y la IA te dice qué ejercicios hacer. Crea rutinas
          por músculo, registra tus entrenos y mantén tu racha activa.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {session ? (
            <>
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/dashboard">Ver mi dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-base px-8">
                <Link href="/routines">Mis rutinas</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/signup">Empieza gratis</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-base px-8">
                <Link href="/machines">Ver máquinas</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-500 mb-10">
          Cómo funciona
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          <Step
            number="01"
            title="Fotografía la máquina"
            description="Abre la cámara, sube la foto y la IA identifica la máquina y te entrega una lista de ejercicios con instrucciones paso a paso."
          />
          <Step
            number="02"
            title="Construye tus rutinas"
            description="Crea una rutina semanal asignando días a grupos musculares. El sistema sugiere automáticamente las máquinas correctas para cada día."
          />
          <Step
            number="03"
            title="Registra y mantén tu racha"
            description="Marca cada entrenamiento al terminar, observa tu racha de días activos y consulta tu progreso en el dashboard."
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-500 mb-10">
          Características
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Bot size={28} className="text-indigo-400" />}
            title="Análisis con IA"
            description="Identifica cualquier máquina al instante y obtén ejercicios recomendados con la técnica correcta."
          />
          <FeatureCard
            icon={<Dumbbell size={28} className="text-indigo-400" />}
            title="Catálogo personal"
            description="Todas las máquinas que has analizado quedan guardadas con sus ejercicios listos para usar."
          />
          <FeatureCard
            icon={<Flame size={28} className="text-indigo-400" />}
            title="Racha y progreso"
            description="Visualiza cuántos días llevas entrenando, tu racha activa y las semanas que has sido constante."
          />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-indigo-800/50 bg-indigo-950/30 px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Empieza hoy — es completamente gratis
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Sin tarjeta de crédito. Sin límite de rutinas. Analiza máquinas y organiza tus
            entrenamientos desde el primer día.
          </p>
          {session ? (
            <Button asChild size="lg" className="px-10">
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="px-10">
              <Link href="/signup">Crear cuenta gratis</Link>
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-4xl font-black text-indigo-900">{number}</span>
      <h3 className="font-semibold text-white text-lg">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-3">
      <div>{icon}</div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
