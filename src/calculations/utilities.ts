import type { UtilityBill, UtilitySettlement, UtilitySplitRule, UserProfile } from '@/types';
import type { CreateUtilityBillPayload } from '@/types/utilities';
import { compareDates, hasSettlementDate, isPastDueDate, matchesMonthYear } from '@/utils/dates';
import { formatDisplayName } from '@/utils/person-name';
import { formatHUF, formatDate } from '@/utils';
import { HELP } from '@/config/help';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/config/utility-templates';
import type { MetricItem } from '@/components/design';
import {
  ArrowLeftRight,
  CheckCircle,
  Clock,
  Receipt,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface UtilityBalanceResult {
  partnerOwesUs: number;
  weOwePartner: number;
  wePaidGrandTotal: number;
  partnerPaidGrandTotal: number;
  netBalance: number;
}

export interface UtilitySplitLabels {
  onHouseholdSide: boolean;
  partnerId: number | null;
  splitPartnerUser: UserProfile | undefined;
  householdSideLabel: string;
  partnerSideLabel: string;
  householdPayerLabel: string;
  partnerPayerLabel: string;
  counterpartyLabel: string;
}

export interface UtilitySettlementOption {
  id: UtilitySplitRule;
  title: string;
  description: string;
  example: string;
  icon: LucideIcon;
}

export interface UtilityBillFormFields {
  type: string;
  total: string;
  dueDate: string;
  splitRule: UtilitySplitRule;
}

export interface UtilityMetricContext {
  utilitySplitEnabled: boolean;
  monthSettlement: UtilitySettlement | undefined;
  counterpartyLabel: string;
  rawNetBalance: number;
  partnerOwesUsTotal: number;
  weOwePartnerTotal: number;
  wePaidGrandTotal: number;
  partnerPaidGrandTotal: number;
  filteredBills: UtilityBill[];
  paidCount: number;
  totalCount: number;
}

const emptyBalance: UtilityBalanceResult = {
  partnerOwesUs: 0,
  weOwePartner: 0,
  wePaidGrandTotal: 0,
  partnerPaidGrandTotal: 0,
  netBalance: 0,
};

export const utilitiesCalculations = {
  isLegacySettlementBill(bill: Pick<UtilityBill, 'type'>): boolean {
    return /kiegyenlít/i.test(bill.type);
  },

  filterBillsForDisplay(bills: UtilityBill[]): UtilityBill[] {
    return bills.filter((b) => !utilitiesCalculations.isLegacySettlementBill(b));
  },

  isBillUnsettled(
    bill: Pick<UtilityBill, 'paidDate' | 'paidBy'>,
    splitEnabled: boolean,
  ): boolean {
    if (splitEnabled) return !bill.paidBy;
    return !hasSettlementDate(bill.paidDate);
  },

  isBillOverdue(
    bill: Pick<UtilityBill, 'dueDate' | 'paidDate' | 'paidBy'>,
    options: { splitEnabled: boolean; today?: string },
  ): boolean {
    if (!utilitiesCalculations.isBillUnsettled(bill, options.splitEnabled)) return false;
    return isPastDueDate(bill.dueDate, options.today);
  },

  billMatchesMonthYear(dueDate: string, month: number, year: number): boolean {
    return matchesMonthYear(dueDate, month, year);
  },

  filterBillsByMonth(bills: UtilityBill[], month: number, year: number): UtilityBill[] {
    return bills.filter((b) => utilitiesCalculations.billMatchesMonthYear(b.dueDate, month, year));
  },

  sortBillsByDueDate(bills: UtilityBill[]): UtilityBill[] {
    return [...bills].sort((a, b) => compareDates(a.dueDate, b.dueDate));
  },

  computeAbsoluteLedger(bills: UtilityBill[]): {
    householdReceivable: number;
    householdPayable: number;
    householdPaidTotal: number;
    partnerPaidTotal: number;
  } {
    let householdReceivable = 0;
    let householdPayable = 0;
    let householdPaidTotal = 0;
    let partnerPaidTotal = 0;

    for (const b of bills) {
      if (!b.paidBy) continue;

      const householdPaid = b.paidBy === 'Mi';
      const partnerPaid = b.paidBy === 'Ildi';

      if (householdPaid) householdPaidTotal += b.total;
      if (partnerPaid) partnerPaidTotal += b.total;

      if (b.splitRule === 'shared') {
        if (householdPaid) householdReceivable += b.total / 2;
        if (partnerPaid) householdPayable += b.total / 2;
      } else if (utilitiesCalculations.isHouseholdPrivateRule(b.splitRule)) {
        if (partnerPaid) householdPayable += b.total;
      } else if (utilitiesCalculations.isPartnerPrivateRule(b.splitRule)) {
        if (householdPaid) householdReceivable += b.total;
      }
    }

    return { householdReceivable, householdPayable, householdPaidTotal, partnerPaidTotal };
  },

  computeNetBalance(
    bills: UtilityBill[],
    viewerId: number | string | undefined | null,
    partnerId: number | string | undefined | null,
    splitEnabled: boolean,
  ): UtilityBalanceResult {
    if (!splitEnabled) return emptyBalance;

    const { householdReceivable, householdPayable, householdPaidTotal, partnerPaidTotal } =
      utilitiesCalculations.computeAbsoluteLedger(bills);

    const onHouseholdSide = utilitiesCalculations.isHouseholdSide(viewerId, partnerId);

    if (onHouseholdSide) {
      return {
        partnerOwesUs: householdReceivable,
        weOwePartner: householdPayable,
        wePaidGrandTotal: householdPaidTotal,
        partnerPaidGrandTotal: partnerPaidTotal,
        netBalance: householdReceivable - householdPayable,
      };
    }

    return {
      partnerOwesUs: householdPayable,
      weOwePartner: householdReceivable,
      wePaidGrandTotal: partnerPaidTotal,
      partnerPaidGrandTotal: householdPaidTotal,
      netBalance: householdPayable - householdReceivable,
    };
  },

  isPartnerSide(
    viewerId: number | string | undefined | null,
    partnerId: number | string | undefined | null,
  ): boolean {
    if (viewerId == null || partnerId == null) return false;
    return Number(viewerId) === Number(partnerId);
  },

  isHouseholdSide(
    viewerId: number | string | undefined | null,
    partnerId: number | string | undefined | null,
  ): boolean {
    return !utilitiesCalculations.isPartnerSide(viewerId, partnerId);
  },

  resolveSplitLabels(
    viewer: Pick<UserProfile, 'id' | 'household'> | null | undefined,
  ): UtilitySplitLabels {
    const partnerId =
      viewer?.household?.utility_split_partner_id ?? viewer?.household?.utility_split_partner_id ?? null;
    const users = viewer?.household?.users ?? [];
    const onHouseholdSide = utilitiesCalculations.isHouseholdSide(viewer?.id, partnerId);

    const splitPartnerUser =
      partnerId != null ? users.find((u) => Number(u.id) === Number(partnerId)) : undefined;

    const adminUser = users.find((u) => u.role === 'admin');
    const householdName = viewer?.household?.name?.trim();

    const householdSideLabel =
      householdName ||
      (adminUser ? formatDisplayName(adminUser.first_name, adminUser.last_name) : '') ||
      'Háztartás';

    const partnerSideLabel = splitPartnerUser
      ? formatDisplayName(splitPartnerUser.first_name, splitPartnerUser.last_name) || 'Partner'
      : 'Partner';

    const householdPayerLabel = onHouseholdSide ? 'Te (háztartás)' : householdSideLabel;
    const partnerPayerLabel = onHouseholdSide ? partnerSideLabel : 'Te';
    const counterpartyLabel = onHouseholdSide ? partnerSideLabel : householdSideLabel;

    return {
      onHouseholdSide,
      partnerId: partnerId != null ? Number(partnerId) : null,
      splitPartnerUser,
      householdSideLabel,
      partnerSideLabel,
      householdPayerLabel,
      partnerPayerLabel,
      counterpartyLabel,
    };
  },

  householdPrivateRule(): UtilitySplitRule {
    return 'dani-private';
  },

  partnerPrivateRule(): UtilitySplitRule {
    return 'ildi-private';
  },

  viewerPrivateRule(onHouseholdSide: boolean): UtilitySplitRule {
    return onHouseholdSide ? utilitiesCalculations.householdPrivateRule() : utilitiesCalculations.partnerPrivateRule();
  },

  otherPrivateRule(onHouseholdSide: boolean): UtilitySplitRule {
    return onHouseholdSide ? utilitiesCalculations.partnerPrivateRule() : utilitiesCalculations.householdPrivateRule();
  },

  isHouseholdPrivateRule(rule: UtilitySplitRule): boolean {
    return rule === 'dani-private';
  },

  isPartnerPrivateRule(rule: UtilitySplitRule): boolean {
    return rule === 'ildi-private';
  },

  ourUtilityPortion(
    bill: Pick<UtilityBill, 'total' | 'splitRule'>,
    onHouseholdSide: boolean,
    splitEnabled: boolean,
  ): number {
    if (!splitEnabled) return bill.total;
    if (bill.splitRule === 'shared') return bill.total / 2;
    if (utilitiesCalculations.isHouseholdPrivateRule(bill.splitRule)) return onHouseholdSide ? bill.total : 0;
    if (utilitiesCalculations.isPartnerPrivateRule(bill.splitRule)) return onHouseholdSide ? 0 : bill.total;
    return 0;
  },

  budgetBillPortion(
    bill: Pick<UtilityBill, 'total' | 'splitRule' | 'paidBy' | 'paidDate'>,
    onHouseholdSide: boolean,
    utilitySplitEnabled: boolean,
  ): number {
    if (!hasSettlementDate(bill.paidDate)) return 0;
    if (!utilitySplitEnabled) return bill.total;
    if (bill.paidBy) {
      if (onHouseholdSide && bill.paidBy === 'Mi') return bill.total;
      if (!onHouseholdSide && bill.paidBy === 'Ildi') return bill.total;
      return 0;
    }
    return utilitiesCalculations.ourUtilityPortion(bill, onHouseholdSide, utilitySplitEnabled);
  },

  splitRuleLabel(rule: UtilitySplitRule, onHouseholdSide: boolean): string {
    if (rule === 'shared') return 'Közös 50/50';
    if (utilitiesCalculations.isHouseholdPrivateRule(rule)) return onHouseholdSide ? 'Saját (te)' : 'Partner magán';
    return onHouseholdSide ? 'Partner magán' : 'Saját (te)';
  },

  payerSideLabel(
    paidBy: UtilityBill['paidBy'],
    labels: Pick<UtilitySplitLabels, 'onHouseholdSide' | 'householdPayerLabel' | 'partnerPayerLabel'>,
  ): string {
    if (!paidBy) return 'Függőben';
    const householdPaid = paidBy === 'Mi';
    if (labels.onHouseholdSide) {
      return householdPaid ? labels.householdPayerLabel : labels.partnerPayerLabel;
    }
    return householdPaid ? labels.householdPayerLabel : labels.partnerPayerLabel;
  },

  privateRuleOwnerLabel(
    rule: UtilitySplitRule,
    labels: Pick<UtilitySplitLabels, 'onHouseholdSide' | 'householdSideLabel' | 'partnerSideLabel'>,
  ): string {
    const isHouseholdPrivate = utilitiesCalculations.isHouseholdPrivateRule(rule);
    if (labels.onHouseholdSide) {
      return isHouseholdPrivate ? 'Te' : labels.partnerSideLabel;
    }
    return isHouseholdPrivate ? labels.householdSideLabel : 'Te';
  },

  resolveTemplates(household: UserProfile['household'] | null | undefined): UtilityTemplate[] {
    return resolveUtilityTemplates(household);
  },

  findMonthSettlement(
    settlements: UtilitySettlement[],
    year: number,
    month: number,
  ): UtilitySettlement | undefined {
    return settlements.find((s) => s.year === year && s.month === month);
  },

  buildSettlementOptions(
    onHouseholdSide: boolean,
    partnerSideLabel: string,
    householdSideLabel: string,
  ): UtilitySettlementOption[] {
    const ourSplitRule = utilitiesCalculations.viewerPrivateRule(onHouseholdSide);
    const partnerSplitRule = utilitiesCalculations.otherPrivateRule(onHouseholdSide);

    return [
      {
        id: 'shared',
        title: 'Közös költség (50–50%)',
        description: HELP.utilities.settlementShared,
        example: 'Villany, gáz, víz a közös háztartásban',
        icon: Users,
      },
      {
        id: ourSplitRule,
        title: `${onHouseholdSide ? 'Te (háztartás)' : 'Te'} fizeti egyedül`,
        description: HELP.utilities.settlementMine,
        example: 'Pl. saját előfizetés, csak te használod',
        icon: User,
      },
      {
        id: partnerSplitRule,
        title: `${onHouseholdSide ? partnerSideLabel : householdSideLabel} fizeti egyedül`,
        description: HELP.utilities.settlementPartner,
        example: 'Pl. a partner saját költsége — nálad csak nyilvántartás',
        icon: User,
      },
    ];
  },

  buildBillFormPayload(
    fields: UtilityBillFormFields,
    splitEnabled: boolean,
  ): CreateUtilityBillPayload {
    const targetSplitRule = splitEnabled ? fields.splitRule : utilitiesCalculations.householdPrivateRule();
    return {
      type: fields.type,
      total: Number(fields.total),
      dueDate: fields.dueDate,
      splitRule: targetSplitRule,
      paidBy: null,
      paidDate: null,
    };
  },

  buildTemplateBillPayload(template: UtilityTemplate, year: number, month: number): CreateUtilityBillPayload {
    const targetMonth = month.toString().padStart(2, '0');
    const targetYearMonth = `${year}-${targetMonth}`;
    return {
      type: template.type,
      total: template.total,
      dueDate: `${targetYearMonth}-${String(template.due_day).padStart(2, '0')}`,
      splitRule: template.split_rule,
      paidBy: null,
      paidDate: null,
    };
  },

  templateExistsForMonth(bills: UtilityBill[], type: string, yearMonthPrefix: string): boolean {
    return bills.some((b) => b.type === type && b.dueDate.startsWith(yearMonthPrefix));
  },

  resolveBalanceMetricAction(
    utilitySplitEnabled: boolean,
    isAdmin: boolean,
    monthSettlement: UtilitySettlement | undefined,
    rawNetBalance: number,
  ): 'settle' | 'unsettle' | null {
    if (!utilitySplitEnabled || !isAdmin) return null;
    if (monthSettlement) return 'unsettle';
    if (rawNetBalance !== 0) return 'settle';
    return null;
  },

  buildSettlementNotification(settlement: UtilitySettlement): string {
    return settlement.direction === 'partner_pays_household'
      ? `Elszámolás rögzítve — bevétel és egyenleg +${formatHUF(settlement.amount)}`
      : `Elszámolás rögzítve — kiadás és egyenleg −${formatHUF(settlement.amount)}`;
  },

  buildMetricStrip(ctx: UtilityMetricContext): MetricItem[] {
    const paidPercent = ctx.totalCount > 0 ? Math.round((ctx.paidCount / ctx.totalCount) * 100) : 0;

    if (ctx.utilitySplitEnabled) {
      return [
        {
          label: ctx.monthSettlement
            ? 'Elszámolás'
            : ctx.rawNetBalance === 0
              ? 'Nincs tartozás'
              : ctx.rawNetBalance > 0
                ? `${ctx.counterpartyLabel} tartozik`
                : 'Te tartozol',
          value: ctx.monthSettlement
            ? 'Rendezve'
            : ctx.rawNetBalance === 0
              ? 'Kvitt'
              : formatHUF(Math.abs(ctx.rawNetBalance)),
          info: HELP.utilities.balance,
          hint: ctx.monthSettlement
            ? formatDate(ctx.monthSettlement.settledAt)
            : ctx.rawNetBalance === 0
              ? 'Nincs kifizetendő különbség'
              : 'Ebben a hónapban',
          icon: ArrowLeftRight,
          tone:
            ctx.monthSettlement || ctx.rawNetBalance === 0
              ? 'success'
              : ctx.rawNetBalance > 0
                ? 'success'
                : 'danger',
          emphasis: true,
        },
        {
          label: 'Te fizettél',
          value: formatHUF(ctx.wePaidGrandTotal),
          info: HELP.utilities.wePaid,
          hint: `${ctx.counterpartyLabel} tartozása: ${formatHUF(ctx.partnerOwesUsTotal)}`,
          icon: Receipt,
          tone: 'primary',
        },
        {
          label: `${ctx.counterpartyLabel} fizetett`,
          value: formatHUF(ctx.partnerPaidGrandTotal),
          info: HELP.utilities.partnerPaid,
          hint: `Te tartozol: ${formatHUF(ctx.weOwePartnerTotal)}`,
          icon: Receipt,
          tone: 'info',
        },
        {
          label: 'Készültség',
          value: `${paidPercent}%`,
          info: HELP.utilities.readiness,
          hint: `${ctx.paidCount}/${ctx.totalCount} kifizetve`,
          icon: CheckCircle,
          tone: paidPercent === 100 ? 'success' : paidPercent > 50 ? 'warning' : 'default',
        },
      ];
    }

    return [
      {
        label: 'Havi összes',
        value: formatHUF(ctx.filteredBills.reduce((s, b) => s + b.total, 0)),
        info: HELP.utilities.totalBills,
        hint: 'Tárgyhavi összes',
        icon: Receipt,
        tone: 'primary',
      },
      {
        label: 'Kifizetve',
        value: formatHUF(ctx.filteredBills.filter((b) => !!b.paidDate).reduce((s, b) => s + b.total, 0)),
        info: HELP.utilities.paid,
        hint: 'Kiegyenlített számlák',
        icon: CheckCircle,
        tone: 'success',
      },
      {
        label: 'Várakozik',
        value: formatHUF(ctx.filteredBills.filter((b) => !b.paidDate).reduce((s, b) => s + b.total, 0)),
        info: HELP.utilities.waiting,
        hint: 'Függőben lévő',
        icon: Clock,
        tone: 'warning',
      },
      {
        label: 'Készültség',
        value: `${paidPercent}%`,
        info: HELP.utilities.readiness,
        hint: `${ctx.paidCount}/${ctx.totalCount} tétel`,
        icon: CheckCircle,
        tone: paidPercent === 100 ? 'success' : 'default',
      },
    ];
  }
};
