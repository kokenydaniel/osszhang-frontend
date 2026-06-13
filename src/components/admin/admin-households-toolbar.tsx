'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/design/SegmentedControl';
import type { AdminHouseholdTierFilter } from '@/types/admin';
import { formatTierLabel } from '@/helpers/admin-helpers';

const TIER_OPTIONS: { value: AdminHouseholdTierFilter; label: string }[] = [
  { value: 'all', label: 'Mind' },
  { value: 'free', label: formatTierLabel('free') },
  { value: 'pro', label: formatTierLabel('pro') },
  { value: 'premium', label: formatTierLabel('premium') },
];

type AdminHouseholdsToolbarProps = {
  search: string;
  tierFilter: AdminHouseholdTierFilter;
  onSearchChange: (value: string) => void;
  onTierFilterChange: (value: AdminHouseholdTierFilter) => void;
};

export function AdminHouseholdsToolbar({
  search,
  tierFilter,
  onSearchChange,
  onTierFilterChange,
}: AdminHouseholdsToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Keresés háztartás, vállalkozás vagy felhasználó alapján..."
          className="pl-9"
        />
      </div>

      <SegmentedControl
        options={TIER_OPTIONS}
        value={tierFilter}
        onChange={onTierFilterChange}
        size="sm"
        layoutId="admin-household-tier-filter"
      />
    </div>
  );
}
