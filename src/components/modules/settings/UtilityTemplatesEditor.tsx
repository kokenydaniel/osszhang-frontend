'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UtilityTemplate } from '@/lib/utilityTemplates';
import { splitRuleLabel } from '@/lib/utilityTemplates';
import type { UtilitySplitRule } from '@/types';

const SPLIT_RULES: UtilitySplitRule[] = ['shared', 'dani-private', 'ildi-private'];

const emptyRow = (): UtilityTemplate => ({
  type: '',
  total: 0,
  due_day: 15,
  split_rule: 'shared',
});

export function UtilityTemplatesEditor({
  value,
  onChange,
  isAdmin,
}: {
  value: UtilityTemplate[];
  onChange: (next: UtilityTemplate[]) => void;
  isAdmin: boolean;
}) {
  const updateRow = (index: number, patch: Partial<UtilityTemplate>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-4 py-3">
          Még nincs sablon. Új háztartásnál először itt állítsd be a rendszeres rezsi tételeket, vagy másold a múlt hónapot a
          Rezsi oldalon.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-[1fr_100px_72px_140px_auto] gap-2 items-end rounded-xl border border-border bg-muted/10 p-3"
            >
              <div className="space-y-1">
                <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Megnevezés</span>
                <Input
                  value={row.type}
                  onChange={(e) => updateRow(index, { type: e.target.value })}
                  placeholder="pl. Víz, Gáz"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Összeg (Ft)</span>
                <Input
                  type="number"
                  min={0}
                  value={row.total || ''}
                  onChange={(e) => updateRow(index, { total: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Nap</span>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={row.due_day}
                  onChange={(e) => updateRow(index, { due_day: Math.min(28, Math.max(1, Number(e.target.value) || 15)) })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Megosztás</span>
                <select
                  className="h-9 w-full rounded-md border border-border bg-input px-2 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                  value={row.split_rule}
                  onChange={(e) => updateRow(index, { split_rule: e.target.value as UtilitySplitRule })}
                >
                  {SPLIT_RULES.map((rule) => (
                    <option key={rule} value={rule}>
                      {splitRuleLabel(rule, isAdmin)}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeRow(index)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyRow()])}>
        <Plus size={13} /> Sablon sor hozzáadása
      </Button>
    </div>
  );
}
