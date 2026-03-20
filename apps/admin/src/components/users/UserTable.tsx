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
import { RoleBadge } from "./RoleBadge";

interface UserTableProps {
  users: IUser[];
  onDelete?: (id: string) => void;
  onRoleChange?: (id: string, currentRole: string) => void;
}

export function UserTable({ users, onDelete, onRoleChange }: UserTableProps) {
  return (
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
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell className="space-x-1">
                {onRoleChange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRoleChange(user.id, user.role)}
                  >
                    Toggle Role
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(user.id)}
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
