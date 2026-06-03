import { pocketMoneyCalculations } from '@/calculations/pocket-money';
import { isPocketMoneyInterestReminderWindow } from '@/helpers/pocket-money-interest-reminder';
import type { PocketMoneyMemberSummary } from '@/types/pocket-money';
import type { PocketMoneySettings } from '@/settings/pocket-money';

export type DashboardPocketMoneyInterestAlert = {
  eligibleCount: number;
  totalPreview: number;
  currency: string;
  periodLabel: string;
  members: Array<{ label: string; amount: number; currency: string; reason?: string }>;
};

export function computeDashboardPocketMoneyInterestAlert(
  members: PocketMoneyMemberSummary[],
  settings: Pick<PocketMoneySettings, 'interest_enabled'>,
  periodLabel: string,
  selectedYear: number,
  selectedMonth: number,
): DashboardPocketMoneyInterestAlert | null {
  if (!settings.interest_enabled) return null;
  if (!isPocketMoneyInterestReminderWindow(selectedYear, selectedMonth)) return null;

  const eligible = members.filter((m) => m.interest?.eligible);
  if (eligible.length === 0) return null;

  const currency = eligible[0]?.currency ?? 'HUF';
  const totalPreview = eligible.reduce((s, m) => s + (m.interest?.previewAmount ?? 0), 0);

  return {
    eligibleCount: eligible.length,
    totalPreview,
    currency,
    periodLabel,
    members: eligible.map((m) => ({
      label: m.memberLabel,
      amount: m.interest?.previewAmount ?? 0,
      currency: m.currency,
      reason: m.interest?.reason,
    })),
  };
}

export function formatPocketMoneyInterestAlertTotal(alert: DashboardPocketMoneyInterestAlert): string {
  return pocketMoneyCalculations.formatAmount(alert.totalPreview, alert.currency);
}
