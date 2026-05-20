import type { UtilityBill } from '@/types';

export function computeUtilityNetBalance(
  bills: UtilityBill[],
  isAdmin: boolean,
  splitEnabled: boolean,
): {
  partnerOwesUs: number;
  weOwePartner: number;
  wePaidGrandTotal: number;
  partnerPaidGrandTotal: number;
  netBalance: number;
} {
  let partnerOwesUs = 0;
  let weOwePartner = 0;
  let wePaidGrandTotal = 0;
  let partnerPaidGrandTotal = 0;

  if (!splitEnabled) {
    return { partnerOwesUs: 0, weOwePartner: 0, wePaidGrandTotal: 0, partnerPaidGrandTotal: 0, netBalance: 0 };
  }

  for (const b of bills) {
    const wePaid = isAdmin ? b.paidBy === 'Mi' : b.paidBy === 'Ildi';
    const partnerPaid = isAdmin ? b.paidBy === 'Ildi' : b.paidBy === 'Mi';
    const isOurPrivate = isAdmin ? b.splitRule === 'dani-private' : b.splitRule === 'ildi-private';
    const isPartnerPrivate = isAdmin ? b.splitRule === 'ildi-private' : b.splitRule === 'dani-private';

    if (wePaid) {
      wePaidGrandTotal += b.total;
      if (b.splitRule === 'shared') partnerOwesUs += b.total / 2;
      else if (isPartnerPrivate) partnerOwesUs += b.total;
    } else if (partnerPaid) {
      partnerPaidGrandTotal += b.total;
      if (b.splitRule === 'shared') weOwePartner += b.total / 2;
      else if (isOurPrivate) weOwePartner += b.total;
    }
  }

  return {
    partnerOwesUs,
    weOwePartner,
    wePaidGrandTotal,
    partnerPaidGrandTotal,
    netBalance: partnerOwesUs - weOwePartner,
  };
}
