import type { UtilityBill } from '@/types';
import {
  isHouseholdPrivateRule,
  isPartnerPrivateRule,
  isUtilityHouseholdSide,
} from '@/lib/utilityViewer';

export interface UtilityBalanceResult {
  partnerOwesUs: number;
  weOwePartner: number;
  wePaidGrandTotal: number;
  partnerPaidGrandTotal: number;
  netBalance: number;
}

const emptyBalance: UtilityBalanceResult = {
  partnerOwesUs: 0,
  weOwePartner: 0,
  wePaidGrandTotal: 0,
  partnerPaidGrandTotal: 0,
  netBalance: 0,
};

/**
 * Absolute ledger (household ↔ rezsi partner), then mapped to the viewer's side.
 * Split rules are fixed: dani-private = háztartás magán, ildi-private = partner magán.
 */
function computeAbsoluteUtilityLedger(bills: UtilityBill[]): {
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
    } else if (isHouseholdPrivateRule(b.splitRule)) {
      if (partnerPaid) householdPayable += b.total;
    } else if (isPartnerPrivateRule(b.splitRule)) {
      if (householdPaid) householdReceivable += b.total;
    }
  }

  return { householdReceivable, householdPayable, householdPaidTotal, partnerPaidTotal };
}

export function computeUtilityNetBalance(
  bills: UtilityBill[],
  viewerId: number | string | undefined | null,
  partnerId: number | string | undefined | null,
  splitEnabled: boolean,
): UtilityBalanceResult {
  if (!splitEnabled) return emptyBalance;

  const { householdReceivable, householdPayable, householdPaidTotal, partnerPaidTotal } =
    computeAbsoluteUtilityLedger(bills);

  const onHouseholdSide = isUtilityHouseholdSide(viewerId, partnerId);

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
