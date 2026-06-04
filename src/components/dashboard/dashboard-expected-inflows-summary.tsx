'use client';

import Link from 'next/link';
import { formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import { AccentPanel } from '@/components/design';
import { ChevronRight, CircleDollarSign } from 'lucide-react';
import type { DashboardExpectedInflowsSummary } from '@/helpers/dashboard-expected-inflows';
import classNames from 'classnames';

type Props = {
  summary: DashboardExpectedInflowsSummary;
};

function formatSignedHuf(amount: number): string {
  const abs = formatHUF(Math.abs(amount));
  if (amount > 0) return `+${abs}`;
  if (amount < 0) return `−${abs}`;
  return abs;
}

export function DashboardExpectedInflowsSummary({ summary }: Props) {
  const { lines, netExpected, incomingTotal, owedTotal } = summary;
  const tone = netExpected > 0 ? 'success' : netExpected < 0 ? 'warning' : 'info';

  const netDescription =
    owedTotal > 0 && incomingTotal > 0
      ? `${formatHUF(incomingTotal)} várható bevétel, ${formatHUF(owedTotal)} rezsi tartozás levonva.`
      : owedTotal > 0
        ? 'A rezsi tartozás miatt nettóban kötelezettség látszik.'
        : 'Elmaradt bevételek, kintlévőség és rezsi egyenleg együtt.';

  return (
    <AccentPanel
      tone={tone}
      icon={CircleDollarSign}
      title="Várható pénz — összesítés"
      description={netDescription}
      titleInfo={HELP.dashboard.expectedInflows}
      className="col-span-full"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            Nettó (kerekítve)
          </p>
          <p
            className={classNames(
              'tabular-nums text-2xl sm:text-3xl font-bold tracking-tight',
              netExpected > 0 && 'text-emerald-600 dark:text-emerald-400',
              netExpected < 0 && 'text-amber-700 dark:text-amber-400',
              netExpected === 0 && 'text-foreground',
            )}
          >
            {formatHUF(netExpected)}
          </p>
        </div>

        <ul className="flex flex-wrap gap-2 sm:justify-end sm:max-w-[70%]">
          {lines.map((line) => (
            <li key={line.id}>
              <Link
                href={line.href}
                className={classNames(
                  'inline-flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-card/80',
                  line.amount > 0
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : 'border-amber-500/25 bg-amber-500/5',
                )}
              >
                <span className="text-[0.65rem] font-medium text-muted-foreground leading-tight">
                  {line.label}
                </span>
                <span
                  className={classNames(
                    'text-sm font-semibold tabular-nums inline-flex items-center gap-1',
                    line.amount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400',
                  )}
                >
                  {formatSignedHuf(line.amount)}
                  <ChevronRight size={12} className="opacity-60 shrink-0" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AccentPanel>
  );
}
