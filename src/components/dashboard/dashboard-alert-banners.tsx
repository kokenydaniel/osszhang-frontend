import Link from 'next/link';
import { formatHUF } from '@/utils';
import { AccentPanel } from '@/components/design';
import { AlertCircle, ChevronRight, Users } from 'lucide-react';
import type { UtilityBill } from '@/types';
import type { DashboardModuleAccess } from '@/helpers/dashboard-types';
import type { MissedIncomeSummary } from '@/calculations/budget-income';
import { DashboardMissedIncomeBanner } from '@/components/budget/budget-missed-income-banner';

type Props = {
  overdueUnpaidBills: UtilityBill[];
  missedIncomeSummary: MissedIncomeSummary | null;
  canUse: DashboardModuleAccess;
  utilitySplitEnabled: boolean;
  rezsiBalance: number;
  counterpartyLabel: string;
};

export function DashboardAlertBanners({
  overdueUnpaidBills,
  missedIncomeSummary,
  canUse,
  utilitySplitEnabled,
  rezsiBalance,
  counterpartyLabel,
}: Props) {
  const showMissedIncome = !!missedIncomeSummary && canUse('budget');
  const showUtilities =
    (overdueUnpaidBills.length > 0 && canUse('utilities')) ||
    (utilitySplitEnabled && rezsiBalance !== 0 && canUse('utilities'));

  if (!showMissedIncome && !showUtilities) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {showMissedIncome && <DashboardMissedIncomeBanner summary={missedIncomeSummary} />}
      {overdueUnpaidBills.length > 0 && canUse('utilities') && (
        <AccentPanel tone="danger" icon={AlertCircle} title="Lejárt rezsi várakozik" description={`${overdueUnpaidBills.length} lejárt, kifizetetlen rezsi-tétel`}>
          Kattints a tételre a kifizetés rögzítéséhez lent.
        </AccentPanel>
      )}
      {utilitySplitEnabled && rezsiBalance !== 0 && canUse('utilities') && (
        <AccentPanel
          tone={rezsiBalance < 0 ? 'warning' : 'success'}
          icon={Users}
          title={rezsiBalance < 0 ? `Tartozásod van — ${counterpartyLabel}` : `${counterpartyLabel} tartozik neked`}
          description={`Aktuális rezsi-egyenleg: ${formatHUF(Math.abs(rezsiBalance))}`}
          action={
            <Link href="/utilities" className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5">
              Részletek <ChevronRight size={11} />
            </Link>
          }
        >
          <span className="tabular-nums text-lg font-semibold text-foreground">{formatHUF(Math.abs(rezsiBalance))}</span>
        </AccentPanel>
      )}
    </div>
  );
}
