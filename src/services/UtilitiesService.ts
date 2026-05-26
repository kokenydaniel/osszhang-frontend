import type { UtilityBill, UtilitySettlement, UtilitySplitRule, UserProfile } from '@/types';
import { utilitiesClient } from '@/lib/api-client';
import {
  mapUtilityBillFromApi,
  mapUtilitiesIndexFromApi,
  utilityBillToApiPayload,
  type CreateUtilityBillPayload,
  type UpdateUtilityBillPayload,
  type UtilitiesIndex,
  type RawUtilityBill,
} from '@/mappers/utilities.mapper';
import { isAbortError } from '@/lib/api-client/abortError';
import { compareDates, hasSettlementDate, isPastDueDate, matchesMonthYear } from '@/lib/dates';
import { formatDisplayName } from '@/lib/personName';
import { formatHUF, formatDate } from '@/utils';
import { HELP } from '@/lib/helpTexts';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';
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

export interface UtilitiesFetchOptions {
  silent?: boolean;
}

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

export class UtilitiesService {
  private static _instance: UtilitiesService | null = null;
  private abortController: AbortController | null = null;
  private fetchSeq = 0;

  private constructor() {}

  static getInstance(): UtilitiesService {
    if (!UtilitiesService._instance) {
      UtilitiesService._instance = new UtilitiesService();
    }
    return UtilitiesService._instance;
  }

  async fetchAll(options?: UtilitiesFetchOptions): Promise<UtilitiesIndex> {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const seq = ++this.fetchSeq;

    try {
      const res = await utilitiesClient.getAll({
        signal: this.abortController.signal,
        silent: options?.silent,
      });
      if (seq !== this.fetchSeq) {
        throw new DOMException('Aborted', 'AbortError');
      }
      return mapUtilitiesIndexFromApi(res.data);
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error('[UtilitiesService] fetchAll failed', error);
      throw error;
    }
  }

  async create(payload: CreateUtilityBillPayload): Promise<UtilityBill> {
    const res = await utilitiesClient.create(utilityBillToApiPayload(payload) as CreateUtilityBillPayload);
    return mapUtilityBillFromApi(res.data as RawUtilityBill);
  }

  async update(id: number, payload: UpdateUtilityBillPayload): Promise<UtilityBill> {
    const res = await utilitiesClient.update(id, utilityBillToApiPayload(payload) as UpdateUtilityBillPayload);
    return mapUtilityBillFromApi(res.data as RawUtilityBill);
  }

  async remove(id: number): Promise<void> {
    await utilitiesClient.delete(id);
  }

  async clonePreviousMonth(month: number, year: number): Promise<UtilitiesIndex> {
    const res = await utilitiesClient.cloneMonth(month, year);
    return mapUtilitiesIndexFromApi(res.data);
  }

  async settleMonth(
    month: number,
    year: number,
  ): Promise<{ index: UtilitiesIndex; settlement: UtilitySettlement }> {
    const res = await utilitiesClient.settleMonth(month, year);
    const index = mapUtilitiesIndexFromApi(res.data);
    const settlement = (res.data as { settlement?: UtilitySettlement }).settlement;
    if (!settlement) {
      throw new Error('Missing settlement in API response');
    }
    return { index, settlement };
  }

  async unsettleMonth(month: number, year: number): Promise<UtilitiesIndex> {
    const res = await utilitiesClient.unsettleMonth(month, year);
    return mapUtilitiesIndexFromApi(res.data);
  }

  static isLegacySettlementBill(bill: UtilityBill): boolean {
    return /kiegyenlít/i.test(bill.type);
  }

  static filterBillsForDisplay(bills: UtilityBill[]): UtilityBill[] {
    return bills.filter((b) => !UtilitiesService.isLegacySettlementBill(b));
  }

  static isBillUnsettled(
    bill: Pick<UtilityBill, 'paidDate' | 'paidBy'>,
    splitEnabled: boolean,
  ): boolean {
    if (splitEnabled) return !bill.paidBy;
    return !hasSettlementDate(bill.paidDate);
  }

  static isBillOverdue(
    bill: Pick<UtilityBill, 'dueDate' | 'paidDate' | 'paidBy'>,
    options: { splitEnabled: boolean; today?: string },
  ): boolean {
    if (!UtilitiesService.isBillUnsettled(bill, options.splitEnabled)) return false;
    return isPastDueDate(bill.dueDate, options.today);
  }

  static billMatchesMonthYear(dueDate: string, month: number, year: number): boolean {
    return matchesMonthYear(dueDate, month, year);
  }

  static filterBillsByMonth(bills: UtilityBill[], month: number, year: number): UtilityBill[] {
    return bills.filter((b) => UtilitiesService.billMatchesMonthYear(b.dueDate, month, year));
  }

  static sortBillsByDueDate(bills: UtilityBill[]): UtilityBill[] {
    return [...bills].sort((a, b) => compareDates(a.dueDate, b.dueDate));
  }

  private static computeAbsoluteLedger(bills: UtilityBill[]): {
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
      } else if (UtilitiesService.isHouseholdPrivateRule(b.splitRule)) {
        if (partnerPaid) householdPayable += b.total;
      } else if (UtilitiesService.isPartnerPrivateRule(b.splitRule)) {
        if (householdPaid) householdReceivable += b.total;
      }
    }

    return { householdReceivable, householdPayable, householdPaidTotal, partnerPaidTotal };
  }

  static computeNetBalance(
    bills: UtilityBill[],
    viewerId: number | string | undefined | null,
    partnerId: number | string | undefined | null,
    splitEnabled: boolean,
  ): UtilityBalanceResult {
    if (!splitEnabled) return emptyBalance;

    const { householdReceivable, householdPayable, householdPaidTotal, partnerPaidTotal } =
      UtilitiesService.computeAbsoluteLedger(bills);

    const onHouseholdSide = UtilitiesService.isHouseholdSide(viewerId, partnerId);

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
  }

  static isPartnerSide(
    viewerId: number | string | undefined | null,
    partnerId: number | string | undefined | null,
  ): boolean {
    if (viewerId == null || partnerId == null) return false;
    return Number(viewerId) === Number(partnerId);
  }

  static isHouseholdSide(
    viewerId: number | string | undefined | null,
    partnerId: number | string | undefined | null,
  ): boolean {
    return !UtilitiesService.isPartnerSide(viewerId, partnerId);
  }

  static resolveSplitLabels(
    viewer: Pick<UserProfile, 'id' | 'household'> | null | undefined,
  ): UtilitySplitLabels {
    const partnerId =
      viewer?.household?.utilitySplitPartnerId ?? viewer?.household?.utility_split_partner_id ?? null;
    const users = viewer?.household?.users ?? [];
    const onHouseholdSide = UtilitiesService.isHouseholdSide(viewer?.id, partnerId);

    const splitPartnerUser =
      partnerId != null ? users.find((u) => Number(u.id) === Number(partnerId)) : undefined;

    const adminUser = users.find((u) => u.role === 'admin');
    const householdName = viewer?.household?.name?.trim();

    const householdSideLabel =
      householdName ||
      (adminUser ? formatDisplayName(adminUser.firstName, adminUser.lastName) : '') ||
      'Háztartás';

    const partnerSideLabel = splitPartnerUser
      ? formatDisplayName(splitPartnerUser.firstName, splitPartnerUser.lastName) || 'Partner'
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
  }

  static householdPrivateRule(): UtilitySplitRule {
    return 'dani-private';
  }

  static partnerPrivateRule(): UtilitySplitRule {
    return 'ildi-private';
  }

  static viewerPrivateRule(onHouseholdSide: boolean): UtilitySplitRule {
    return onHouseholdSide ? UtilitiesService.householdPrivateRule() : UtilitiesService.partnerPrivateRule();
  }

  static otherPrivateRule(onHouseholdSide: boolean): UtilitySplitRule {
    return onHouseholdSide ? UtilitiesService.partnerPrivateRule() : UtilitiesService.householdPrivateRule();
  }

  static isHouseholdPrivateRule(rule: UtilitySplitRule): boolean {
    return rule === 'dani-private';
  }

  static isPartnerPrivateRule(rule: UtilitySplitRule): boolean {
    return rule === 'ildi-private';
  }

  static ourUtilityPortion(
    bill: Pick<UtilityBill, 'total' | 'splitRule'>,
    onHouseholdSide: boolean,
    splitEnabled: boolean,
  ): number {
    if (!splitEnabled) return bill.total;
    if (bill.splitRule === 'shared') return bill.total / 2;
    if (UtilitiesService.isHouseholdPrivateRule(bill.splitRule)) return onHouseholdSide ? bill.total : 0;
    if (UtilitiesService.isPartnerPrivateRule(bill.splitRule)) return onHouseholdSide ? 0 : bill.total;
    return 0;
  }

  static splitRuleLabel(rule: UtilitySplitRule, onHouseholdSide: boolean): string {
    if (rule === 'shared') return 'Közös 50/50';
    if (UtilitiesService.isHouseholdPrivateRule(rule)) return onHouseholdSide ? 'Saját (te)' : 'Partner magán';
    return onHouseholdSide ? 'Partner magán' : 'Saját (te)';
  }

  static payerSideLabel(
    paidBy: UtilityBill['paidBy'],
    labels: Pick<UtilitySplitLabels, 'onHouseholdSide' | 'householdPayerLabel' | 'partnerPayerLabel'>,
  ): string {
    if (!paidBy) return 'Függőben';
    const householdPaid = paidBy === 'Mi';
    if (labels.onHouseholdSide) {
      return householdPaid ? labels.householdPayerLabel : labels.partnerPayerLabel;
    }
    return householdPaid ? labels.householdPayerLabel : labels.partnerPayerLabel;
  }

  static privateRuleOwnerLabel(
    rule: UtilitySplitRule,
    labels: Pick<UtilitySplitLabels, 'onHouseholdSide' | 'householdSideLabel' | 'partnerSideLabel'>,
  ): string {
    const isHouseholdPrivate = UtilitiesService.isHouseholdPrivateRule(rule);
    if (labels.onHouseholdSide) {
      return isHouseholdPrivate ? 'Te' : labels.partnerSideLabel;
    }
    return isHouseholdPrivate ? labels.householdSideLabel : 'Te';
  }

  static resolveTemplates(household: UserProfile['household'] | null | undefined): UtilityTemplate[] {
    return resolveUtilityTemplates(household);
  }

  static findMonthSettlement(
    settlements: UtilitySettlement[],
    year: number,
    month: number,
  ): UtilitySettlement | undefined {
    return settlements.find((s) => s.year === year && s.month === month);
  }

  static buildSettlementOptions(
    onHouseholdSide: boolean,
    partnerSideLabel: string,
    householdSideLabel: string,
  ): UtilitySettlementOption[] {
    const ourSplitRule = UtilitiesService.viewerPrivateRule(onHouseholdSide);
    const partnerSplitRule = UtilitiesService.otherPrivateRule(onHouseholdSide);

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
  }

  static buildBillFormPayload(
    fields: UtilityBillFormFields,
    splitEnabled: boolean,
  ): CreateUtilityBillPayload {
    const targetSplitRule = splitEnabled ? fields.splitRule : UtilitiesService.householdPrivateRule();
    return {
      type: fields.type,
      total: Number(fields.total),
      dueDate: fields.dueDate,
      splitRule: targetSplitRule,
      paidBy: null,
      paidDate: null,
    };
  }

  static buildTemplateBillPayload(template: UtilityTemplate, year: number, month: number): CreateUtilityBillPayload {
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
  }

  static templateExistsForMonth(bills: UtilityBill[], type: string, yearMonthPrefix: string): boolean {
    return bills.some((b) => b.type === type && b.dueDate.startsWith(yearMonthPrefix));
  }

  static resolveBalanceMetricAction(
    utilitySplitEnabled: boolean,
    isAdmin: boolean,
    monthSettlement: UtilitySettlement | undefined,
    rawNetBalance: number,
  ): 'settle' | 'unsettle' | null {
    if (!utilitySplitEnabled || !isAdmin) return null;
    if (monthSettlement) return 'unsettle';
    if (rawNetBalance !== 0) return 'settle';
    return null;
  }

  static buildSettlementNotification(settlement: UtilitySettlement): string {
    return settlement.direction === 'partner_pays_household'
      ? `Elszámolás rögzítve — bevétel és egyenleg +${formatHUF(settlement.amount)}`
      : `Elszámolás rögzítve — kiadás és egyenleg −${formatHUF(settlement.amount)}`;
  }

  static buildMetricStrip(ctx: UtilityMetricContext): MetricItem[] {
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
}

export const splitRuleLabel = UtilitiesService.splitRuleLabel.bind(UtilitiesService);

export const utilitiesService = UtilitiesService.getInstance();
