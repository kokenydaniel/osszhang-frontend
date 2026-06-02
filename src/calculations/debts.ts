import type { Debt, AiDebtPlan } from '@/types';
import type { CreateDebtPayload, UpdateDebtPayload } from '@/types/debts';
import { dayjs, toDayjs, today } from '@/utils/dates';
import { formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import type { MetricItem } from '@/components/design';
import { CalendarDays, CreditCard, Target, TrendingDown } from 'lucide-react';

export interface PayoffResult {
  months: number | null;
  payoffDate: string | null;
  totalInterest: number | null;
  minimumViablePayment: number;
  isUnderwater: boolean;
}

export interface AccelerationResult {
  monthsSaved: number;
  interestSaved: number;
  newPayoffDate: string;
  newTotalMonths: number;
}

export type DebtWithPayoff = Debt & { remaining: number; payoff: PayoffResult };

export interface DebtsSummaryMetrics {
  totalDebt: number;
  totalTarget: number;
  totalPaid: number;
  progressPercent: number;
  monthlyMinimum: number;
  farthestPayoff: { date: string | null; underwaterCount: number } | null;
  totalInterestRemaining: number;
}

export interface DebtFormFields {
  name: string;
  targetAmount: string;
  paidAmount: string;
  annualInterestRate: string;
  minimumPayment: string;
  dueDay: string;
  budgetSyncEnabled: boolean;
  budgetStartMonth: string;
}

function monthsFromNow(months: number): string {
  return dayjs().add(months, 'month').format('YYYY-MM-DD');
}

export const debtsCalculations = {
  remaining(debt: Pick<Debt, 'targetAmount' | 'paidAmount'>): number {
    return Math.max(0, Number(debt.targetAmount) - Number(debt.paidAmount));
  },

  deriveStatus(paidAmount: number, targetAmount: number): Debt['status'] {
    return paidAmount >= targetAmount ? 'Maradt' : 'Van még';
  },

  computePayoff(
    remaining: number,
    annualRatePercent: number | null | undefined,
    monthlyPayment: number | null | undefined,
  ): PayoffResult {
    const P = Math.max(0, Number(remaining) || 0);
    const apr = Math.max(0, Number(annualRatePercent) || 0);
    const M = Math.max(0, Number(monthlyPayment) || 0);
    const r = apr / 100 / 12;

    const minimumViablePayment = r > 0 ? Math.ceil(P * r) + 1 : 0;

    if (P <= 0) {
      return { months: 0, payoffDate: today(), totalInterest: 0, minimumViablePayment, isUnderwater: false };
    }
    if (M <= 0) {
      return { months: null, payoffDate: null, totalInterest: null, minimumViablePayment, isUnderwater: true };
    }
    if (r === 0) {
      const n = Math.ceil(P / M);
      return {
        months: n,
        payoffDate: monthsFromNow(n),
        totalInterest: 0,
        minimumViablePayment: 0,
        isUnderwater: false,
      };
    }

    const monthlyInterest = P * r;
    if (M <= monthlyInterest) {
      return { months: null, payoffDate: null, totalInterest: null, minimumViablePayment, isUnderwater: true };
    }

    const n = -Math.log(1 - (P * r) / M) / Math.log(1 + r);
    const months = Math.ceil(n);
    const totalInterest = Math.round(months * M - P);

    return {
      months,
      payoffDate: monthsFromNow(months),
      totalInterest,
      minimumViablePayment,
      isUnderwater: false,
    };
  },

  computeAcceleration(
    remaining: number,
    annualRatePercent: number | null | undefined,
    monthlyPayment: number | null | undefined,
    extraMonthly: number,
  ): AccelerationResult | null {
    const base = debtsCalculations.computePayoff(remaining, annualRatePercent, monthlyPayment);
    if (!base.months || base.totalInterest === null) return null;
    const accelerated = debtsCalculations.computePayoff(
      remaining,
      annualRatePercent,
      (monthlyPayment || 0) + extraMonthly,
    );
    if (!accelerated.months || accelerated.totalInterest === null) return null;
    return {
      monthsSaved: Math.max(0, base.months - accelerated.months),
      interestSaved: Math.max(0, base.totalInterest - accelerated.totalInterest),
      newPayoffDate: accelerated.payoffDate!,
      newTotalMonths: accelerated.months,
    };
  },

  formatPayoffDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return toDayjs(iso).format('YYYY. MMM');
  },

  formatTerm(months: number | null | undefined): string {
    if (!months || months <= 0) return '—';
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    if (years === 0) return `${months} hó`;
    if (remainder === 0) return `${years} év`;
    return `${years} év ${remainder} hó`;
  },

  enrichWithPayoff(debts: Debt[]): DebtWithPayoff[] {
    return debts
      .map((debt) => {
        const remaining = debtsCalculations.remaining(debt);
        const payoff = debtsCalculations.computePayoff(remaining, debt.annualInterestRate, debt.minimumPayment);
        return { ...debt, remaining, payoff };
      })
      .filter((debt) => debt.remaining > 0);
  },

  buildSummaryMetrics(debts: Debt[], debtsWithPayoff: DebtWithPayoff[]): DebtsSummaryMetrics {
    const totalDebt = debtsWithPayoff.reduce((s, d) => s + d.remaining, 0);
    const totalTarget = debts.reduce((s, d) => s + Number(d.targetAmount), 0);
    const totalPaid = debts.reduce((s, d) => s + Number(d.paidAmount), 0);
    const progressPercent = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
    const monthlyMinimum = debts.reduce((s, d) => s + (Number(d.minimumPayment) || 0), 0);

    let farthestPayoff: DebtsSummaryMetrics['farthestPayoff'] = null;
    if (debtsWithPayoff.length > 0) {
      let maxDate = '';
      let underwaterCount = 0;
      for (const debt of debtsWithPayoff) {
        if (debt.payoff.isUnderwater) underwaterCount++;
        else if (debt.payoff.payoffDate && debt.payoff.payoffDate > maxDate) maxDate = debt.payoff.payoffDate;
      }
      farthestPayoff = { date: maxDate || null, underwaterCount };
    }

    const totalInterestRemaining = debtsWithPayoff.reduce(
      (s, d) => s + (typeof d.payoff.totalInterest === 'number' ? d.payoff.totalInterest : 0),
      0,
    );

    return {
      totalDebt,
      totalTarget,
      totalPaid,
      progressPercent,
      monthlyMinimum,
      farthestPayoff,
      totalInterestRemaining,
    };
  },

  buildMetricStrip(
    summary: DebtsSummaryMetrics,
    activeDebtCount: number,
  ): MetricItem[] {
    const { totalDebt, totalTarget, totalPaid, progressPercent, monthlyMinimum, farthestPayoff, totalInterestRemaining } =
      summary;

    return [
      {
        label: 'Hátralévő',
        value: formatHUF(totalDebt),
        info: HELP.debts.remaining,
        hint: `${activeDebtCount} aktív tartozás`,
        icon: TrendingDown,
        tone: totalDebt > 0 ? 'warning' : 'success',
        emphasis: true,
      },
      {
        label: 'Havi törlesztés',
        value: formatHUF(monthlyMinimum),
        info: HELP.debts.monthlyMin,
        hint: 'Összes havi minimum',
        icon: CreditCard,
        tone: 'primary',
      },
      {
        label: 'Becsült befejezés',
        value: farthestPayoff?.date ? debtsCalculations.formatPayoffDate(farthestPayoff.date) : '—',
        info: HELP.debts.payoffEstimate,
        hint:
          (farthestPayoff?.underwaterCount ?? 0) > 0
            ? `${farthestPayoff?.underwaterCount} hitelnél a havi nem fedi a kamatot`
            : 'Ha csak a minimumot fizeted',
        icon: CalendarDays,
        tone: (farthestPayoff?.underwaterCount ?? 0) > 0 ? 'danger' : 'info',
      },
      {
        label: 'Visszafizetve',
        value: `${progressPercent}%`,
        info: HELP.debts.progress,
        hint: `${formatHUF(totalPaid)} / ${formatHUF(totalTarget)}`,
        icon: Target,
        tone: progressPercent >= 75 ? 'success' : progressPercent >= 25 ? 'info' : 'default',
      },
    ];
  },

  orderByAiSchedule(debtsWithPayoff: DebtWithPayoff[], aiDebtPlan: AiDebtPlan | null): DebtWithPayoff[] {
    if (!aiDebtPlan?.schedule || aiDebtPlan.schedule.length === 0) return [];
    const byId = new Map(debtsWithPayoff.map((d) => [d.id, d]));
    return aiDebtPlan.schedule
      .map((s) => byId.get(s.debt_id))
      .filter((d): d is DebtWithPayoff => !!d);
  },

  parsePaymentAmount(raw: string): number | null {
    const amt = Number(String(raw).replace(',', '.'));
    return amt > 0 ? amt : null;
  },

  buildPaymentUpdate(debt: Debt, paymentAmount: number): UpdateDebtPayload {
    const newPaid = Number(debt.paidAmount) + paymentAmount;
    return {
      paidAmount: newPaid,
      status: debtsCalculations.deriveStatus(newPaid, Number(debt.targetAmount)),
    };
  },

  buildDebtFormPayload(fields: DebtFormFields): CreateDebtPayload {
    const paidAmount = Number(fields.paidAmount) || 0;
    const targetAmount = Number(fields.targetAmount);
    const [startYear, startMonth] = fields.budgetStartMonth
      ? fields.budgetStartMonth.split('-').map(Number)
      : [null, null];
    return {
      name: fields.name,
      targetAmount,
      paidAmount,
      annualInterestRate: fields.annualInterestRate ? Number(fields.annualInterestRate) : null,
      minimumPayment: fields.minimumPayment ? Number(fields.minimumPayment) : null,
      dueDay: fields.dueDay ? Number(fields.dueDay) : null,
      status: debtsCalculations.deriveStatus(paidAmount, targetAmount),
      budgetSyncEnabled: fields.budgetSyncEnabled && !!fields.minimumPayment,
      budgetStartYear: fields.budgetSyncEnabled && startYear ? startYear : null,
      budgetStartMonth: fields.budgetSyncEnabled && startMonth ? startMonth : null,
    };
  },
};
