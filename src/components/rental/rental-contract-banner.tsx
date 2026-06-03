'use client';

import { AlertTriangle, CalendarClock } from 'lucide-react';
import { InsightBanner } from '@/components/design';
import { rentalCalculations } from '@/calculations/rental';
import type { RentalContractEndReminder } from '@/types/rental';

type Props = {
  items: RentalContractEndReminder[];
  reminderDays: number;
};

export function RentalContractBanner({ items, reminderDays }: Props) {
  if (items.length === 0) return null;

  const overdue = items.some((i) => i.overdue);
  const tone = overdue ? 'warning' : 'info';
  const Icon = overdue ? AlertTriangle : CalendarClock;

  return (
    <InsightBanner tone={tone} icon={Icon} title="Közelgő szerződés-lejáratok">
      <p className="text-sm text-muted-foreground mb-2">
        A következő {reminderDays} napban lejáró szerződések:
      </p>
      <ul className="list-disc pl-4 space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.propertyId}>{rentalCalculations.formatContractReminder(item)}</li>
        ))}
      </ul>
    </InsightBanner>
  );
}
