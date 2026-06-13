import type { MetricItem } from '@/components/design';
import { Coins, PiggyBank, ShoppingBag, Wallet } from 'lucide-react';
import type {
  PocketMoneyDisplayMember,
  PocketMoneyEntry,
  PocketMoneyEntryType,
  PocketMoneyMemberSummary,
  PocketMoneyRosterMember,
} from '@/types/pocket-money';
import { DEFAULT_POCKET_MONEY_ICON_ID } from '@/config/pocket-money-icons';
import { formatCurrency } from '@/utils';
import { toDefaultCurrency } from '@/utils/money';

export const POCKET_MONEY_ENTRY_LABELS: Record<PocketMoneyEntryType, string> = {
  allowance: 'Zsebpénz kiosztás',
  expense: 'Költés',
  adjustment: 'Korrekció',
};

export const POCKET_MONEY_ENTRY_HINTS: Record<PocketMoneyEntryType, string> = {
  allowance: 'Pénz, amit adsz a gyereknek (havi zsebpénz, ajándék készpénz). Növeli az egyenlegét.',
  expense: 'Amit elköltött (üzlet, mozi, stb.). Csökkenti az egyenlegét.',
  adjustment:
    'Manuális egyenleg-javítás, ha a számított összeg nem stimmel a valósággal (pl. maradt nála készpénz, elveszett apró, kezdő egyenleg). Növeli az egyenleget — ha csökkenteni kell, használj Költés tételt.',
};

export function pocketMoneyMemberKey(memberUserId: number | null, memberLabel: string): string {
  if (memberUserId != null) return `user:${memberUserId}`;
  return `label:${memberLabel.toLowerCase().trim()}`;
}

export type PocketMoneySummary = {
  allowance: number;
  expense: number;
  balance: number;
  memberCount: number;
};

export type PocketMoneyFormValues = {
  rosterMemberId: string;
  memberUserId: string;
  memberLabel: string;
  entryType: PocketMoneyEntryType;
  amount: string;
  currency: string;
  entryDate: string;
  note: string;
};

function formatPocketAmount(amount: number, currency: string): string {
  return formatCurrency(amount, currency);
}

export const pocketMoneyCalculations = {
  formatAmount: formatPocketAmount,

  signedAmount(entry: Pick<PocketMoneyEntry, 'entryType' | 'amount'>): number {
    if (entry.entryType === 'expense') return -Math.abs(entry.amount);
    return Math.abs(entry.amount);
  },

  buildMemberSummaries(
    entries: PocketMoneyEntry[],
    defaultCurrency: string,
    exchangeRates: Record<string, number> = { HUF: 1 },
  ): PocketMoneyMemberSummary[] {
    const displayCurrency = defaultCurrency.trim().toUpperCase() || 'HUF';
    const rates = { HUF: 1, ...exchangeRates };
    const byKey = new Map<
      string,
      PocketMoneyMemberSummary & { allowance: number; expense: number; adjustment: number }
    >();

    for (const row of entries) {
      const key = pocketMoneyMemberKey(row.memberUserId, row.memberLabel);
      let bucket = byKey.get(key);
      if (!bucket) {
        bucket = {
          memberKey: key,
          memberLabel: row.memberLabel,
          memberUserId: row.memberUserId,
          currency: displayCurrency,
          allowanceTotal: 0,
          expenseTotal: 0,
          adjustmentTotal: 0,
          balance: 0,
          openingBalance: 0,
          interestTotal: 0,
          interest: null,
          allowance: 0,
          expense: 0,
          adjustment: 0,
        };
        byKey.set(key, bucket);
      }
      const amount = toDefaultCurrency(row.amount, row.currency, displayCurrency, rates);
      if (row.entryType === 'allowance') bucket.allowance += amount;
      else if (row.entryType === 'expense') bucket.expense += amount;
      else if (row.entryType === 'adjustment') bucket.adjustment += amount;
    }

    const members: PocketMoneyMemberSummary[] = [];
    for (const row of byKey.values()) {
      members.push({
        memberKey: row.memberKey,
        memberLabel: row.memberLabel,
        memberUserId: row.memberUserId,
        currency: displayCurrency,
        allowanceTotal: Math.round(row.allowance),
        expenseTotal: Math.round(row.expense),
        adjustmentTotal: Math.round(row.adjustment),
        balance: Math.round(row.allowance + row.adjustment - row.expense),
        openingBalance: 0,
        interestTotal: 0,
        interest: null,
      });
    }

    return members.sort((a, b) => a.memberLabel.localeCompare(b.memberLabel, 'hu'));
  },

  mergeDisplayMembers(
    roster: PocketMoneyRosterMember[],
    summaries: PocketMoneyMemberSummary[],
    defaultCurrency: string,
  ): PocketMoneyDisplayMember[] {
    const summaryByKey = new Map(summaries.map((s) => [s.memberKey, s]));
    const seen = new Set<string>();
    const rows: PocketMoneyDisplayMember[] = [];

    for (const member of roster) {
      const key = pocketMoneyMemberKey(member.memberUserId, member.label);
      seen.add(key);
      const summary = summaryByKey.get(key);
      rows.push({
        memberKey: key,
        memberLabel: member.label,
        memberUserId: member.memberUserId,
        currency: summary?.currency ?? defaultCurrency,
        balance: summary?.balance ?? 0,
        openingBalance: summary?.openingBalance ?? 0,
        allowanceTotal: summary?.allowanceTotal ?? 0,
        expenseTotal: summary?.expenseTotal ?? 0,
        adjustmentTotal: summary?.adjustmentTotal ?? 0,
        interestTotal: summary?.interestTotal ?? 0,
        interest: summary?.interest ?? null,
        rosterId: member.id.startsWith('legacy-') ? null : member.id,
        icon: member.icon,
        stickerColor: member.stickerColor ?? null,
        iconColor: member.iconColor ?? null,
      });
    }

    for (const summary of summaries) {
      if (seen.has(summary.memberKey)) continue;
      rows.push({
        ...summary,
        rosterId: null,
        icon: DEFAULT_POCKET_MONEY_ICON_ID,
        stickerColor: null,
        iconColor: null,
      });
    }

    return rows.sort((a, b) => a.memberLabel.localeCompare(b.memberLabel, 'hu'));
  },

  applyRosterMemberToForm(
    values: PocketMoneyFormValues,
    member: PocketMoneyRosterMember,
  ): PocketMoneyFormValues {
    return {
      ...values,
      rosterMemberId: member.id,
      memberLabel: member.label,
      memberUserId: member.memberUserId ? String(member.memberUserId) : '',
    };
  },

  buildSummaryMetrics(
    entries: PocketMoneyEntry[],
    members: PocketMoneyMemberSummary[],
    defaultCurrency: string,
    exchangeRates: Record<string, number> = { HUF: 1 },
  ): PocketMoneySummary {
    const displayCurrency = defaultCurrency.trim().toUpperCase() || 'HUF';
    const rates = { HUF: 1, ...exchangeRates };
    let allowance = 0;
    let expense = 0;
    for (const e of entries) {
      const amount = toDefaultCurrency(e.amount, e.currency, displayCurrency, rates);
      if (e.entryType === 'allowance' || e.entryType === 'adjustment') allowance += amount;
      if (e.entryType === 'expense') expense += amount;
    }
    const balance = members.reduce((sum, m) => sum + m.balance, 0);

    return {
      allowance: Math.round(allowance),
      expense: Math.round(expense),
      balance: Math.round(balance),
      memberCount: members.length,
    };
  },

  buildMetricStrip(summary: PocketMoneySummary, currency: string): MetricItem[] {
    const fmt = (n: number) => formatPocketAmount(n, currency);
    return [
      {
        label: 'Kiosztva',
        value: fmt(summary.allowance),
        icon: PiggyBank,
        tone: 'success',
      },
      {
        label: 'Elköltve',
        value: fmt(summary.expense),
        icon: ShoppingBag,
        tone: 'warning',
      },
      {
        label: 'Egyenleg összesen',
        value: fmt(summary.balance),
        icon: Wallet,
        tone: summary.balance >= 0 ? 'primary' : 'danger',
      },
      {
        label: 'Családtagok',
        value: String(summary.memberCount),
        icon: Coins,
        tone: 'default',
      },
    ];
  },

  buildPayload(values: PocketMoneyFormValues): {
    memberLabel: string;
    memberUserId: number | null;
    entryType: PocketMoneyEntryType;
    amount: number;
    currency: string;
    entryDate: string;
    note: string | null;
  } {
    const memberUserId = values.memberUserId ? Number(values.memberUserId) : null;
    return {
      memberLabel: values.memberLabel.trim(),
      memberUserId: Number.isFinite(memberUserId) ? memberUserId : null,
      entryType: values.entryType,
      amount: Math.max(0, Number(values.amount) || 0),
      currency: values.currency.trim().toUpperCase() || 'HUF',
      entryDate: values.entryDate,
      note: values.note.trim() || null,
    };
  },

  emptyFormValues(defaultCurrency: string, entryDate: string, rosterMemberId = ''): PocketMoneyFormValues {
    return {
      rosterMemberId,
      memberUserId: '',
      memberLabel: '',
      entryType: 'allowance',
      amount: '',
      currency: defaultCurrency,
      entryDate,
      note: '',
    };
  },

  valuesFromEntry(
    entry: PocketMoneyEntry,
    roster: PocketMoneyRosterMember[] = [],
  ): PocketMoneyFormValues {
    const match = roster.find(
      (m) =>
        pocketMoneyMemberKey(m.memberUserId, m.label) ===
        pocketMoneyMemberKey(entry.memberUserId, entry.memberLabel),
    );
    return {
      rosterMemberId: match?.id ?? '',
      memberUserId: entry.memberUserId ? String(entry.memberUserId) : '',
      memberLabel: entry.memberLabel,
      entryType: entry.entryType,
      amount: String(entry.amount),
      currency: entry.currency,
      entryDate: entry.entryDate,
      note: entry.note ?? '',
    };
  },
};
