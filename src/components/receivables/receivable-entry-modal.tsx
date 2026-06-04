'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormField } from '@/components/ui/FormField';
import { receivablesClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import {
  RECEIVABLE_DEFAULT_CURRENCY,
  RECEIVABLE_ENTRY_TYPE_LABELS,
  RECEIVABLE_ENTRY_TYPES,
  RECEIVABLE_SOURCE_LABELS,
  RECEIVABLE_SOURCES,
  type ReceivableEntryType,
  type ReceivableSource,
} from '@/config/receivables';
import type { ReceivableContact, ReceivableEntry } from '@/types/receivables';

type ReceivableEntryModalProps = {
  open: boolean;
  contact: ReceivableContact | null;
  entry: ReceivableEntry | null;
  defaultEntryType?: ReceivableEntryType;
  onClose: () => void;
  onSaved: (contact: ReceivableContact) => void;
};

export function ReceivableEntryModal({
  open,
  contact,
  entry,
  defaultEntryType = 'lent',
  onClose,
  onSaved,
}: ReceivableEntryModalProps) {
  const [entryType, setEntryType] = useState<ReceivableEntryType>(defaultEntryType);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<ReceivableSource>('cash');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEntryType(entry?.entryType ?? defaultEntryType);
    setAmount(entry ? String(entry.amount) : '');
    setSource(entry?.source ?? 'cash');
    setEntryDate(entry?.entryDate ?? new Date().toISOString().slice(0, 10));
    setNote(entry?.note ?? '');
  }, [open, entry, defaultEntryType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    const parsed = Number(amount.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0.01) return;

    setSaving(true);
    try {
      const payload = {
        entryType,
        amount: parsed,
        source,
        entryDate,
        currency: RECEIVABLE_DEFAULT_CURRENCY,
        note: note.trim() || null,
      };
      const res = entry
        ? await receivablesClient.updateEntry(entry.id, payload)
        : await receivablesClient.createEntry(contact.id, payload);
      if (res && (res[0] === StatusCodes.Http200 || res[0] === StatusCodes.Http201) && res[1]) {
        onSaved(res[1]);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!contact) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={entry ? 'Tétel szerkesztése' : entryType === 'repaid' ? 'Visszafizetés' : 'Kiadtam neki'}
      icon={<ArrowLeftRight size={18} />}
      description={contact.name}
      size="sm"
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <FormField label="Típus">
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-2 text-sm"
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as ReceivableEntryType)}
          >
            {RECEIVABLE_ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {RECEIVABLE_ENTRY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Összeg (Ft)">
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Pl. 15000"
            required
          />
        </FormField>
        <FormField label="Honnan / hogyan">
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-2 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value as ReceivableSource)}
          >
            {RECEIVABLE_SOURCES.map((s) => (
              <option key={s} value={s}>
                {RECEIVABLE_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Dátum">
          <DatePicker value={entryDate} onChange={setEntryDate} placeholder="Válassz dátumot" />
        </FormField>
        <FormField label="Megjegyzés (opcionális)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pl. közös bevásárlás" maxLength={500} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Mégse
          </Button>
          <Button type="submit" loading={saving}>
            Mentés
          </Button>
        </div>
      </form>
    </Modal>
  );
}
