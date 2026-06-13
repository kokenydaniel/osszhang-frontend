import type { MetricItem } from '@/components/design';
import { ArrowDownLeft, ArrowUpRight, HandCoins, Users } from 'lucide-react';
import type { ReceivableContact, ReceivablesSummary } from '@/types/receivables';
import { formatCurrency } from '@/utils';

function formatMoney(amount: number, currency: string): string {
  return formatCurrency(Math.round(amount), currency);
}

export const receivablesCalculations = {
  formatMoney,
  buildMetricStrip(summary: ReceivablesSummary, currency = 'HUF'): MetricItem[] {
    return [
      {
        label: 'Összes kintlévőség',
        value: formatMoney(summary.totalOutstanding, currency),
        hint: 'Amit még nem kaptál vissza',
        icon: HandCoins,
        tone: summary.totalOutstanding > 0 ? 'warning' : 'success',
      },
      {
        label: 'Nyitott ügyek',
        value: String(summary.openContactCount),
        hint: 'Személy, akinél van hátralék',
        icon: Users,
        tone: summary.openContactCount > 0 ? 'warning' : 'default',
      },
      {
        label: 'Összesen kiadva',
        value: formatMoney(summary.totalLent, currency),
        hint: 'Eddigi kölcsönök és előlegek',
        icon: ArrowUpRight,
        tone: 'info',
      },
      {
        label: 'Visszafizetve',
        value: formatMoney(summary.totalRepaid, currency),
        hint: 'Már visszakapott összeg',
        icon: ArrowDownLeft,
        tone: 'success',
      },
    ];
  },

  sortContacts(contacts: ReceivableContact[]): ReceivableContact[] {
    return [...contacts].sort((a, b) => {
      if (a.isSettled !== b.isSettled) return a.isSettled ? 1 : -1;
      if (b.outstanding !== a.outstanding) return b.outstanding - a.outstanding;
      return a.name.localeCompare(b.name, 'hu');
    });
  },
};
