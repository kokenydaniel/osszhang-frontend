'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatHUF } from '@/utils';
import { formatDate } from '@/utils/dates';
import type { AnnualTaxRevenueResult } from '@/utils/business-tax-revenue';

type Props = {
  revenue: AnnualTaxRevenueResult;
  selectedYear: number;
};

export function BusinessTaxRevenueBreakdown({ revenue, selectedYear }: Props) {
  const [open, setOpen] = useState(false);
  const included = revenue.lines.filter((l) => l.included);

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <span>
          Számítás részletei ({included.length} tétel, {selectedYear})
        </span>
        <ChevronDown size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open ? (
        <div className="rounded-lg border border-border overflow-hidden max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left text-muted-foreground">
                <th className="px-2 py-2 font-medium">Dátum</th>
                <th className="px-2 py-2 font-medium">Ügyfél</th>
                <th className="px-2 py-2 font-medium">Bizonylat</th>
                <th className="px-2 py-2 font-medium text-right">Összeg</th>
              </tr>
            </thead>
            <tbody>
              {included.map((line) => (
                <tr key={line.orderId} className="border-t border-border/60">
                  <td className="px-2 py-1.5 tabular-nums whitespace-nowrap">{formatDate(line.date)}</td>
                  <td className="px-2 py-1.5 max-w-[8rem] truncate" title={line.customerName}>
                    {line.customerName}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[0.65rem] max-w-[7rem] truncate" title={line.invoiceId ?? ''}>
                    {line.hasInvoice ? '✓ számla' : ''}
                    {line.invoiceId ? ` ${line.invoiceId}` : line.hasInvoice ? '' : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium">{formatHUF(line.netAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t border-border font-semibold">
              <tr>
                <td colSpan={3} className="px-2 py-2 text-right">
                  Összesen
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{formatHUF(revenue.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}

      {revenue.skippedCount > 0 && open ? (
        <p className="text-xs text-muted-foreground">
          Kihagyva: {revenue.skippedCount} rendelés (nincs „számla készült” és nincs érvényes számlasorszám).
        </p>
      ) : null}
    </div>
  );
}
