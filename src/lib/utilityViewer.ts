import type { UtilityBill, UtilitySplitRule, UserProfile } from '@/types';
import { formatDisplayName } from '@/lib/personName';

export function isUtilityPartnerSide(
  viewerId: number | string | undefined | null,
  partnerId: number | string | undefined | null,
): boolean {
  if (viewerId == null || partnerId == null) return false;
  return Number(viewerId) === Number(partnerId);
}

export function isUtilityHouseholdSide(
  viewerId: number | string | undefined | null,
  partnerId: number | string | undefined | null,
): boolean {
  return !isUtilityPartnerSide(viewerId, partnerId);
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

export function resolveUtilitySplitLabels(
  viewer: Pick<UserProfile, 'id' | 'household'> | null | undefined,
): UtilitySplitLabels {
  const partnerId =
    viewer?.household?.utilitySplitPartnerId ?? viewer?.household?.utility_split_partner_id ?? null;
  const users = viewer?.household?.users ?? [];
  const onHouseholdSide = isUtilityHouseholdSide(viewer?.id, partnerId);

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

export function householdPrivateRule(): UtilitySplitRule {
  return 'dani-private';
}

export function partnerPrivateRule(): UtilitySplitRule {
  return 'ildi-private';
}

export function viewerPrivateRule(onHouseholdSide: boolean): UtilitySplitRule {
  return onHouseholdSide ? householdPrivateRule() : partnerPrivateRule();
}

export function otherPrivateRule(onHouseholdSide: boolean): UtilitySplitRule {
  return onHouseholdSide ? partnerPrivateRule() : householdPrivateRule();
}

export function isHouseholdPrivateRule(rule: UtilitySplitRule): boolean {
  return rule === 'dani-private';
}

export function isPartnerPrivateRule(rule: UtilitySplitRule): boolean {
  return rule === 'ildi-private';
}

export function ourUtilityPortion(
  bill: Pick<UtilityBill, 'total' | 'splitRule'>,
  onHouseholdSide: boolean,
  splitEnabled: boolean,
): number {
  if (!splitEnabled) return bill.total;
  if (bill.splitRule === 'shared') return bill.total / 2;
  if (isHouseholdPrivateRule(bill.splitRule)) return onHouseholdSide ? bill.total : 0;
  if (isPartnerPrivateRule(bill.splitRule)) return onHouseholdSide ? 0 : bill.total;
  return 0;
}

export function splitRuleLabel(rule: UtilitySplitRule, onHouseholdSide: boolean): string {
  if (rule === 'shared') return 'Közös 50/50';
  if (isHouseholdPrivateRule(rule)) return onHouseholdSide ? 'Saját (te)' : 'Partner magán';
  return onHouseholdSide ? 'Partner magán' : 'Saját (te)';
}

export function payerSideLabel(
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

export function privateRuleOwnerLabel(
  rule: UtilitySplitRule,
  labels: Pick<UtilitySplitLabels, 'onHouseholdSide' | 'householdSideLabel' | 'partnerSideLabel'>,
): string {
  const isHouseholdPrivate = isHouseholdPrivateRule(rule);
  if (labels.onHouseholdSide) {
    return isHouseholdPrivate ? 'Te' : labels.partnerSideLabel;
  }
  return isHouseholdPrivate ? labels.householdSideLabel : 'Te';
}
