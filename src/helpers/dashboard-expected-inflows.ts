import type { MissedIncomeSummary } from '@/calculations/budget-income';

export type DashboardExpectedInflowId = 'missed_income' | 'receivables' | 'rezsi';

export type DashboardExpectedInflowLine = {
  id: DashboardExpectedInflowId;
  label: string;
  amount: number;
  href: string;
};

export type DashboardExpectedInflowsSummary = {
  lines: DashboardExpectedInflowLine[];
  netExpected: number;
  incomingTotal: number;
  owedTotal: number;
};

export function computeDashboardExpectedInflows(params: {
  showMissedIncome: boolean;
  missedIncomeSummary: MissedIncomeSummary | null;
  showReceivables: boolean;
  receivablesOutstanding: number;
  showUtilitiesRezsiDebt: boolean;
  rezsiBalance: number;
  counterpartyLabel: string;
}): DashboardExpectedInflowsSummary | null {
  const lines: DashboardExpectedInflowLine[] = [];

  if (params.showMissedIncome && params.missedIncomeSummary) {
    const amount = Math.round(params.missedIncomeSummary.totalMissed);
    if (amount > 0) {
      lines.push({
        id: 'missed_income',
        label: 'Elmaradt bevétel',
        amount,
        href: '/budget',
      });
    }
  }

  if (params.showReceivables && params.receivablesOutstanding > 0.005) {
    lines.push({
      id: 'receivables',
      label: 'Kintlévőség',
      amount: Math.round(params.receivablesOutstanding),
      href: '/receivables',
    });
  }

  if (params.showUtilitiesRezsiDebt && params.rezsiBalance !== 0) {
    const amount = Math.round(params.rezsiBalance);
    const label =
      amount > 0
        ? `Rezsi — ${params.counterpartyLabel} tartozik`
        : `Rezsi tartozás — ${params.counterpartyLabel}`;
    lines.push({
      id: 'rezsi',
      label,
      amount,
      href: '/utilities',
    });
  }

  if (lines.length === 0) return null;

  const netExpected = lines.reduce((sum, line) => sum + line.amount, 0);
  const incomingTotal = lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const owedTotal = lines.filter((l) => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0);

  return { lines, netExpected, incomingTotal, owedTotal };
}
