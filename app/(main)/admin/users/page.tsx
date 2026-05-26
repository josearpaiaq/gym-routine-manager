import { getSession } from "@/lib/auth";
import { listAllUsers } from "@/services/users";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ToggleUserButton from "./ToggleUserButton";

export default async function AdminUsersPage() {
  const session = await getSession();
  const users = await listAllUsers();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
      </p>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left font-medium text-gray-400">Usuario</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">Activo</th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">Analizador</th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className={!u.isEnabled ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.username}</span>
                      {u.isAdmin && (
                        <Badge className="text-xs bg-indigo-600 text-white border-0">Admin</Badge>
                      )}
                      {!u.emailVerified && (
                        <Badge variant="secondary" className="text-xs">No verificado</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <ToggleUserButton
                      userId={u.id}
                      field="isEnabled"
                      value={u.isEnabled}
                      disabled={u.id === session?.userId}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleUserButton
                      userId={u.id}
                      field="analyzerEnabled"
                      value={u.analyzerEnabled}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleUserButton
                      userId={u.id}
                      field="isAdmin"
                      value={u.isAdmin}
                      disabled={u.id === session?.userId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
