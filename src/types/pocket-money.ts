export type PocketMoneyEntryType = 'allowance' | 'expense' | 'adjustment';

export type PocketMoneyRosterMember = {
  id: string;
  label: string;
  memberUserId: number | null;
  icon: string;
  /** Matrica háttér (#RRGGBB), üres = automatikus szín az ikon alapján. */
  stickerColor?: string | null;
  /** Ikon szín (#RRGGBB), üres = automatikus. */
  iconColor?: string | null;
};

export type PocketMoneyEntry = {
  id: number;
  memberLabel: string;
  memberUserId: number | null;
  entryType: PocketMoneyEntryType;
  amount: number;
  currency: string;
  entryDate: string;
  note: string | null;
  createdAt?: string;
};

export type PocketMoneyInterestBasis = 'no_expense' | 'remaining';

export type PocketMoneyInterestOn = 'balance' | 'month_allowance';

export type PocketMoneyInterestMeta = {
  enabled: boolean;
  ratePercent: number;
  on: PocketMoneyInterestOn;
  basis: PocketMoneyInterestBasis;
  previewAmount: number;
  eligible: boolean;
  applied: boolean;
  reason: string;
};

export type PocketMoneyMemberSummary = {
  memberKey: string;
  memberLabel: string;
  memberUserId: number | null;
  currency: string;
  /** Kumulatív egyenleg a kiválasztott hónap végéig. */
  balance: number;
  /** Hónap eleji egyenleg. */
  openingBalance: number;
  /** Az adott hónapban kiosztva. */
  allowanceTotal: number;
  /** Az adott hónapban elköltve. */
  expenseTotal: number;
  adjustmentTotal: number;
  /** Az adott hónapban rögzített kamat. */
  interestTotal: number;
  interest: PocketMoneyInterestMeta | null;
};

export type PocketMoneyDisplayMember = PocketMoneyMemberSummary & {
  rosterId: string | null;
  icon: string;
  stickerColor: string | null;
  iconColor: string | null;
};

export type PocketMoneyApplyInterestResult = {
  applied: number;
  entries: PocketMoneyEntry[];
};

export type PocketMoneyIndex = {
  entries: PocketMoneyEntry[];
  members: PocketMoneyMemberSummary[];
};

export type CreatePocketMoneyEntryPayload = {
  memberLabel: string;
  memberUserId?: number | null;
  entryType: PocketMoneyEntryType;
  amount: number;
  currency?: string;
  entryDate: string;
  note?: string | null;
};

export type UpdatePocketMoneyEntryPayload = Partial<CreatePocketMoneyEntryPayload>;
