import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMachineById } from "@/lib/db";
import Navbar from "@/components/Navbar";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ muscles?: string }>;
}

export default async function MachineDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { muscles: musclesParam } = await searchParams;

  const machine = getMachineById(parseInt(id, 10));
  if (!machine) notFound();

  const highlightMuscles = musclesParam
    ? musclesParam.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <div className="mb-6">
          <Link href="/machines" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Máquinas
          </Link>
        </div>

        {/* Machine header */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden mb-6">
          {machine.image_path && (
            <div className="w-full h-52 relative">
              <Image
                src={machine.image_path}
                alt={machine.canonical_name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-5">
            <h1 className="text-2xl font-bold">{machine.canonical_name}</h1>
            {machine.muscle_groups.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {machine.muscle_groups.map((muscle) => (
                  <span
                    key={muscle}
                    className="rounded-full bg-indigo-900/60 border border-indigo-700 px-3 py-0.5 text-xs font-medium text-indigo-300"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold px-1">
            Ejercicios ({machine.exercises.length})
          </h2>
          {machine.exercises.length === 0 ? (
            <p className="text-sm text-gray-600 px-1">
              No hay ejercicios registrados para esta máquina.
            </p>
          ) : (
            machine.exercises.map((ex, i) => {
              const isHighlighted =
                highlightMuscles.length > 0 &&
                highlightMuscles.some((hm) => ex.target_muscles.toLowerCase().includes(hm));
              return (
                <div
                  key={ex.id}
                  className={`rounded-2xl p-5 space-y-2 border ${
                    isHighlighted
                      ? "bg-indigo-900/20 border-indigo-700"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isHighlighted ? "bg-indigo-500" : "bg-indigo-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white leading-tight">{ex.name}</h3>
                      <p className="text-xs text-indigo-300 mt-0.5">{ex.target_muscles}</p>
                    </div>
                    {isHighlighted && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full shrink-0">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <ol className="pl-10 space-y-1.5 list-none">
                    {ex.execution.map((step, j) => (
                      <li key={j} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                        <span className="shrink-0 font-medium text-indigo-400">{j + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
