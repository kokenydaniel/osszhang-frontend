import { businessCalculations } from '@/calculations/business';
import { formatAamLimitShort, getAamAnnualLimitHuf } from '@/config/aam-limits';
import { formatHUF } from '@/utils';
import type { BusinessSettings } from '@/settings/business';
import type { BusinessOrder } from '@/types/business';

export type DashboardBusinessTaxAlert =
  | {
      tone: 'warning';
      title: string;
      description: string;
    }
  | {
      tone: 'info';
      title: string;
      description: string;
    };

export function computeDashboardBusinessTaxAlert(
  orders: BusinessOrder[],
  selectedYear: number,
  bizSettings: BusinessSettings,
): DashboardBusinessTaxAlert | null {
  if (bizSettings.tax_regime !== 'aam') return null;

  const revenue = businessCalculations.computeAnnualRevenue(orders, selectedYear, bizSettings);
  const limit = getAamAnnualLimitHuf(selectedYear);
  const used = revenue.total;
  const percent = limit > 0 ? (used / limit) * 100 : 0;
  const remaining = Math.max(0, limit - used);

  if (percent >= 100) {
    return {
      tone: 'warning',
      title: 'AAM értékhatár túllépése (becslés)',
      description: `A ${selectedYear}. évi rögzített bevételek (${formatHUF(used)}) meghaladhatják a ${formatAamLimitShort(limit)} keretet — egyeztess könyvelővel.`,
    };
  }

  if (percent >= 85) {
    return {
      tone: 'info',
      title: 'Közeledés az AAM kerethez',
      description: `Még kb. ${formatHUF(remaining)} van a ${formatAamLimitShort(limit)} keretig (${Math.round(percent)}% felhasználva).`,
    };
  }

  return null;
}
