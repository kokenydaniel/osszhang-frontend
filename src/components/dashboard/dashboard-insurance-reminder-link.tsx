'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { InsuranceReminderBanner } from '@/components/insurance/insurance-reminder-banner';
import type { InsuranceUpcomingReminder } from '@/types/insurance';

type Props = {
  upcoming: InsuranceUpcomingReminder[];
  reminderDays: number;
};

export function DashboardInsuranceReminder({ upcoming, reminderDays }: Props) {
  return (
    <InsuranceReminderBanner
      upcoming={upcoming}
      reminderDays={reminderDays}
      action={
        <Link
          href="/insurance"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Részletek <ChevronRight size={11} />
        </Link>
      }
    />
  );
}
