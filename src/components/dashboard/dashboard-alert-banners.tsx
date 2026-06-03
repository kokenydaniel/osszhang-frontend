import Link from 'next/link';
import { formatHUF } from '@/utils';
import { AccentPanel } from '@/components/design';
import { AlertCircle, ChevronRight, Users } from 'lucide-react';
import type { UtilityBill } from '@/types';
import type { DashboardModuleAccess } from '@/helpers/dashboard-types';
import type { MissedIncomeSummary } from '@/calculations/budget-income';
import { DashboardMissedIncomeBanner } from '@/components/budget/budget-missed-income-banner';
import { DashboardInsuranceReminder } from './dashboard-insurance-reminder-link';
import { DashboardPocketMoneyInterestBanner } from './dashboard-pocket-money-interest-banner';
import { DashboardMetersAnomalyBanner } from './dashboard-meters-anomaly-banner';
import { DashboardBusinessTaxBanner } from './dashboard-business-tax-banner';
import type { DashboardPocketMoneyInterestAlert } from '@/helpers/dashboard-pocket-money-alert';
import type { DashboardBusinessTaxAlert } from '@/helpers/dashboard-business-tax-alert';
import type { InsuranceUpcomingReminder } from '@/types/insurance';
import type { RentalOverdueRent } from '@/types/rental';
import type { AiUtilityAnomalies } from '@/types';
import { DashboardRentalOverdueLink } from './dashboard-rental-overdue-link';

type Props = {
  overdueUnpaidBills: UtilityBill[];
  missedIncomeSummary: MissedIncomeSummary | null;
  canUse: DashboardModuleAccess;
  utilitySplitEnabled: boolean;
  rezsiBalance: number;
  counterpartyLabel: string;
  insuranceUpcoming: InsuranceUpcomingReminder[];
  insuranceReminderDays: number;
  rentalOverdueRents: RentalOverdueRent[];
  rentalOverdueGraceDays: number;
  pocketMoneyInterestAlert: DashboardPocketMoneyInterestAlert | null;
  businessTaxAlert: DashboardBusinessTaxAlert | null;
  aiUtilityAnomalies: AiUtilityAnomalies | null;
  canUseAi: boolean;
  financialDataReady: boolean;
};

export function DashboardAlertBanners({
  overdueUnpaidBills,
  missedIncomeSummary,
  canUse,
  utilitySplitEnabled,
  rezsiBalance,
  counterpartyLabel,
  insuranceUpcoming,
  insuranceReminderDays,
  rentalOverdueRents,
  rentalOverdueGraceDays,
  pocketMoneyInterestAlert,
  businessTaxAlert,
  aiUtilityAnomalies,
  canUseAi,
  financialDataReady,
}: Props) {
  if (!financialDataReady) {
    return null;
  }

  const showMissedIncome = !!missedIncomeSummary && canUse('budget');
  const showUtilitiesOverdue = overdueUnpaidBills.length > 0 && canUse('utilities');
  const showUtilitiesSplit =
    utilitySplitEnabled && rezsiBalance !== 0 && canUse('utilities');
  const showInsurance = insuranceUpcoming.length > 0 && canUse('insurance');
  const showRentalOverdue = rentalOverdueRents.length > 0 && canUse('rental');
  const showPocketMoney = !!pocketMoneyInterestAlert && canUse('pocket_money');
  const showBusinessTax = !!businessTaxAlert && canUse('business');
  const showMetersAnomalies =
    canUseAi &&
    canUse('meters') &&
    !!aiUtilityAnomalies?.anomalies?.length;

  const hasAny =
    showMissedIncome ||
    showUtilitiesOverdue ||
    showUtilitiesSplit ||
    showInsurance ||
    showRentalOverdue ||
    showPocketMoney ||
    showBusinessTax ||
    showMetersAnomalies;

  if (!hasAny) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {showMissedIncome && <DashboardMissedIncomeBanner summary={missedIncomeSummary} />}
      {showUtilitiesOverdue && (
        <AccentPanel
          tone="danger"
          icon={AlertCircle}
          title="Lejárt rezsi várakozik"
          description={`${overdueUnpaidBills.length} lejárt, kifizetetlen rezsi-tétel`}
          action={
            <Link
              href="/utilities"
              className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
            >
              Rezsi <ChevronRight size={11} />
            </Link>
          }
        >
          Kattints a tételre a kifizetés rögzítéséhez lent, vagy menj a Rezsi oldalra.
        </AccentPanel>
      )}
      {showUtilitiesSplit && (
        <AccentPanel
          tone={rezsiBalance < 0 ? 'warning' : 'success'}
          icon={Users}
          title={rezsiBalance < 0 ? `Tartozásod van — ${counterpartyLabel}` : `${counterpartyLabel} tartozik neked`}
          description={`Aktuális rezsi-egyenleg: ${formatHUF(Math.abs(rezsiBalance))}`}
          action={
            <Link
              href="/utilities"
              className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
            >
              Részletek <ChevronRight size={11} />
            </Link>
          }
        >
          <span className="tabular-nums text-lg font-semibold text-foreground">
            {formatHUF(Math.abs(rezsiBalance))}
          </span>
        </AccentPanel>
      )}
      {showRentalOverdue && (
        <DashboardRentalOverdueLink
          overdueRents={rentalOverdueRents}
          graceDays={rentalOverdueGraceDays}
        />
      )}
      {showInsurance && (
        <DashboardInsuranceReminder
          upcoming={insuranceUpcoming}
          reminderDays={insuranceReminderDays}
        />
      )}
      {showPocketMoney && <DashboardPocketMoneyInterestBanner alert={pocketMoneyInterestAlert} />}
      {showBusinessTax && <DashboardBusinessTaxBanner alert={businessTaxAlert} />}
      {showMetersAnomalies && aiUtilityAnomalies && (
        <DashboardMetersAnomalyBanner anomalies={aiUtilityAnomalies} />
      )}
    </div>
  );
}
