import Link from 'next/link';
import { formatHUF } from '@/utils';
import { AccentPanel } from '@/components/design';
import { ChevronRight, HandCoins } from 'lucide-react';

type Props = {
  totalOutstanding: number;
  openContactCount: number;
};

export function DashboardReceivablesBanner({ totalOutstanding, openContactCount }: Props) {
  if (totalOutstanding <= 0.005) return null;

  const contactHint =
    openContactCount === 1
      ? '1 személynél van hátralék'
      : `${openContactCount} személynél van hátralék`;

  return (
    <AccentPanel
      tone="warning"
      icon={HandCoins}
      title="Kintlévőség"
      description={`${contactHint} — amit még vissza kellene kapnod.`}
      action={
        <Link
          href="/receivables"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Részletek <ChevronRight size={11} />
        </Link>
      }
    >
      <span className="tabular-nums text-lg font-semibold text-foreground">{formatHUF(totalOutstanding)}</span>
    </AccentPanel>
  );
}
