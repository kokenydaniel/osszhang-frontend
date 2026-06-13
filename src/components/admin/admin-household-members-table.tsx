'use client';

import { KeyRound, LogIn, MoreHorizontal, User, UserMinus, UserPlus } from 'lucide-react';
import {
  DataTable,
  EmptyState,
  StatusPill,
  type DataTableColumn,
} from '@/components/design';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatHouseholdRole } from '@/helpers/admin-helpers';
import { formatDate } from '@/utils';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminHouseholdMember } from '@/types/admin';

type AdminHouseholdMembersTableProps = {
  members: AdminHouseholdMember[];
  canManageMember: (member: AdminHouseholdMember) => boolean;
  onActivate: (member: AdminHouseholdMember) => void;
  onDeactivate: (member: AdminHouseholdMember) => void;
  onImpersonate: (member: AdminHouseholdMember) => void;
  onResetPassword: (member: AdminHouseholdMember) => void;
};

export function AdminHouseholdMembersTable({
  members,
  canManageMember,
  onActivate,
  onDeactivate,
  onImpersonate,
  onResetPassword,
}: AdminHouseholdMembersTableProps) {
  const columns: DataTableColumn<AdminHouseholdMember>[] = [
    {
      key: 'user',
      header: 'Felhasználó',
      width: '28%',
      cell: (row) => {
        const displayName = formatDisplayName(row.first_name, row.last_name) || row.username;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{row.username}</p>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Szerep',
      cell: (row) => formatHouseholdRole(row.role),
    },
    {
      key: 'status',
      header: 'Státusz',
      align: 'center',
      cell: (row) => (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <StatusPill status={row.is_active ? 'success' : 'danger'} size="xs">
            {row.is_active ? 'Aktív' : 'Inaktív'}
          </StatusPill>
          {row.lifetime_admin ? (
            <StatusPill status="warning" size="xs">
              Platform admin
            </StatusPill>
          ) : null}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Utolsó belépés',
      align: 'right',
      cell: (row) => (row.last_login_at ? formatDate(row.last_login_at) : '—'),
    },
    {
      key: 'created',
      header: 'Regisztráció',
      align: 'right',
      cell: (row) => (row.created_at ? formatDate(row.created_at) : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '56px',
      cell: (row) => {
        if (!canManageMember(row)) {
          return (
            <span className="text-[0.65rem] text-muted-foreground">
              {row.lifetime_admin ? 'Védett' : 'Saját fiók'}
            </span>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8" aria-label="Műveletek">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onResetPassword(row)}>
                <KeyRound size={14} className="text-muted-foreground" />
                Ideiglenes jelszó
              </DropdownMenuItem>
              {row.is_active ? (
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onImpersonate(row)}>
                  <LogIn size={14} className="text-muted-foreground" />
                  Belépés mint user
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              {row.is_active ? (
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2 cursor-pointer"
                  onClick={() => onDeactivate(row)}
                >
                  <UserMinus size={14} />
                  Inaktiválás
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onActivate(row)}>
                  <UserPlus size={14} className="text-muted-foreground" />
                  Aktiválás
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (members.length === 0) {
    return (
      <EmptyState
        icon={User}
        title="Nincs tag"
        description="Ehhez a háztartáshoz még nem tartozik felhasználó."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={members}
      rowKey={(row) => row.id}
      minWidth="920px"
    />
  );
}
