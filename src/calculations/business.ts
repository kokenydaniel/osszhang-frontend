import type { TaxRegime } from '@/config/business-tax';
import type { BusinessSettings } from '@/settings/business';
import type { BusinessOrder } from '@/types/business';
import {
  computeAnnualTaxRevenue,
  orderCountsAsTaxRevenue,
  type AnnualTaxRevenueResult,
} from '@/utils/business-tax-revenue';
import { compareDates, formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import type { MetricItem } from '@/components/design';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  List,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

export interface BusinessFetchOptions {
  silent?: boolean;
}

export type BusinessChartPoint = {
  name: string;
  bevetel: number;
  kintlevoseg: number;
};

export type BusinessChannelPoint = {
  name: string;
  value: number;
};

export type BusinessYearStats = {
  totalYTD: number;
  aov: number;
  topChannel: string;
  channelData: BusinessChannelPoint[];
  chartData: BusinessChartPoint[];
};

export type { AnnualTaxRevenueResult as AnnualRevenueSummary };

export const businessCalculations = {
  orderCountsAsTaxRevenue,
  computeAnnualRevenue: computeAnnualTaxRevenue,

  filterByMonth(orders: BusinessOrder[], year: number, month: number): BusinessOrder[] {
    const prefix = `${year}-${month.toString().padStart(2, '0')}`;
    return orders
      .filter((order) => order.date.startsWith(prefix))
      .sort((a, b) => compareDates(b.date, a.date));
  },

  computeYearStats(orders: BusinessOrder[], year: number): BusinessYearStats {
    const yearOrders = orders.filter((order) => order.date.startsWith(String(year)));
    const totalYTD = yearOrders.reduce((sum, order) => sum + order.amount, 0);
    const aov = yearOrders.length > 0 ? totalYTD / yearOrders.length : 0;

    const channelMap = yearOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.channel] = (acc[order.channel] || 0) + order.amount;
      return acc;
    }, {});

    const topChannel = Object.entries(channelMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nincs adat';
    const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const chartData = months.map((name, index) => {
      const monthStr = (index + 1).toString().padStart(2, '0');
      const prefix = `${year}-${monthStr}`;
      const monthOrders = orders.filter((order) => order.date.startsWith(prefix));
      const bevetel = monthOrders.filter((order) => !!order.paidDate).reduce((sum, order) => sum + order.amount, 0);
      const kintlevoseg = monthOrders.filter((order) => !order.paidDate).reduce((sum, order) => sum + order.amount, 0);
      return { name, bevetel, kintlevoseg };
    });

    return { totalYTD, aov, topChannel, channelData, chartData };
  },

  buildFallbackAdvice(stats: Pick<BusinessYearStats, 'totalYTD' | 'aov' | 'topChannel'>): string {
    let advice = 'A vállalkozásod adatai stabilak. ';
    if (stats.topChannel === 'Meska') {
      advice += 'A Meska kiemelkedően teljesít, érdemes ott egyedi kampányokat indítani. ';
    }
    if (stats.totalYTD > 1_000_000) {
      advice += 'Gratulálunk, átlépted az 1 milliós éves forgalmat! ';
    }
    if (stats.aov < 5000) {
      advice += 'Az átlagos kosárérték növeléséhez érdemes kiegészítő termékeket ajánlani a pénztárnál. ';
    }
    return advice.trim();
  },

  buildStrategyPrompt(
    businessName: string,
    year: number,
    stats: Pick<BusinessYearStats, 'totalYTD' | 'aov' | 'topChannel' | 'channelData'>,
  ): string {
    return `Kérlek, elemezd az alábbi ${businessName} (kisvállalkozás, kézműves webshop) rendelési és bevételi adataimat a(z) ${year}. évre vonatkozóan, és adj egy 3-4 mondatos barátságos, motiváló stratégiát és tanácsot, hogy hogyan tudnám növelni a bevételem.

Adataim:
- Éves forgalom eddig (YTD): ${stats.totalYTD} Ft
- Átlagos rendelési érték (AOV): ${Math.round(stats.aov)} Ft
- Legjobban teljesítő csatorna: ${stats.topChannel}
- Csatornák szerinti bevételek: ${stats.channelData.map((channel) => `${channel.name}: ${channel.value} Ft`).join(', ')}`;
  },

  deriveOrderState(paidDate: string | null): 'RENDBEN' | 'KINT' {
    return paidDate ? 'RENDBEN' : 'KINT';
  },

  buildMonthlyMetrics(
    filteredOrders: BusinessOrder[],
    chartData: BusinessChartPoint[],
    selectedMonth: number,
  ): MetricItem[] {
    const totalMonthlyIncome = filteredOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalMonthlyPaid = filteredOrders
      .filter((order) => order.state === 'RENDBEN')
      .reduce((sum, order) => sum + order.amount, 0);
    const totalMonthlyPending = filteredOrders
      .filter((order) => order.state !== 'RENDBEN')
      .reduce((sum, order) => sum + order.amount, 0);

    const monthlySparkline = chartData
      .slice(Math.max(0, selectedMonth - 6), selectedMonth)
      .map((point) => point.bevetel + point.kintlevoseg);
    const incomeSparkline = chartData.slice(Math.max(0, selectedMonth - 6), selectedMonth).map((point) => point.bevetel);
    const pendingSparkline = chartData.slice(Math.max(0, selectedMonth - 6), selectedMonth).map((point) => point.kintlevoseg);

    return [
      {
        label: 'Havi forgalom',
        value: formatHUF(totalMonthlyIncome),
        info: HELP.business.monthlyRevenue,
        hint: `${filteredOrders.length} rendelés`,
        icon: TrendingUp,
        tone: 'primary',
        emphasis: true,
        sparkline: monthlySparkline.length > 1 ? monthlySparkline : undefined,
      },
      {
        label: 'Beérkezett',
        value: formatHUF(totalMonthlyPaid),
        info: HELP.business.paid,
        hint: 'Kifizetve / lekönyvelve',
        icon: CheckCircle,
        tone: 'success',
        sparkline: incomeSparkline.length > 1 ? incomeSparkline : undefined,
      },
      {
        label: 'Kintlévőség',
        value: formatHUF(totalMonthlyPending),
        info: HELP.business.pending,
        hint: 'Még nem teljesült',
        icon: AlertCircle,
        tone: totalMonthlyPending > 0 ? 'warning' : 'default',
        sparkline: pendingSparkline.length > 1 ? pendingSparkline : undefined,
      },
      {
        label: 'Konverzió',
        value:
          filteredOrders.length > 0
            ? `${Math.round((filteredOrders.filter((order) => order.state === 'RENDBEN').length / filteredOrders.length) * 100)}%`
            : '—',
        info: HELP.business.conversion,
        hint: `${filteredOrders.filter((order) => order.state === 'RENDBEN').length}/${filteredOrders.length} fizetve`,
        icon: CheckCircle,
        tone: 'info',
      },
    ];
  },

  buildSummaryMetrics(
    stats: BusinessYearStats,
    selectedYear: number,
    taxRevenue?: AnnualTaxRevenueResult | null,
    taxRegime?: TaxRegime,
  ): MetricItem[] {
    const yearlyTotalsSpark = stats.chartData.map((point) => point.bevetel + point.kintlevoseg);
    const isAam = taxRegime === 'aam' && taxRevenue != null;

    const primaryMetric: MetricItem = isAam
      ? {
          label: 'AAM bevétel',
          value: formatHUF(taxRevenue.total),
          info: 'Bizonylatos tételek összege — ez számít az AAM kerethez (Számlázz-hoz közel).',
          hint: `${taxRevenue.orderCount} tétel · összes rendelés ${formatHUF(taxRevenue.totalAllOrdersNet)}`,
          icon: TrendingUp,
          tone: 'primary',
          emphasis: true,
          sparkline: yearlyTotalsSpark,
        }
      : {
          label: 'YTD forgalom',
          value: formatHUF(stats.totalYTD),
          info: HELP.business.ytd,
          hint: `${selectedYear} év · minden rögzített rendelés`,
          icon: TrendingUp,
          tone: 'primary',
          emphasis: true,
          sparkline: yearlyTotalsSpark,
        };

    return [
      primaryMetric,
      {
        label: 'AOV',
        value: formatHUF(stats.aov),
        info: HELP.business.aov,
        hint: 'Átlagos rendelési érték',
        icon: Banknote,
        tone: 'info',
      },
      {
        label: 'Top csatorna',
        value: stats.topChannel,
        info: HELP.business.topChannel,
        hint: 'Legmagasabb bevétel',
        icon: ShoppingBag,
        tone: 'success',
      },
      isAam && taxRevenue.totalExcludedNet > 0
        ? {
            label: 'Nincs bizonylat',
            value: formatHUF(taxRevenue.totalExcludedNet),
            info: 'Rendelések összege, amelyek kimaradtak az AAM bevételből (nincs jelölés / érvényes számla).',
            hint: `${taxRevenue.skippedCount} tétel`,
            icon: AlertCircle,
            tone: 'warning',
          }
        : {
            label: 'Csatornák',
            value: String(stats.channelData.length),
            info: HELP.business.channelCount,
            hint: 'Aktív értékesítési csatorna',
            icon: List,
            tone: 'default',
          },
    ];
  }
};
