import Link from 'next/link';
import { formatHUF } from '@/utils';
import { AccentPanel } from '@/components/design';
import { ChevronRight, Users } from 'lucide-react';

type Props = {
  rezsiBalance: number;
  counterpartyLabel: string;
};

export function DashboardUtilitiesRezsiDebtBanner({ rezsiBalance, counterpartyLabel }: Props) {
  if (rezsiBalance === 0) return null;

  return (
    <AccentPanel
      tone={rezsiBalance < 0 ? 'warning' : 'success'}
      icon={Users}
      title={rezsiBalance < 0 ? `Rezsi tartozás — ${counterpartyLabel}` : `${counterpartyLabel} tartozik neked`}
      description={`Aktuális rezsi-egyenleg: ${formatHUF(Math.abs(rezsiBalance))}`}
      action={
        <Link
          href="/utilities"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Rezsi <ChevronRight size={11} />
        </Link>
      }
    >
      <span className="tabular-nums text-lg font-semibold text-foreground">{formatHUF(Math.abs(rezsiBalance))}</span>
    </AccentPanel>
  );
}
