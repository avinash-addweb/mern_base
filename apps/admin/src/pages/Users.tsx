import { useState, useCallback } from "react";
import type { PaginatedResponse, IUser } from "@base-mern/types";
import { UserRole } from "@base-mern/types";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api";
import { UserTable } from "@/components/users/UserTable";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

export default function Users() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useApiQuery<PaginatedResponse<IUser>>(
    `/users?page=${page}&limit=${PAGE_SIZE}`,
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        await apiFetch(`/users/${id}`, { method: "DELETE" });
        refetch();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [refetch],
  );

  const handleRoleChange = useCallback(
    async (id: string, currentRole: string) => {
      const newRole = currentRole === UserRole.ADMIN ? "USER" : "ADMIN";
      if (!confirm(`Change role to ${newRole}?`)) return;
      try {
        await apiFetch(`/users/${id}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: newRole }),
        });
        refetch();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Role change failed");
      }
    },
    [refetch],
  );

  const users = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">User Management</h1>
      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <UserTable users={users} onDelete={handleDelete} onRoleChange={handleRoleChange} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
