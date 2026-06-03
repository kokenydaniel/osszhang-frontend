'use client';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionPanel } from '@/components/design';
import type { PocketMoneyDisplayMember } from '@/types/pocket-money';
import { PocketMoneyMemberCard } from './pocket-money-member-card';

type PocketMoneyMembersPanelProps = {
  members: PocketMoneyDisplayMember[];
  selectedMemberKey: string | null;
  onSelectMember: (key: string | null) => void;
  canEdit?: boolean;
  onAddMember?: () => void;
  onEditMember?: (member: PocketMoneyDisplayMember) => void;
};

export function PocketMoneyMembersPanel({
  members,
  selectedMemberKey,
  onSelectMember,
  canEdit,
  onAddMember,
  onEditMember,
}: PocketMoneyMembersPanelProps) {
  const hasMembers = members.length > 0;

  return (
    <SectionPanel
      title="Családtagok egyenlege"
      className="shadow-soft"
      action={
        canEdit && onAddMember ? (
          <Button type="button" variant="outline" size="sm" onClick={onAddMember}>
            <UserPlus size={14} />
            Gyerek hozzáadása
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip active={selectedMemberKey === null} onClick={() => onSelectMember(null)}>
          Mindenki
        </FilterChip>
        {members.map((m) => (
          <FilterChip
            key={m.memberKey}
            active={selectedMemberKey === m.memberKey}
            onClick={() => onSelectMember(selectedMemberKey === m.memberKey ? null : m.memberKey)}
          >
            {m.memberLabel}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[8rem]">
        {hasMembers ? (
          members.map((m) => (
            <PocketMoneyMemberCard
              key={m.memberKey}
              member={m}
              active={selectedMemberKey === m.memberKey}
              canEdit={canEdit}
              onSelect={() => onSelectMember(selectedMemberKey === m.memberKey ? null : m.memberKey)}
              onEdit={onEditMember ? () => onEditMember(m) : undefined}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground col-span-full self-center px-1">
            {canEdit
              ? 'Add hozzá a gyereket, majd rögzítsd az első zsebpénz tételt.'
              : 'Még nincs gyerek vagy tétel ebben a hónapban.'}
          </p>
        )}
      </div>
    </SectionPanel>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}
