import type { MetricItem } from '@/components/design';
import { CalendarClock, Shield, Wallet } from 'lucide-react';
import { paymentFrequencyMonths } from '@/helpers/insurance-budget';
import type {
  InsurancePaymentFrequency,
  InsurancePolicy,
  InsurancePolicyFormValues,
  InsuranceUpcomingReminder,
} from '@/types/insurance';
import { formatCurrency, today as todayIso } from '@/utils';
import { DATE_FORMAT, toDayjs } from '@/utils/dates';

function sanitizeOptionalDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = toDayjs(trimmed);
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : null;
}

function formatPremium(amount: number, currency: string): string {
  return formatCurrency(amount, currency);
}

export function periodsPerYear(freq: InsurancePaymentFrequency): number {
  return Math.max(1, Math.round(12 / paymentFrequencyMonths(freq)));
}

export function isPolicyEffectivelyActive(
  policy: Pick<InsurancePolicy, 'isActive' | 'coveredUntil'>,
): boolean {
  if (!policy.isActive) return false;
  if (policy.coveredUntil && policy.coveredUntil < todayIso()) return false;
  return true;
}

export function policyStatusLabel(policy: Pick<InsurancePolicy, 'isActive' | 'coveredUntil'>): string {
  if (!policy.isActive) return 'Megszűnt';
  if (policy.coveredUntil && policy.coveredUntil < todayIso()) return 'Lejárt';
  return 'Aktív';
}

export function effectiveAnnualPremium(policy: Pick<
  InsurancePolicy,
  'premiumFree' | 'paymentAmount' | 'paymentFrequency' | 'annualPremium'
>): number {
  if (policy.premiumFree) return 0;
  if (policy.paymentAmount > 0) {
    return policy.paymentAmount * periodsPerYear(policy.paymentFrequency);
  }
  return policy.annualPremium;
}

export type InsuranceSummary = {
  activeCount: number;
  inactiveCount: number;
  totalAnnualActive: number;
  totalMonthlyActive: number;
  upcomingCount: number;
  totalFundValue: number;
};

export const insuranceCalculations = {
  formatPremium,
  periodsPerYear,
  isPolicyEffectivelyActive,
  policyStatusLabel,
  effectiveAnnualPremium,

  emptyFormValues(defaultCurrency: string, budgetSyncDefault = false): InsurancePolicyFormValues {
    const now = new Date();
    return {
      name: '',
      insurer: '',
      policyKind: 'general',
      annualPremium: '',
      fundValue: '',
      premiumFree: false,
      paymentFrequency: 'annual',
      paymentAmount: '',
      currency: defaultCurrency,
      renewalDate: '',
      coveredUntil: '',
      notes: '',
      isActive: true,
      budgetSyncEnabled: budgetSyncDefault,
      budgetStartMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      budgetDueDay: '1',
    };
  },

  valuesFromPolicy(policy: InsurancePolicy): InsurancePolicyFormValues {
    const start =
      policy.budgetStartYear && policy.budgetStartMonth
        ? `${policy.budgetStartYear}-${String(policy.budgetStartMonth).padStart(2, '0')}`
        : '';
    return {
      name: policy.name,
      insurer: policy.insurer ?? '',
      policyKind: policy.policyKind,
      annualPremium: policy.annualPremium > 0 ? String(policy.annualPremium) : '',
      fundValue: policy.fundValue != null && policy.fundValue > 0 ? String(policy.fundValue) : '',
      premiumFree: policy.premiumFree,
      paymentFrequency: policy.paymentFrequency,
      paymentAmount: policy.paymentAmount > 0 ? String(policy.paymentAmount) : '',
      currency: policy.currency,
      renewalDate: policy.renewalDate ?? '',
      coveredUntil: policy.coveredUntil ?? '',
      notes: policy.notes ?? '',
      isActive: policy.isActive,
      budgetSyncEnabled: policy.budgetSyncEnabled,
      budgetStartMonth: start,
      budgetDueDay: policy.budgetDueDay ? String(policy.budgetDueDay) : '1',
    };
  },

  payloadFromForm(values: InsurancePolicyFormValues): Record<string, unknown> {
    const premiumFree = values.premiumFree;
    const paymentAmount = premiumFree ? 0 : Math.max(0, Number(values.paymentAmount) || 0);
    const annualFromField = Math.max(0, Number(values.annualPremium) || 0);
    const annual =
      premiumFree
        ? 0
        : paymentAmount > 0
          ? paymentAmount * periodsPerYear(values.paymentFrequency)
          : annualFromField;

    const [startYear, startMonth] = values.budgetStartMonth
      ? values.budgetStartMonth.split('-').map(Number)
      : [null, null];

    const budgetSync =
      !premiumFree &&
      values.budgetSyncEnabled &&
      paymentAmount > 0 &&
      !!startYear &&
      !!startMonth;

    return {
      name: values.name.trim(),
      insurer: values.insurer.trim() || null,
      policyKind: values.policyKind,
      fundValue: values.policyKind === 'life_investment' ? Math.max(0, Number(values.fundValue) || 0) : null,
      premiumFree,
      paymentFrequency: values.paymentFrequency,
      paymentAmount,
      annualPremium: annual,
      currency: values.currency.trim().toUpperCase() || 'HUF',
      renewalDate: sanitizeOptionalDate(values.renewalDate),
      coveredUntil: sanitizeOptionalDate(values.coveredUntil),
      notes: values.notes.trim() || null,
      isActive: (() => {
        const covered = sanitizeOptionalDate(values.coveredUntil);
        if (covered && covered < todayIso()) return false;
        return values.isActive;
      })(),
      budgetSyncEnabled: budgetSync,
      budgetStartYear: budgetSync && startYear ? startYear : null,
      budgetStartMonth: budgetSync && startMonth ? startMonth : null,
      budgetDueDay: budgetSync ? Math.min(28, Math.max(1, Number(values.budgetDueDay) || 1)) : null,
    };
  },

  buildSummary(
    policies: InsurancePolicy[],
    upcoming: InsuranceUpcomingReminder[],
  ): InsuranceSummary {
    const active = policies.filter((p) => isPolicyEffectivelyActive(p));
    const totalAnnual = active.reduce((s, p) => s + effectiveAnnualPremium(p), 0);
    const totalFund = active
      .filter((p) => p.policyKind === 'life_investment' && p.fundValue != null)
      .reduce((s, p) => s + (p.fundValue ?? 0), 0);

    return {
      activeCount: active.length,
      inactiveCount: policies.length - active.length,
      totalAnnualActive: Math.round(totalAnnual),
      totalMonthlyActive: totalAnnual > 0 ? Math.round(totalAnnual / 12) : 0,
      upcomingCount: upcoming.length,
      totalFundValue: Math.round(totalFund),
    };
  },

  buildMetricStrip(summary: InsuranceSummary, defaultCurrency: string): MetricItem[] {
    const items: MetricItem[] = [
      {
        label: 'Aktív szerződés',
        value: String(summary.activeCount),
        icon: Shield,
        tone: 'primary',
      },
    ];

    if (summary.totalFundValue > 0) {
      items.push({
        label: 'Befektetési érték',
        value: formatPremium(summary.totalFundValue, defaultCurrency),
        icon: Wallet,
        tone: 'info',
      });
    }

    items.push(
      {
        label: 'Éves díj (aktív)',
        value: formatPremium(summary.totalAnnualActive, defaultCurrency),
        icon: Wallet,
        tone: 'success',
      },
      {
        label: 'Becsült havi díj',
        value: formatPremium(summary.totalMonthlyActive, defaultCurrency),
        icon: Wallet,
        tone: 'default',
      },
      {
        label: 'Közelgő esemény',
        value: String(summary.upcomingCount),
        icon: CalendarClock,
        tone: summary.upcomingCount > 0 ? 'warning' : 'default',
      },
    );

    return items;
  },

  formatReminderLine(reminder: InsuranceUpcomingReminder): string {
    const date = reminder.date.replace(/-/g, '.');
    if (reminder.overdue) {
      return `${reminder.policyName} — ${reminder.kindLabel}: ${date} (lejárt)`;
    }
    if (reminder.daysUntil === 0) {
      return `${reminder.policyName} — ${reminder.kindLabel}: ma (${date})`;
    }
    if (reminder.daysUntil === 1) {
      return `${reminder.policyName} — ${reminder.kindLabel}: holnap (${date})`;
    }
    return `${reminder.policyName} — ${reminder.kindLabel}: ${reminder.daysUntil} nap (${date})`;
  },
};
