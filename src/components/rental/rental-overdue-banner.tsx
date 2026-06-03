'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { InsightBanner } from '@/components/design';
import { rentalCalculations } from '@/calculations/rental';
import type { RentalOverdueRent } from '@/types/rental';

type Props = {
  items: RentalOverdueRent[];
  graceDays: number;
  action?: ReactNode;
};

export function RentalOverdueBanner({ items, graceDays, action }: Props) {
  if (items.length === 0) return null;

  return (
    <InsightBanner tone="warning" icon={AlertTriangle} title="Lejárt bérleti díj" action={action}>
      <p className="text-sm text-muted-foreground mb-2">
        Esedékesség után ({graceDays > 0 ? `${graceDays} nap türelmi idő után` : 'azonnal'}) hiányzik a
        teljes összeg (bérleti díj + áthárított közös költség). Részleges befizetésnél a hátralék továbbra
        is figyelmeztet:
      </p>
      <ul className="list-disc pl-4 space-y-1 text-sm">
        {items.map((item) => (
          <li key={`${item.propertyId}-${item.incomeEntryId ?? item.dueDate}`}>
            {rentalCalculations.formatOverdueLine(item)}
          </li>
        ))}
      </ul>
    </InsightBanner>
  );
}
