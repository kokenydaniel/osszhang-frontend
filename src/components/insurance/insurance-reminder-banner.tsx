'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { InsightBanner } from '@/components/design';
import { insuranceCalculations } from '@/calculations/insurance';
import type { InsuranceUpcomingReminder } from '@/types/insurance';

type InsuranceReminderBannerProps = {
  upcoming: InsuranceUpcomingReminder[];
  reminderDays: number;
  action?: ReactNode;
};

export function InsuranceReminderBanner({ upcoming, reminderDays, action }: InsuranceReminderBannerProps) {
  if (upcoming.length === 0) return null;

  const overdue = upcoming.filter((u) => u.overdue);
  const tone = overdue.length > 0 ? 'warning' : 'info';
  const Icon = overdue.length > 0 ? AlertTriangle : CalendarClock;

  return (
    <InsightBanner tone={tone} icon={Icon} title="Közelgő megújítások és lejáratok" action={action}>
      <p className="text-sm text-muted-foreground mb-2">
        A következő {reminderDays} napban esedékes események (beállítások szerint):
      </p>
      <ul className="list-disc pl-4 space-y-1 text-sm">
        {upcoming.map((item) => (
          <li key={`${item.policyId}-${item.kind}-${item.date}`}>
            {insuranceCalculations.formatReminderLine(item)}
          </li>
        ))}
      </ul>
    </InsightBanner>
  );
}
