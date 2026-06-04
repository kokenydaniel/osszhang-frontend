'use client';

import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { receivablesClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import type { ReceivableContact } from '@/types/receivables';

type ReceivableContactModalProps = {
  open: boolean;
  contact: ReceivableContact | null;
  onClose: () => void;
  onSaved: (contact: ReceivableContact, mode: 'create' | 'update') => void;
};

export function ReceivableContactModal({ open, contact, onClose, onSaved }: ReceivableContactModalProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(contact?.name ?? '');
    setNote(contact?.note ?? '');
  }, [open, contact]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const payload = { name: trimmed, note: note.trim() || null };
      const res = contact
        ? await receivablesClient.updateContact(contact.id, payload)
        : await receivablesClient.createContact(payload);
      if (res && (res[0] === StatusCodes.Http200 || res[0] === StatusCodes.Http201) && res[1]) {
        onSaved(res[1], contact ? 'update' : 'create');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={contact ? 'Személy szerkesztése' : 'Új személy'}
      icon={<UserRound size={18} />}
      description="Pl. barát, családtag — akinél követed a kölcsönt vagy közös költést."
      size="sm"
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <FormField label="Név">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pl. Péter, Anna" maxLength={120} required />
        </FormField>
        <FormField label="Megjegyzés (opcionális)">
          <textarea
            className="min-h-[72px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Pl. közös vásárlás, lakbér előleg…"
            maxLength={500}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Mégse
          </Button>
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            Mentés
          </Button>
        </div>
      </form>
    </Modal>
  );
}
