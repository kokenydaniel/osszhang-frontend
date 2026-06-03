'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design';
import {
  insuranceCalculations,
  effectiveAnnualPremium,
  isPolicyEffectivelyActive,
  policyStatusLabel,
} from '@/calculations/insurance';
import { paymentFrequencyLabel } from '@/helpers/insurance-budget';
import type { InsurancePolicy } from '@/types/insurance';

type InsurancePoliciesTableProps = {
  policies: InsurancePolicy[];
  isReader?: boolean;
  onEdit: (policy: InsurancePolicy) => void;
  onDelete: (policy: InsurancePolicy) => void;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return value.replace(/-/g, '.');
}

export function InsurancePoliciesTable({
  policies,
  isReader,
  onEdit,
  onDelete,
}: InsurancePoliciesTableProps) {
  if (policies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Még nincs szerződés. Add hozzá az elsőt a fenti gombbal.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm border-collapse min-w-[720px]">
        <thead>
          <tr className="text-left text-[0.65rem] uppercase tracking-wide text-muted-foreground border-b border-border">
            <th className="py-2 px-2 font-medium">Név</th>
            <th className="py-2 px-2 font-medium">Biztosító</th>
            <th className="py-2 px-2 font-medium">Gyakoriság</th>
            <th className="py-2 px-2 font-medium text-right">Díj / érték</th>
            <th className="py-2 px-2 font-medium">Megújítás</th>
            <th className="py-2 px-2 font-medium">Fedezet</th>
            <th className="py-2 px-2 font-medium">Állapot</th>
            <th className="py-2 px-2 font-medium w-24" />
          </tr>
        </thead>
        <tbody>
          {policies.map((p) => (
            <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2.5 px-2 font-medium">{p.name}</td>
              <td className="py-2.5 px-2 text-muted-foreground">{p.insurer || '—'}</td>
              <td className="py-2.5 px-2 text-muted-foreground text-xs">
                {p.premiumFree
                  ? 'Díjmentes'
                  : p.policyKind === 'life_investment' && p.fundValue
                    ? 'Alapérték'
                    : paymentFrequencyLabel(p.paymentFrequency)}
              </td>
              <td className="py-2.5 px-2 text-right tabular-nums">
                {p.premiumFree
                  ? p.fundValue != null
                    ? insuranceCalculations.formatPremium(p.fundValue, p.currency)
                    : '—'
                  : insuranceCalculations.formatPremium(
                      p.paymentAmount > 0 ? p.paymentAmount : effectiveAnnualPremium(p),
                      p.currency,
                    )}
              </td>
              <td className="py-2.5 px-2 tabular-nums">{formatDate(p.renewalDate)}</td>
              <td className="py-2.5 px-2 tabular-nums">{formatDate(p.coveredUntil)}</td>
              <td className="py-2.5 px-2">
                <StatusPill
                  status={
                    isPolicyEffectivelyActive(p)
                      ? 'success'
                      : policyStatusLabel(p) === 'Lejárt'
                        ? 'warning'
                        : 'neutral'
                  }
                  size="xs"
                >
                  {policyStatusLabel(p)}
                </StatusPill>
              </td>
              <td className="py-2.5 px-2">
                {!isReader ? (
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(p)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
