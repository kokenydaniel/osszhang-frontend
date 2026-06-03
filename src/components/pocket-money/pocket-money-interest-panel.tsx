'use client';

import { Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionPanel, InsightBanner } from '@/components/design';
import { pocketMoneyCalculations } from '@/calculations/pocket-money';
import type { PocketMoneyDisplayMember } from '@/types/pocket-money';
import type { PocketMoneySettings } from '@/settings/pocket-money';
import { pocketMoneyInterestSummary } from '@/settings/pocket-money-interest-labels';
import {
  isPocketMoneyInterestReminderWindow,
  pocketMoneyInterestReminderPeriodLabel,
} from '@/helpers/pocket-money-interest-reminder';

type PocketMoneyInterestPanelProps = {
  periodLabel: string;
  selectedYear: number;
  selectedMonth: number;
  settings: PocketMoneySettings;
  members: PocketMoneyDisplayMember[];
  canEdit: boolean;
  applying: boolean;
  onApply: () => void;
};

export function PocketMoneyInterestPanel({
  periodLabel,
  selectedYear,
  selectedMonth,
  settings,
  members,
  canEdit,
  applying,
  onApply,
}: PocketMoneyInterestPanelProps) {
  if (!settings.interest_enabled) return null;

  const showInterestReminder = isPocketMoneyInterestReminderWindow(selectedYear, selectedMonth);
  const reminderPeriodLabel = pocketMoneyInterestReminderPeriodLabel(selectedYear, selectedMonth);

  const eligible = members.filter((m) => m.interest?.eligible);
  const applied = members.filter((m) => m.interest?.applied);
  const totalPreview = eligible.reduce((s, m) => s + (m.interest?.previewAmount ?? 0), 0);
  const ruleSummary = pocketMoneyInterestSummary(
    settings.interest_rate_percent,
    settings.interest_on,
    settings.interest_basis,
  );

  return (
    <SectionPanel title="Zsebpénz kamat" className="shadow-soft">
      <div className="space-y-4">
        <InsightBanner tone="info" icon={Percent}>
          <p className="text-sm">
            Havi kamat: <strong>{ruleSummary}</strong>. A kamat korrekcióként kerül rögzítésre („Kamat (év-hó)”
            megjegyzéssel).
          </p>
        </InsightBanner>

        {eligible.length > 0 && showInterestReminder ? (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm text-foreground">
              <strong>{periodLabel}</strong> — {eligible.length} gyereknek összesen{' '}
              <strong>{pocketMoneyCalculations.formatAmount(totalPreview, members[0]?.currency ?? 'HUF')}</strong>{' '}
              kamat adható.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {eligible.map((m) => (
                <li key={m.memberKey}>
                  {m.memberLabel}: {pocketMoneyCalculations.formatAmount(m.interest?.previewAmount ?? 0, m.currency)}
                  {m.interest?.reason ? ` — ${m.interest.reason}` : ''}
                </li>
              ))}
            </ul>
            {canEdit ? (
              <Button type="button" onClick={onApply} loading={applying} disabled={applying}>
                Kamat rögzítése ({periodLabel})
              </Button>
            ) : null}
          </div>
        ) : eligible.length > 0 && !showInterestReminder ? (
          <p className="text-sm text-muted-foreground">
            {eligible.length} gyereknek kamat járhat ebben a hónapban — a kiosztás és a „Kamat rögzítése” gomb a hónap
            végén jelenik meg ({reminderPeriodLabel}), amíg a költések még változhatnak.
          </p>
        ) : applied.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            A kamat már rögzítve van ebben a hónapban ({applied.length} gyerek).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ebben a hónapban nincs kamatra jogosult gyerek (pl. költés volt, vagy nincs egyenleg).
          </p>
        )}
      </div>
    </SectionPanel>
  );
}
