import type { PocketMoneyInterestBasis, PocketMoneyInterestOn } from '@/settings/pocket-money';

export function pocketMoneyInterestOnLabel(on: PocketMoneyInterestOn): string {
  return on === 'month_allowance'
    ? 'a hónapban kiosztott zsebpénzre'
    : 'a teljes egyenlegre (hónap végén)';
}

export function pocketMoneyInterestRuleLabel(basis: PocketMoneyInterestBasis): string {
  return basis === 'no_expense' ? 'csak ha nem költött' : 'a bent maradt részre is költés után';
}

export function pocketMoneyInterestSummary(
  ratePercent: number,
  on: PocketMoneyInterestOn,
  basis: PocketMoneyInterestBasis,
): string {
  return `${ratePercent}% ${pocketMoneyInterestOnLabel(on)}, ${pocketMoneyInterestRuleLabel(basis)}`;
}
