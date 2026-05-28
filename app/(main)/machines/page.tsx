import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { listMachinesPaged } from "@/services/machines";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MachinesPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const { machines, total, totalPages } = await listMachinesPaged(page, 10);

  return (
    <main className="min-h-screen bg-canvas text-text">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Máquinas</h1>
            <p className="text-text-muted text-sm mt-1">{total} en la base de datos</p>
          </div>
          <Button asChild>
            <Link href="/analyze">+ Analizar nueva</Link>
          </Button>
        </div>

        {machines.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-text-muted">No hay máquinas registradas aún.</p>
            <Button asChild variant="link" className="mt-4 text-sm">
              <Link href="/analyze" className="inline-flex items-center gap-1">
                Analiza la primera máquina
                <ChevronRight size={14} />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {machines.map((machine) => (
              <Link key={machine.id} href={`/machines/${machine.id}`} className="group block">
                <Card className="flex items-center gap-4 px-5 py-4 hover:border-indigo-700 transition-colors">
                  {machine.is_gym_machine && machine.image_path ? (
                    <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={machine.image_path}
                        alt={machine.canonical_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-900/30">
                      <ImageOff size={22} className="text-amber-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={`font-semibold truncate transition-colors ${machine.is_gym_machine ? "text-text group-hover:text-indigo-500 dark:group-hover:text-indigo-300" : "text-amber-600 dark:text-amber-300"}`}>
                        {machine.canonical_name}
                      </h2>
                      {!machine.is_gym_machine && (
                        <span className="shrink-0 text-xs font-medium text-amber-500">
                          No identificada
                        </span>
                      )}
                    </div>
                    {machine.muscle_groups.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {machine.muscle_groups.map((m) => (
                          <Badge key={m}>{m}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-text-muted group-hover:text-indigo-400 transition-colors shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/machines?page=${page - 1}`} className="inline-flex items-center gap-1">
                  <ChevronLeft size={14} />
                  Anterior
                </Link>
              </Button>
            )}
            <span className="text-sm text-text-muted">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/machines?page=${page + 1}`} className="inline-flex items-center gap-1">
                  Siguiente
                  <ChevronRight size={14} />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
