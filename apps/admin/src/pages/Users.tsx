import { useState } from "react";
import { UserRole } from "@base-mern/types";
import type { IUser } from "@base-mern/types";
import { formatDate } from "@base-mern/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const mockUsers: IUser[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: UserRole.ADMIN,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-06-01"),
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    role: UserRole.USER,
    createdAt: new Date("2025-03-20"),
    updatedAt: new Date("2025-07-10"),
  },
  {
    id: "3",
    name: "Carol Williams",
    email: "carol@example.com",
    role: UserRole.USER,
    createdAt: new Date("2025-05-08"),
    updatedAt: new Date("2025-08-15"),
  },
  {
    id: "4",
    name: "David Brown",
    email: "david@example.com",
    role: UserRole.ADMIN,
    createdAt: new Date("2025-06-12"),
    updatedAt: new Date("2025-09-01"),
  },
  {
    id: "5",
    name: "Eve Davis",
    email: "eve@example.com",
    role: UserRole.USER,
    createdAt: new Date("2025-08-25"),
    updatedAt: new Date("2025-10-20"),
  },
];

const PAGE_SIZE = 5;

export default function Users() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(mockUsers.length / PAGE_SIZE);
  const paginatedUsers = mockUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">User Management</h1>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      user.role === UserRole.ADMIN
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
                    )}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-[var(--muted-foreground)]">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
