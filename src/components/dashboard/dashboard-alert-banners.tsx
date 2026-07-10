import { useMemo } from 'react';
import Link from 'next/link';
import { AccentPanel } from '@/components/design';
import { AlertCircle, ChevronRight, Gauge } from 'lucide-react';
import type { UtilityBill, Meter } from '@/types';
import type { DashboardModuleAccess } from '@/helpers/dashboard-types';
import type { MissedIncomeSummary } from '@/calculations/budget-income';
import { DashboardMissedIncomeBanner } from '@/components/budget/budget-missed-income-banner';
import { DashboardInsuranceReminder } from './dashboard-insurance-reminder-link';
import { DashboardPocketMoneyInterestBanner } from './dashboard-pocket-money-interest-banner';
import { DashboardMetersAnomalyBanner } from './dashboard-meters-anomaly-banner';
import { DashboardBusinessTaxBanner } from './dashboard-business-tax-banner';
import { DashboardReceivablesBanner } from './dashboard-receivables-banner';
import { DashboardUtilitiesRezsiDebtBanner } from './dashboard-utilities-rezsi-debt-banner';
import type { DashboardPocketMoneyInterestAlert } from '@/helpers/dashboard-pocket-money-alert';
import type { DashboardBusinessTaxAlert } from '@/helpers/dashboard-business-tax-alert';
import type { InsuranceUpcomingReminder } from '@/types/insurance';
import type { RentalOverdueRent } from '@/types/rental';
import type { AiUtilityAnomalies } from '@/types';
import { DashboardRentalOverdueLink } from './dashboard-rental-overdue-link';
import { computeDashboardExpectedInflows } from '@/helpers/dashboard-expected-inflows';
import { DashboardExpectedInflowsSummary } from './dashboard-expected-inflows-summary';

type Props = {
  overdueUnpaidBills: UtilityBill[];
  missedIncomeSummary: MissedIncomeSummary | null;
  canUse: DashboardModuleAccess;
  utilitySplitEnabled: boolean;
  rezsiBalance: number;
  counterpartyLabel: string;
  receivablesOutstanding: number;
  receivablesOpenContactCount: number;
  insuranceUpcoming: InsuranceUpcomingReminder[];
  insuranceReminderDays: number;
  rentalOverdueRents: RentalOverdueRent[];
  rentalOverdueGraceDays: number;
  pocketMoneyInterestAlert: DashboardPocketMoneyInterestAlert | null;
  businessTaxAlert: DashboardBusinessTaxAlert | null;
  aiUtilityAnomalies: AiUtilityAnomalies | null;
  canLoadUtilityAnomalies: boolean;
  financialDataReady: boolean;
  missingMeters: Meter[];
};

export function DashboardAlertBanners({
  overdueUnpaidBills,
  missedIncomeSummary,
  canUse,
  utilitySplitEnabled,
  rezsiBalance,
  counterpartyLabel,
  receivablesOutstanding,
  receivablesOpenContactCount,
  insuranceUpcoming,
  insuranceReminderDays,
  rentalOverdueRents,
  rentalOverdueGraceDays,
  pocketMoneyInterestAlert,
  businessTaxAlert,
  aiUtilityAnomalies,
  canLoadUtilityAnomalies,
  financialDataReady,
  missingMeters,
}: Props) {
  if (!financialDataReady) {
    return null;
  }

  const showMissedIncome = !!missedIncomeSummary && canUse('budget');
  const showUtilitiesRezsiDebt = utilitySplitEnabled && rezsiBalance !== 0 && canUse('utilities');
  const showReceivables = receivablesOutstanding > 0.005 && canUse('receivables');
  const showUtilitiesOverdue = overdueUnpaidBills.length > 0 && canUse('utilities');
  const showInsurance = insuranceUpcoming.length > 0 && canUse('insurance');
  const showRentalOverdue = rentalOverdueRents.length > 0 && canUse('rental');
  const showPocketMoney = !!pocketMoneyInterestAlert && canUse('pocket_money');
  const showBusinessTax = !!businessTaxAlert && canUse('business');
  const showMetersAnomalies =
    canLoadUtilityAnomalies && !!aiUtilityAnomalies?.anomalies?.length;
  const showMissingMeters = missingMeters.length > 0 && canUse('utilities');

  const showFinancialRow = showMissedIncome || showUtilitiesRezsiDebt || showReceivables;

  const expectedInflows = useMemo(
    () =>
      computeDashboardExpectedInflows({
        showMissedIncome,
        missedIncomeSummary,
        showReceivables,
        receivablesOutstanding,
        showUtilitiesRezsiDebt,
        rezsiBalance,
        counterpartyLabel,
      }),
    [
      showMissedIncome,
      missedIncomeSummary,
      showReceivables,
      receivablesOutstanding,
      showUtilitiesRezsiDebt,
      rezsiBalance,
      counterpartyLabel,
    ],
  );

  const hasSecondary =
    showUtilitiesOverdue ||
    showInsurance ||
    showRentalOverdue ||
    showPocketMoney ||
    showBusinessTax ||
    showMetersAnomalies ||
    showMissingMeters;

  if (!showFinancialRow && !hasSecondary) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {showFinancialRow ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {expectedInflows && expectedInflows.lines.length >= 2 ? (
            <DashboardExpectedInflowsSummary summary={expectedInflows} />
          ) : null}
          {showMissedIncome ? <DashboardMissedIncomeBanner summary={missedIncomeSummary} /> : null}
          {showUtilitiesRezsiDebt ? (
            <DashboardUtilitiesRezsiDebtBanner
              rezsiBalance={rezsiBalance}
              counterpartyLabel={counterpartyLabel}
            />
          ) : null}
          {showReceivables ? (
            <DashboardReceivablesBanner
              totalOutstanding={receivablesOutstanding}
              openContactCount={receivablesOpenContactCount}
            />
          ) : null}
        </div>
      ) : null}

      {hasSecondary ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {showMissingMeters && (
            <AccentPanel
              tone="danger"
              icon={Gauge}
              title="Aktuális leolvasások esedékesek"
              description={`A beállításokban megadott leolvasási dátum elmúlt, és még ${missingMeters.length} db órához nem rögzítetted a tárgyhavi állást.`}
              action={
                <Link
                  href="/meters"
                  className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
                >
                  Mérőórák <ChevronRight size={11} />
                </Link>
              }
            >
              <ul className="space-y-1.5 mt-2">
                {missingMeters.map((m) => (
                  <li key={m.id} className="text-foreground/80 flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span><b className="font-medium text-foreground">{m.name}</b> ({m.location || 'Nincs helyszín'})</span>
                  </li>
                ))}
              </ul>
            </AccentPanel>
          )}
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
      ) : null}
    </div>
  );
}
