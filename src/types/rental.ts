export type RentalProperty = {
  id: number;
  name: string;
  address: string | null;
  monthlyRent: number;
  monthlyCommonCost: number;
  currency: string;
  tenantName: string | null;
  dueDay: number;
  notes: string | null;
  agreementNotes: string | null;
  contractEndsAt: string | null;
  isActive: boolean;
  budgetSyncEnabled: boolean;
  attachmentCount: number;
};

export type RentalIncomeEntry = {
  id: number;
  rentalPropertyId: number;
  amount: number;
  rentAmount: number;
  commonCostAmount: number;
  currency: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string | null;
  paidDate: string | null;
  note: string | null;
};

export type RentalExpense = {
  id: number;
  rentalPropertyId: number;
  expenseType: string;
  amount: number;
  currency: string;
  expenseDate: string;
  note: string | null;
};

export type RentalSummary = {
  expectedRent: number;
  expectedCommonCost: number;
  expectedGross: number;
  commonCostTotal: number;
  expectedNet: number;
  ownerExpenses: number;
  received: number;
  outstanding: number;
  propertyCount: number;
  paidCount: number;
  recordedCount: number;
  unpaidCount: number;
};

export type RentalContractEndReminder = {
  propertyId: number;
  name: string;
  contractEndsAt: string;
  tenantName: string | null;
  overdue: boolean;
  daysLeft: number;
};

export type RentalOverdueRent = {
  propertyId: number;
  incomeEntryId: number | null;
  name: string;
  tenantName: string | null;
  dueDate: string;
  amount: number;
  currency: string;
  daysOverdue: number;
  isPartial?: boolean;
};

export type RentalIndexResponse = {
  properties: RentalProperty[];
  incomeEntries: RentalIncomeEntry[];
  expenses: RentalExpense[];
  summary: RentalSummary;
  upcomingContractEnds: RentalContractEndReminder[];
  overdueRents: RentalOverdueRent[];
  selectedYear: number;
  selectedMonth: number;
};
