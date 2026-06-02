'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/design/SegmentedControl';
import type { AdminLifetimeAdminFilter, AdminUserStatusFilter } from '@/types/admin';

const STATUS_OPTIONS: { value: AdminUserStatusFilter; label: string }[] = [
  { value: 'all', label: 'Mind' },
  { value: 'active', label: 'Aktív' },
  { value: 'inactive', label: 'Inaktív' },
];

const LIFETIME_OPTIONS: { value: AdminLifetimeAdminFilter; label: string }[] = [
  { value: 'all', label: 'Mind' },
  { value: 'yes', label: 'Platform admin' },
  { value: 'no', label: 'Normál' },
];

type AdminUsersToolbarProps = {
  search: string;
  statusFilter: AdminUserStatusFilter;
  lifetimeAdminFilter: AdminLifetimeAdminFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: AdminUserStatusFilter) => void;
  onLifetimeAdminFilterChange: (value: AdminLifetimeAdminFilter) => void;
};

export function AdminUsersToolbar({
  search,
  statusFilter,
  lifetimeAdminFilter,
  onSearchChange,
  onStatusFilterChange,
  onLifetimeAdminFilterChange,
}: AdminUsersToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Keresés felhasználónév vagy név alapján..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          size="sm"
          layoutId="admin-status-filter"
        />
        <SegmentedControl
          options={LIFETIME_OPTIONS}
          value={lifetimeAdminFilter}
          onChange={onLifetimeAdminFilterChange}
          size="sm"
          layoutId="admin-lifetime-filter"
        />
      </div>
    </div>
  );
}
