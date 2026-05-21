import Link from 'next/link';
import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { Section, EmptyState, ProgressBar, DataList, DataRow } from '@/components/design';
import { Zap, Droplets, Flame, ChevronRight, PiggyBank, Calendar } from 'lucide-react';
import type { DashboardPageState } from '@/components/modules/dashboard/hooks/use-dashboard-page-state';

type Props = Pick<
  DashboardPageState,
  | 'canUse'
  | 'consumptionData'
  | 'investments'
  | 'investmentPayouts'
  | 'totalInvestmentsValue'
>;

export function DashboardSideColumn({
  canUse,
  consumptionData,
  investments,
  investmentPayouts,
  totalInvestmentsValue,
}: Props) {
  return (
    <div className={classNames('flex flex-col gap-6', canUse('budget') ? 'lg:col-span-2' : '')}>
      {canUse('meters') && consumptionData.length > 0 && (
        <Section
          title="Közműfogyasztás"
          description="Aktuális havi értékek"
          action={
            <Link href="/meters" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
              Részletek <ChevronRight size={11} />
            </Link>
          }
        >
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
            {consumptionData.map((m, i) => {
              const Icon = m.name.includes('Villany') ? Zap : m.name.includes('Víz') ? Droplets : Flame;
              const iconBg = m.name.includes('Villany')
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : m.name.includes('Víz')
                  ? 'bg-gradient-to-br from-sky-400 to-cyan-500'
                  : 'bg-gradient-to-br from-rose-400 to-orange-500';
              const maxValue = Math.max(...consumptionData.map((c) => c.value || 1));
              return (
                <div
                  key={m.id}
                  className={classNames(
                    'flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors',
                    i > 0 && 'border-t border-border',
                  )}
                >
                  <div className={classNames('h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-white shadow-sm', iconBg)}>
                    <Icon size={14} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0 mr-2">
                        <span className="text-xs font-medium text-foreground block truncate">{m.name}</span>
                        {m.location && (
                          <span className="text-[0.65rem] text-muted-foreground truncate block">{m.location}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                        {m.value}
                        <span className="text-[0.65rem] font-normal text-muted-foreground ml-0.5">{m.unit}</span>
                      </span>
                    </div>
                    <ProgressBar
                      value={m.value}
                      max={maxValue}
                      barClassName={
                        m.name.includes('Villany')
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : m.name.includes('Víz')
                            ? 'bg-gradient-to-r from-sky-400 to-cyan-500'
                            : 'bg-gradient-to-r from-rose-400 to-orange-500'
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {canUse('savings') && (
        <Section
          title="Állampapír kifizetések"
          description="Soron következő kamatok"
          action={
            <span className="text-xs font-medium text-emerald-600 tabular-nums">
              ∑ {formatHUF(totalInvestmentsValue)}
            </span>
          }
        >
          {investments.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="Nincs aktív állampapír"
              action={
                <Link href="/budget" className="text-xs font-medium text-primary hover:underline">
                  Befektetések →
                </Link>
              }
            />
          ) : investmentPayouts.length === 0 ? (
            <EmptyState icon={Calendar} title="Nincs ütemezett kifizetés" description="Nem ismert következő kamatkifizetési dátum." />
          ) : (
            <DataList className="shadow-soft">
              {investmentPayouts.slice(0, 4).map((p, idx) => (
                <DataRow
                  key={idx}
                  leading={
                    <div className="h-9 w-9 shrink-0 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-sm">
                      <PiggyBank size={14} strokeWidth={2.2} />
                    </div>
                  }
                  title={p.invName}
                  subtitle={`${p.owner} · ${p.label}`}
                  trailing={
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="text-sm font-semibold text-emerald-600 tabular-nums">+{formatHUF(p.amount)}</div>
                      <div className="text-[0.65rem] text-muted-foreground tabular-nums">
                        {p.date ? p.date.replace(/-/g, '.') : 'Lejáratkor'}
                      </div>
                    </div>
                  }
                />
              ))}
            </DataList>
          )}
        </Section>
      )}
    </div>
  );
}
