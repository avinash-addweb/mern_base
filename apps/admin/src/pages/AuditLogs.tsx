import { useState } from "react";
import type { PaginatedResponse, IAuditLog } from "@base-mern/types";
import { formatDate } from "@base-mern/utils";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (actionFilter) queryParams.set("action", actionFilter);
  if (resourceFilter) queryParams.set("resource", resourceFilter);

  const { data, loading, error, refetch } = useApiQuery<PaginatedResponse<IAuditLog>>(
    `/audit-logs?${queryParams.toString()}`,
  );

  const logs = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Audit Logs</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Filter by resource..."
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="w-48"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPage(1);
            refetch();
          }}
        >
          Apply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActionFilter("");
            setResourceFilter("");
            setPage(1);
          }}
        >
          Clear
        </Button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                    <TableCell className="text-sm">{log.userEmail}</TableCell>
                    <TableCell>
                      <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs font-medium">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{log.resource}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-sm">
                      {log.resourceId || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-[var(--muted-foreground)]">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-[var(--muted-foreground)]">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
