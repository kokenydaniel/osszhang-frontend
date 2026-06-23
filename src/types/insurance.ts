export type InsurancePolicyKind = 'general' | 'life_investment';

export type InsurancePaymentFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type InsurancePolicy = {
  id: number;
  name: string;
  insurer: string | null;
  policyKind: InsurancePolicyKind;
  annualPremium: number;
  monthlyPremium: number;
  fundValue: number | null;
  premiumFree: boolean;
  paymentFrequency: InsurancePaymentFrequency;
  paymentAmount: number;
  currency: string;
  renewalDate: string | null;
  coveredUntil: string | null;
  notes: string | null;
  isActive: boolean;
  budgetSyncEnabled: boolean;
  budgetStartYear: number | null;
  budgetStartMonth: number | null;
  budgetDueDay: number | null;
  paidBudgetPeriods: string[];
  attachmentCount: number;

  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InsuranceUpcomingReminder = {
  policyId: number;
  policyName: string;
  date: string;
  kind: 'renewal' | 'coverage_end';
  kindLabel: string;
  daysUntil: number;
  overdue: boolean;
};

export type InsuranceIndexResponse = {
  policies: InsurancePolicy[];

  budgetPolicies?: InsurancePolicy[];
  upcoming: InsuranceUpcomingReminder[];
};

export type InsurancePolicyFormValues = {
  name: string;
  insurer: string;
  policyKind: InsurancePolicyKind;
  annualPremium: string;
  fundValue: string;
  premiumFree: boolean;
  paymentFrequency: InsurancePaymentFrequency;
  paymentAmount: string;
  currency: string;
  renewalDate: string;
  coveredUntil: string;
  notes: string;
  isActive: boolean;
  budgetSyncEnabled: boolean;
  budgetStartMonth: string;
  budgetDueDay: string;
};
