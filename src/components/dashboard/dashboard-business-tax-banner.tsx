'use client';

import Link from 'next/link';
import { Scale, ChevronRight } from 'lucide-react';
import { AccentPanel } from '@/components/design';
import type { DashboardBusinessTaxAlert } from '@/helpers/dashboard-business-tax-alert';

type Props = {
  alert: DashboardBusinessTaxAlert;
};

export function DashboardBusinessTaxBanner({ alert }: Props) {
  return (
    <AccentPanel
      tone={alert.tone}
      icon={Scale}
      title={alert.title}
      description={alert.description}
      action={
        <Link
          href="/business"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Vállalkozás <ChevronRight size={11} />
        </Link>
      }
    />
  );
}
