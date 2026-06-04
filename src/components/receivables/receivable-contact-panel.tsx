'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design';
import {
  RECEIVABLE_ENTRY_TYPE_LABELS,
  RECEIVABLE_SOURCE_LABELS,
} from '@/config/receivables';
import { receivablesCalculations } from '@/calculations/receivables';
import type { ReceivableContact, ReceivableEntry } from '@/types/receivables';
import type { ReceivableEntryType } from '@/config/receivables';

type ReceivableContactPanelProps = {
  contact: ReceivableContact;
  canEdit: boolean;
  onEditContact: () => void;
  onDeleteContact: () => void;
  onAddEntry: (type: ReceivableEntryType) => void;
  onEditEntry: (entry: ReceivableEntry) => void;
  onDeleteEntry: (entry: ReceivableEntry) => void;
};

export function ReceivableContactPanel({
  contact,
  canEdit,
  onEditContact,
  onDeleteContact,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: ReceivableContactPanelProps) {
  const [expanded, setExpanded] = useState(!contact.isSettled);

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <button
          type="button"
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{contact.name}</p>
            {contact.note ? <p className="text-xs text-muted-foreground truncate">{contact.note}</p> : null}
          </div>
        </button>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <StatusPill status={contact.isSettled ? 'success' : contact.outstanding > 0 ? 'warning' : 'neutral'} size="xs">
            {contact.isSettled ? 'Rendezve' : `${receivablesCalculations.formatMoney(contact.outstanding, 'HUF')} kint`}
          </StatusPill>
          {canEdit ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => onAddEntry('lent')}>
                <Plus size={12} />
                Kiadtam
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onAddEntry('repaid')}>
                Visszakaptam
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Szerkesztés" onClick={onEditContact}>
                <Pencil size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Törlés" onClick={onDeleteContact}>
                <Trash2 size={14} />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Összesen kiadva</span>
              <p className="font-medium">{receivablesCalculations.formatMoney(contact.totalLent, 'HUF')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Visszakapva</span>
              <p className="font-medium">{receivablesCalculations.formatMoney(contact.totalRepaid, 'HUF')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hátralék</span>
              <p className="font-medium">{receivablesCalculations.formatMoney(contact.outstanding, 'HUF')}</p>
            </div>
          </div>

          {contact.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Még nincs tétel — add hozzá, mennyit adtál vagy kaptál vissza.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border/80">
              {contact.entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span className="text-xs text-muted-foreground tabular-nums w-[88px] shrink-0">
                    {entry.entryDate}
                  </span>
                  <span className="font-medium w-[120px] shrink-0">
                    {RECEIVABLE_ENTRY_TYPE_LABELS[entry.entryType]}
                  </span>
                  <span className="tabular-nums font-semibold">
                    {receivablesCalculations.formatMoney(entry.amount, entry.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">{RECEIVABLE_SOURCE_LABELS[entry.source]}</span>
                  {entry.note ? <span className="text-xs text-muted-foreground truncate flex-1 min-w-[80px]">{entry.note}</span> : null}
                  {canEdit ? (
                    <span className="ml-auto flex gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEditEntry(entry)}>
                        <Pencil size={12} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDeleteEntry(entry)}>
                        <Trash2 size={12} />
                      </Button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
