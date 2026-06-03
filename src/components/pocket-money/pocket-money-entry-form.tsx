'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { DatePicker } from '@/components/ui/DatePicker';
import { SegmentedControl } from '@/components/design';
import {
  POCKET_MONEY_ENTRY_HINTS,
  type PocketMoneyFormValues,
} from '@/calculations/pocket-money';
import type { PocketMoneyEntryType, PocketMoneyRosterMember } from '@/types/pocket-money';
import { PiggyBank, ShoppingBag, SlidersHorizontal, UserPlus } from 'lucide-react';
import classNames from 'classnames';
import { PocketMoneyAvatar } from './pocket-money-avatar';

type PocketMoneyEntryFormProps = {
  values: PocketMoneyFormValues;
  onPatch: (patch: Partial<PocketMoneyFormValues>) => void;
  onSelectMember: (member: PocketMoneyRosterMember) => void;
  roster: PocketMoneyRosterMember[];
  defaultCurrency: string;
  rootError?: string;
  onAddMember?: () => void;
};

export function PocketMoneyEntryForm({
  values,
  onPatch,
  onSelectMember,
  roster,
  defaultCurrency,
  rootError,
  onAddMember,
}: PocketMoneyEntryFormProps) {
  const isHuf = defaultCurrency === 'HUF';
  const hasRoster = roster.length > 0;

  return (
    <div className="space-y-4">
      {rootError ? <p className="text-sm text-destructive">{rootError}</p> : null}

      <FormField
        label="Kihez szól a tétel?"
        hint={hasRoster ? 'Válaszd ki a gyereket — nem kell újra beírnod a nevét.' : 'Először add hozzá a gyereket a listához.'}
      >
        {hasRoster ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roster.map((member) => {
              const selected = values.rosterMemberId === member.id;
              return (
                <MemberPickCard
                  key={member.id}
                  label={member.label}
                  iconId={member.icon}
                  stickerColor={member.stickerColor}
                  iconColor={member.iconColor}
                  selected={selected}
                  onClick={() => onSelectMember(member)}
                />
              );
            })}
            {onAddMember ? (
              <button
                type="button"
                onClick={onAddMember}
                className="flex min-h-[4.5rem] items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <UserPlus size={18} />
                Új gyerek
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Még nincs gyerek a névsorban.{' '}
            {onAddMember ? (
              <button type="button" className="text-primary font-medium hover:underline" onClick={onAddMember}>
                Add hozzá az elsőt
              </button>
            ) : null}
          </div>
        )}
      </FormField>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Típus</p>
        <p className="text-xs text-muted-foreground -mt-1">{POCKET_MONEY_ENTRY_HINTS[values.entryType]}</p>
        <SegmentedControl
          variant="choice"
          value={values.entryType}
          onChange={(v) => onPatch({ entryType: v as PocketMoneyEntryType })}
          animated={false}
          options={[
            {
              value: 'allowance',
              label: 'Kiosztás',
              icon: PiggyBank,
              tone: 'positive',
              description: 'Zsebpénz, ajándék',
            },
            {
              value: 'expense',
              label: 'Költés',
              icon: ShoppingBag,
              tone: 'negative',
              description: 'Elköltött összeg',
            },
            {
              value: 'adjustment',
              label: 'Korrekció',
              icon: SlidersHorizontal,
              tone: 'accent',
              description: 'Egyenleg javítás',
            },
          ]}
        />
      </div>

      <FormField label="Összeg" hint={isHuf ? 'Forintban rögzítve, mint a költségvetésben.' : undefined}>
        <div className="relative">
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={values.amount}
            onChange={(e) => onPatch({ amount: e.target.value, currency: defaultCurrency })}
            className={isHuf ? 'pr-12' : undefined}
          />
          {isHuf ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              Ft
            </span>
          ) : null}
        </div>
      </FormField>

      <FormField label="Dátum">
        <DatePicker
          value={values.entryDate}
          onChange={(entryDate) => onPatch({ entryDate })}
          placeholder="Válassz dátumot"
        />
      </FormField>

      <FormField label="Megjegyzés (opcionális)">
        <Input
          value={values.note}
          onChange={(e) => onPatch({ note: e.target.value })}
          placeholder="pl. havi zsebpénz, mozi"
        />
      </FormField>
    </div>
  );
}

function MemberPickCard({
  label,
  iconId,
  stickerColor,
  iconColor,
  selected,
  onClick,
}: {
  label: string;
  iconId: string;
  stickerColor?: string | null;
  iconColor?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200',
        selected
          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/25 shadow-sm'
          : 'border-border bg-card hover:border-primary/25',
      )}
    >
      <span className="text-sm font-semibold text-foreground truncate">{label}</span>
      <PocketMoneyAvatar
        iconId={iconId}
        variant="sticker"
        active={selected}
        animate={false}
        stickerColor={stickerColor}
        iconColor={iconColor}
      />
    </button>
  );
}
