import { listAllMachinesPagedAdmin } from "@/services/machines";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ToggleMachineButton from "./ToggleMachineButton";

export default async function AdminMachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const data = await listAllMachinesPagedAdmin(page, 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {data.total} máquina{data.total !== 1 ? "s" : ""} en total
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-text-muted">Máquina</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted hidden sm:table-cell">Músculos</th>
              <th className="px-4 py-3 text-right font-medium text-text-muted">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.machines.map((m) => (
              <tr key={m.id} className={`${!m.is_active ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium">{m.canonical_name}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {m.muscle_groups.slice(0, 3).map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs">
                        {g}
                      </Badge>
                    ))}
                    {m.muscle_groups.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{m.muscle_groups.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <ToggleMachineButton machineId={m.id} isActive={m.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`px-3 py-1.5 rounded text-sm ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "bg-card-hover text-text-muted hover:bg-card-hover/80"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
