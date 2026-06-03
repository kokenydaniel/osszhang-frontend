import type { MetricItem } from '@/components/design';
import { Building2, CalendarClock, CircleDollarSign, Hammer, Wallet } from 'lucide-react';
import { formatHUF, formatMonthYear } from '@/utils';
import { formatDate } from '@/utils/dates';
import { yearMonthPrefix } from '@/utils/dates';
import { RENTAL_EXPENSE_TYPE_LABELS } from '@/config/rental-expense-types';
import type {
  RentalContractEndReminder,
  RentalExpense,
  RentalIncomeEntry,
  RentalOverdueRent,
  RentalProperty,
  RentalSummary,
} from '@/types/rental';

export type RentalPropertyFormValues = {
  name: string;
  address: string;
  monthlyRent: string;
  monthlyCommonCost: string;
  currency: string;
  tenantName: string;
  dueDay: string;
  notes: string;
  agreementNotes: string;
  contractEndsAt: string;
  isActive: boolean;
  budgetSyncEnabled: boolean;
};

export type RentalIncomeFormValues = {
  rentalPropertyId: string;
  rentAmount: string;
  commonCostAmount: string;
  amount: string;
  currency: string;
  dueDate: string;
  paidDate: string;
  note: string;
};

export type RentalExpenseFormValues = {
  rentalPropertyId: string;
  expenseType: string;
  amount: string;
  currency: string;
  expenseDate: string;
  note: string;
};

function formatMoney(amount: number, currency: string): string {
  if (currency === 'HUF') return formatHUF(amount);
  return `${amount.toLocaleString('hu-HU', { maximumFractionDigits: 2 })} ${currency}`;
}

export const rentalCalculations = {
  formatMoney,

  propertyById(properties: RentalProperty[], id: number): RentalProperty | undefined {
    return properties.find((p) => p.id === id);
  },

  entriesForMonth(entries: RentalIncomeEntry[], year: number, month: number): RentalIncomeEntry[] {
    return entries.filter((e) => e.periodYear === year && e.periodMonth === month);
  },

  buildMetricStrip(summary: RentalSummary, defaultCurrency: string): MetricItem[] {
    const fmt = (n: number) => formatMoney(n, defaultCurrency);
    const expectedGross = summary.expectedGross ?? summary.expectedRent + summary.expectedCommonCost;
    return [
      {
        label: 'Várható bérleti díj',
        value: fmt(summary.expectedRent ?? expectedGross),
        hint: `Bruttó (bérlet + áthárítás): ${fmt(expectedGross)}`,
        icon: CircleDollarSign,
      },
      {
        label: 'Befolyt',
        value: fmt(summary.received),
        hint: `${summary.paidCount} befizetés · ${summary.unpaidCount ?? 0} várakozik`,
        icon: Wallet,
      },
      {
        label: 'Hátralék',
        value: fmt(summary.outstanding),
        hint:
          summary.outstanding > 0
            ? 'Várható − befolyt'
            : summary.outstanding === 0
              ? 'Egyezik a várhatóval'
              : 'Túlfizetés / többlet',
        icon: Building2,
      },
      {
        label: 'Tulajdonosi költség',
        value: fmt(summary.ownerExpenses ?? 0),
        hint: 'Felújítás, karbantartás, közös ktg. (tőled)',
        icon: Hammer,
      },
    ];
  },

  emptyPropertyValues(defaultCurrency: string, budgetSyncDefault: boolean): RentalPropertyFormValues {
    return {
      name: '',
      address: '',
      monthlyRent: '',
      monthlyCommonCost: '0',
      currency: defaultCurrency,
      tenantName: '',
      dueDay: '5',
      notes: '',
      agreementNotes: '',
      contractEndsAt: '',
      isActive: true,
      budgetSyncEnabled: budgetSyncDefault,
    };
  },

  valuesFromProperty(property: RentalProperty): RentalPropertyFormValues {
    return {
      name: property.name,
      address: property.address ?? '',
      monthlyRent: String(property.monthlyRent || ''),
      monthlyCommonCost: String(property.monthlyCommonCost || 0),
      currency: property.currency,
      tenantName: property.tenantName ?? '',
      dueDay: String(property.dueDay ?? 5),
      notes: property.notes ?? '',
      agreementNotes: property.agreementNotes ?? '',
      contractEndsAt: property.contractEndsAt ?? '',
      isActive: property.isActive,
      budgetSyncEnabled: property.budgetSyncEnabled,
    };
  },

  payloadFromProperty(values: RentalPropertyFormValues): Record<string, unknown> {
    return {
      name: values.name.trim(),
      address: values.address.trim() || null,
      monthlyRent: Number(values.monthlyRent) || 0,
      monthlyCommonCost: Number(values.monthlyCommonCost) || 0,
      currency: values.currency,
      tenantName: values.tenantName.trim() || null,
      dueDay: Math.min(28, Math.max(1, Number(values.dueDay) || 5)),
      notes: values.notes.trim() || null,
      agreementNotes: values.agreementNotes.trim() || null,
      contractEndsAt: values.contractEndsAt || null,
      isActive: values.isActive,
      budgetSyncEnabled: values.budgetSyncEnabled,
    };
  },

  dueDateForProperty(property: RentalProperty, year: number, month: number): string {
    const day = Math.min(Math.max(property.dueDay ?? 5, 1), 28);
    return `${yearMonthPrefix(year, month)}-${String(day).padStart(2, '0')}`;
  },

  emptyIncomeValues(
    property: RentalProperty | undefined,
    defaultCurrency: string,
    year: number,
    month: number,
  ): RentalIncomeFormValues {
    const rent = property?.monthlyRent ?? 0;
    const common = property?.monthlyCommonCost ?? 0;
    return {
      rentalPropertyId: property ? String(property.id) : '',
      rentAmount: String(rent),
      commonCostAmount: String(common),
      amount: String(rent + common),
      currency: property?.currency ?? defaultCurrency,
      dueDate: property ? rentalCalculations.dueDateForProperty(property, year, month) : '',
      paidDate: '',
      note: '',
    };
  },

  valuesFromIncome(entry: RentalIncomeEntry): RentalIncomeFormValues {
    return {
      rentalPropertyId: String(entry.rentalPropertyId),
      rentAmount: String(entry.rentAmount ?? entry.amount),
      commonCostAmount: String(entry.commonCostAmount ?? 0),
      amount: String(entry.amount),
      currency: entry.currency,
      dueDate: entry.dueDate ?? '',
      paidDate: entry.paidDate ?? '',
      note: entry.note ?? '',
    };
  },

  payloadFromIncome(
    values: RentalIncomeFormValues,
    year: number,
    month: number,
  ): Record<string, unknown> {
    const rent = Number(values.rentAmount) || 0;
    const common = Number(values.commonCostAmount) || 0;
    const amount = Number(values.amount) || rent + common;
    return {
      rentalPropertyId: Number(values.rentalPropertyId),
      rentAmount: rent,
      commonCostAmount: common,
      amount,
      currency: values.currency,
      periodYear: year,
      periodMonth: month,
      dueDate: values.dueDate || null,
      paidDate: values.paidDate || null,
      note: values.note.trim() || null,
    };
  },

  emptyExpenseValues(property: RentalProperty | undefined, defaultCurrency: string): RentalExpenseFormValues {
    return {
      rentalPropertyId: property ? String(property.id) : '',
      expenseType: 'maintenance',
      amount: '',
      currency: property?.currency ?? defaultCurrency,
      expenseDate: new Date().toISOString().slice(0, 10),
      note: '',
    };
  },

  valuesFromExpense(expense: RentalExpense): RentalExpenseFormValues {
    return {
      rentalPropertyId: String(expense.rentalPropertyId),
      expenseType: expense.expenseType,
      amount: String(expense.amount),
      currency: expense.currency,
      expenseDate: expense.expenseDate,
      note: expense.note ?? '',
    };
  },

  payloadFromExpense(values: RentalExpenseFormValues): Record<string, unknown> {
    return {
      rentalPropertyId: Number(values.rentalPropertyId),
      expenseType: values.expenseType,
      amount: Number(values.amount) || 0,
      currency: values.currency,
      expenseDate: values.expenseDate,
      note: values.note.trim() || null,
    };
  },

  expenseTypeLabel(type: string): string {
    return RENTAL_EXPENSE_TYPE_LABELS[type] ?? type;
  },

  expensesForYear(expenses: RentalExpense[], year: number): RentalExpense[] {
    const prefix = `${year}-`;
    return expenses.filter((e) => e.expenseDate.startsWith(prefix));
  },

  formatOverdueLine(item: RentalOverdueRent): string {
    const tenant = item.tenantName ? ` (${item.tenantName})` : '';
    const sumLabel = item.isPartial ? 'hátralék' : 'esedékes összeg';
    return `${item.name}${tenant}: ${formatMoney(item.amount, item.currency)} ${sumLabel} — határidő ${formatDate(item.dueDate)} (${item.daysOverdue} napja lejárt)`;
  },

  formatContractReminder(item: RentalContractEndReminder): string {
    const date = item.contractEndsAt;
    if (item.overdue) {
      return `${item.name}: szerződés lejárt (${date})`;
    }
    if (item.daysLeft === 0) {
      return `${item.name}: ma jár le a szerződés`;
    }
    return `${item.name}: szerződés ${date}-ig (${item.daysLeft} nap)`;
  },

  periodLabel(month: number, year: number): string {
    return formatMonthYear(month, year);
  },
};
