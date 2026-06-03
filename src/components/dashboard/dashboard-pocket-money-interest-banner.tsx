'use client';

import Link from 'next/link';
import { Percent, ChevronRight } from 'lucide-react';
import { AccentPanel } from '@/components/design';
import {
  formatPocketMoneyInterestAlertTotal,
  type DashboardPocketMoneyInterestAlert,
} from '@/helpers/dashboard-pocket-money-alert';
import { pocketMoneyCalculations } from '@/calculations/pocket-money';

type Props = {
  alert: DashboardPocketMoneyInterestAlert;
};

export function DashboardPocketMoneyInterestBanner({ alert }: Props) {
  const total = formatPocketMoneyInterestAlertTotal(alert);

  return (
    <AccentPanel
      tone="info"
      icon={Percent}
      title="Kiosztható zsebpénz kamat"
      description={`${alert.periodLabel} — ${alert.eligibleCount} gyereknek összesen ${total}`}
      action={
        <Link
          href="/pocket-money"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Zsebpénz <ChevronRight size={11} />
        </Link>
      }
    >
      <ul className="text-xs text-muted-foreground space-y-1 mt-1">
        {alert.members.map((m) => (
          <li key={m.label}>
            {m.label}: {pocketMoneyCalculations.formatAmount(m.amount, m.currency)}
            {m.reason ? ` — ${m.reason}` : ''}
          </li>
        ))}
      </ul>
    </AccentPanel>
  );
}
