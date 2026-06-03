'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RentalOverdueBanner } from '@/components/rental/rental-overdue-banner';
import type { RentalOverdueRent } from '@/types/rental';

type Props = {
  overdueRents: RentalOverdueRent[];
  graceDays: number;
};

export function DashboardRentalOverdueLink({ overdueRents, graceDays }: Props) {
  return (
    <RentalOverdueBanner
      items={overdueRents}
      graceDays={graceDays}
      action={
        <Link
          href="/rental"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Bérbeadás <ChevronRight size={11} />
        </Link>
      }
    />
  );
}
