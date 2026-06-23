'use client';

import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HELP } from '@/config/help';
import { formatHUF } from '@/utils';
import { lineItemOurShareHuf } from '@/calculations/travel-cost-adjustments';
import type { TravelCostLineItem, TravelCostLineItemStatus } from '@/types/travel';
import type { TravelCostSummary } from '@/calculations/travel-cost-adjustments';
import { Check, Plus, Trash2, X } from 'lucide-react';

type TravelCostEditorProps = {
  lineItems: TravelCostLineItem[];
  summary: TravelCostSummary;
  onStatusChange: (id: string, status: TravelCostLineItemStatus) => void;
  onAmountChange: (id: string, amount: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onSplitChange: (id: string, splitEnabled: boolean, splitBetween?: number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
};

function parseAmountInput(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSplitBetween(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 2) return 2;
  return Math.min(parsed, 20);
}

export function TravelCostEditor({
  lineItems,
  summary,
  onStatusChange,
  onAmountChange,
  onLabelChange,
  onSplitChange,
  onRemove,
  onAdd,
}: TravelCostEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>
          A mi költségünk: <strong className="text-foreground">{formatHUF(summary.totalTripHuf)}</strong>
        </span>
        {summary.hasSplitItems ? (
          <span>
            Teljes költség: <strong className="text-foreground">{formatHUF(summary.totalFullHuf)}</strong>
          </span>
        ) : null}
        <span>
          Kifizetve: <strong className="text-foreground">{formatHUF(summary.paidTotalHuf)}</strong>
        </span>
        <span>
          Hátralévő: <strong className="text-foreground">{formatHUF(summary.remainingToPayHuf)}</strong>
        </span>
        {summary.excludedTotalHuf > 0 ? (
          <span>
            Kizárva: <strong className="text-foreground">{formatHUF(summary.excludedTotalHuf)}</strong>
          </span>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">{HELP.travel.costSplit}</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Tétel</th>
              <th className="py-2 pr-3 font-medium text-right">Teljes (Ft)</th>
              <th className="py-2 pr-3 font-medium">Megosztás</th>
              <th className="py-2 pr-3 font-medium text-right">A mi részünk</th>
              <th className="py-2 pr-3 font-medium text-center">Kifizetve</th>
              <th className="py-2 pr-3 font-medium text-center">Nem kell</th>
              <th className="py-2 font-medium text-right">Művelet</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => {
              const isExcluded = item.status === 'excluded';
              const isPaid = item.status === 'paid';
              const ourShare = lineItemOurShareHuf(item);

              return (
                <tr
                  key={item.id}
                  className={classNames(
                    'border-b border-border/60 last:border-0',
                    isExcluded && 'opacity-50',
                  )}
                >
                  <td className="py-2.5 pr-3">
                    {item.source === 'custom' ? (
                      <Input
                        value={item.label}
                        onChange={(e) => onLabelChange(item.id, e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{item.label}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <Input
                      inputMode="decimal"
                      value={String(Math.round(item.amount_huf))}
                      onChange={(e) => onAmountChange(item.id, parseAmountInput(e.target.value))}
                      className="ml-auto h-8 w-28 text-right text-sm tabular-nums"
                      disabled={isExcluded}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={Boolean(item.split_enabled)}
                        disabled={isExcluded}
                        onChange={(e) => onSplitChange(item.id, e.target.checked)}
                      />
                      <span className="text-muted-foreground">Megosztva</span>
                    </label>
                    {item.split_enabled ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>/</span>
                        <Input
                          inputMode="numeric"
                          value={String(item.split_between ?? 2)}
                          onChange={(e) => onSplitChange(item.id, true, parseSplitBetween(e.target.value))}
                          className="h-7 w-14 text-center text-xs tabular-nums"
                          disabled={isExcluded}
                          aria-label="Hány fél között oszlik"
                        />
                        <span>fél</span>
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-medium tabular-nums text-foreground">
                    {formatHUF(ourShare)}
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <Button
                      type="button"
                      size="icon"
                      variant={isPaid ? 'default' : 'outline'}
                      className="h-8 w-8"
                      disabled={isExcluded}
                      onClick={() => onStatusChange(item.id, isPaid ? 'planned' : 'paid')}
                      aria-label={isPaid ? 'Kifizetve visszavonása' : 'Kifizetve jelölés'}
                    >
                      <Check size={14} />
                    </Button>
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <Button
                      type="button"
                      size="icon"
                      variant={isExcluded ? 'destructive' : 'outline'}
                      className="h-8 w-8"
                      onClick={() => onStatusChange(item.id, isExcluded ? 'planned' : 'excluded')}
                      aria-label={isExcluded ? 'Kizárás visszavonása' : 'Nem kell — kizárás'}
                    >
                      <X size={14} />
                    </Button>
                  </td>
                  <td className="py-2.5 text-right">
                    {item.source === 'custom' ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(item.id)}
                        aria-label="Tétel törlése"
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onAdd}>
        <Plus size={14} />
        Új tétel
      </Button>
    </div>
  );
}
