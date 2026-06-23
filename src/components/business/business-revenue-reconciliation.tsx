'use client';

import { formatHUF } from '@/utils';
import type { AnnualTaxRevenueResult } from '@/utils/business-tax-revenue';

type RowProps = {
  label: string;
  value: string;
  detail?: string;
  bold?: boolean;
  muted?: boolean;
  indent?: boolean;
};

function Row({ label, value, detail, bold, muted, indent }: RowProps) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm ${
        indent ? 'pl-3 border-l-2 border-border/80' : ''
      }`}
    >
      <span className={muted ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
        {value}
      </span>
      {detail ? <span className="w-full text-xs text-muted-foreground">{detail}</span> : null}
    </div>
  );
}

type Props = {
  revenue: AnnualTaxRevenueResult;
  selectedYear: number;
};

export function BusinessRevenueReconciliation({ revenue, selectedYear }: Props) {
  const sumCheck = Math.round((revenue.total + revenue.totalExcludedNet) * 100) / 100;
  const sumsMatch = Math.abs(sumCheck - revenue.totalAllOrdersNet) < 1;

  return (
    <div className="rounded-lg border border-border bg-muted/15 px-3 py-3 space-y-2.5">
      <p className="text-xs font-medium text-foreground">Összesítés · {selectedYear} (rendelés dátuma szerint)</p>

      <Row label="Összes rögzített rendelés" value={formatHUF(revenue.totalAllOrdersNet)} detail={`${revenue.allOrdersCount} tétel`} bold />

      <Row
        label="AAM bevétel (bizonylatos)"
        value={formatHUF(revenue.total)}
        detail={`${revenue.orderCount} tétel — ez számít a kerethez`}
        indent
        bold
      />

      {revenue.totalExcludedNet > 0 ? (
        <Row
          label="Kimaradt (nincs bizonylat)"
          value={formatHUF(revenue.totalExcludedNet)}
          detail={`${revenue.skippedCount} tétel — nem számít AAM-hoz`}
          indent
          muted
        />
      ) : null}

      <p className={`text-xs tabular-nums ${sumsMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
        {sumsMatch
          ? `✓ ${formatHUF(revenue.total)} + ${formatHUF(revenue.totalExcludedNet)} = ${formatHUF(revenue.totalAllOrdersNet)}`
          : `Ellenőrzés: ${formatHUF(revenue.total)} + ${formatHUF(revenue.totalExcludedNet)} ≠ ${formatHUF(revenue.totalAllOrdersNet)} — jelezd, ha látsz ilyet`}
      </p>

      {revenue.orderCount > 0 ? (
        <div className="pt-2 border-t border-border/80 space-y-1.5">
          <p className="text-xs text-muted-foreground">Az AAM bevételen belül (nem külön pluszban):</p>
          <Row
            label="„Számla készült” jelöléssel"
            value={formatHUF(revenue.totalWithInvoiceFlagNet)}
            detail={`${revenue.withInvoiceFlagCount} tétel`}
            indent
          />
          {revenue.invoiceIdOnlyCount > 0 ? (
            <Row
              label="Csak számlasorszám (jelölés nélkül)"
              value={formatHUF(revenue.invoiceIdOnlyTotal)}
              detail={`${revenue.invoiceIdOnlyCount} tétel — része a ${formatHUF(revenue.total)}-nak`}
              indent
            />
          ) : null}
          <p className="text-xs text-muted-foreground pl-3">
            Egy tétel lehet jelöléssel és sorszámmal is; a fenti sorok együtt adják az AAM összeget.
          </p>
        </div>
      ) : null}
    </div>
  );
}
