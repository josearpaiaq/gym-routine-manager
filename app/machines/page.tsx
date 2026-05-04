import Link from "next/link";
import { listMachinesPaged } from "@/lib/db";
import Navbar from "@/components/Navbar";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MachinesPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const { machines, total, totalPages } = listMachinesPaged(page, 10);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Máquinas</h1>
            <p className="text-gray-400 text-sm mt-1">{total} en la base de datos</p>
          </div>
          <Link
            href="/analyze"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            + Analizar nueva
          </Link>
        </div>

        {machines.length === 0 ? (
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-12 text-center">
            <p className="text-gray-400">No hay máquinas registradas aún.</p>
            <Link
              href="/analyze"
              className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              Analiza la primera máquina →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="rounded-2xl bg-gray-900 border border-gray-800 px-5 py-4"
              >
                <h2 className="font-semibold text-white">{machine.canonical_name}</h2>
                {machine.muscle_groups.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {machine.muscle_groups.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-indigo-900/50 border border-indigo-800 px-2.5 py-0.5 text-xs text-indigo-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/machines?page=${page - 1}`}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/machines?page=${page + 1}`}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
