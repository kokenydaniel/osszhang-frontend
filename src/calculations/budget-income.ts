import type { CashTransaction } from '@/types';
import { hasSettlementDate, isDueOverdue, today, toDayjs } from '@/utils';

export type MissedIncomeItem = {
  transactionId: number | string;
  year: number;
  month: number;
  monthLabel: string;
  amount: number;
  dueDate: string;
  description: string;
  category: string;
};

export type MissedIncomeSummary = {
  totalMissed: number;
  itemCount: number;
  items: MissedIncomeItem[];
  periodLabel: string;
  headlineDescription: string;
};

function parseDueMonth(dueDate: string): { year: number; month: number } | null {
  if (!dueDate || dueDate.length < 7) return null;
  const year = parseInt(dueDate.slice(0, 4), 10);
  const month = parseInt(dueDate.slice(5, 7), 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export const budgetIncomeCalculations = {
  computeMissedIncomeSummary(params: {
    transactions: CashTransaction[];
    selectedYear: number;
    throughMonth: number;
    referenceDate?: string;
    missedIncomeEnabled?: boolean;
    graceDays?: number;
  }): MissedIncomeSummary | null {
    if (params.missedIncomeEnabled === false) return null;

    const referenceDate = params.referenceDate ?? today();
    const graceDays = Math.max(0, params.graceDays ?? 0);
    const items: MissedIncomeItem[] = [];

    for (const tx of params.transactions) {
      if (tx.type !== 'income' || tx.isReserve) continue;
      if (hasSettlementDate(tx.paidDate)) continue;

      const due = parseDueMonth(tx.dueDate);
      if (!due || due.year !== params.selectedYear) continue;
      if (due.month > params.throughMonth) continue;

      const graceThreshold = toDayjs(tx.dueDate).add(graceDays, 'day').format('YYYY-MM-DD');
      if (!isDueOverdue({ dueDate: graceThreshold, paidDate: tx.paidDate }, referenceDate)) continue;

      items.push({
        transactionId: tx.id,
        year: due.year,
        month: due.month,
        monthLabel: toDayjs(`${due.year}-${String(due.month).padStart(2, '0')}-01`).format('YYYY. MMMM'),
        amount: Math.abs(tx.amount),
        dueDate: tx.dueDate,
        description: tx.description,
        category: tx.category,
      });
    }

    items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const totalMissed = items.reduce((sum, item) => sum + item.amount, 0);
    if (totalMissed <= 0) return null;

    const first = items[0];
    const last = items[items.length - 1];
    const periodLabel =
      items.length === 1 ? first.monthLabel : `${first.monthLabel} – ${last.monthLabel}`;
    const headlineDescription =
      items.length === 1
        ? `1 hónapban nem érkezett meg a várható bevétel (${first.monthLabel}).`
        : `${items.length} hónapban nem érkezett meg a várható bevétel (${periodLabel}).`;

    return {
      totalMissed,
      itemCount: items.length,
      items,
      periodLabel,
      headlineDescription,
    };
  },
};
