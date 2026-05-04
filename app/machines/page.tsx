import Image from "next/image";
import Link from "next/link";
import { listMachinesPaged } from "@/lib/db";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          <Button asChild>
            <Link href="/analyze">+ Analizar nueva</Link>
          </Button>
        </div>

        {machines.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-400">No hay máquinas registradas aún.</p>
            <Button asChild variant="link" className="mt-4 text-sm">
              <Link href="/analyze">Analiza la primera máquina →</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {machines.map((machine) => (
              <Link key={machine.id} href={`/machines/${machine.id}`} className="group block">
                <Card className="flex items-center gap-4 px-5 py-4 hover:border-indigo-700 transition-colors">
                  {machine.image_path ? (
                    <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={machine.image_path}
                        alt={machine.canonical_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-2xl">
                      🏋️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {machine.canonical_name}
                    </h2>
                    {machine.muscle_groups.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {machine.muscle_groups.map((m) => (
                          <Badge key={m}>{m}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0">→</span>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/machines?page=${page - 1}`}>← Anterior</Link>
              </Button>
            )}
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            {page < totalPages && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/machines?page=${page + 1}`}>Siguiente →</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
