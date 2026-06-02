'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatDisplayName } from '@/utils/person-name';
import { toDayjs } from '@/utils/dates';
import type { AdminTierGrantPayload, AdminUser } from '@/types/admin';
import type { SubscriptionTier } from '@/types';

type AdminTierGrantModalProps = {
  target: AdminUser | null;
  onClose: () => void;
  onSubmit: (payload: AdminTierGrantPayload) => void | Promise<void>;
  loading?: boolean;
};

const GRANT_OPTIONS: { value: '' | 'pro' | 'premium'; label: string }[] = [
  { value: '', label: 'Nincs admin grant (csak fizetős csomag)' },
  { value: 'pro', label: 'Pro hozzáférés (ajándék)' },
  { value: 'premium', label: 'Premium hozzáférés (ajándék)' },
];

export function AdminTierGrantModal({ target, onClose, onSubmit, loading }: AdminTierGrantModalProps) {
  const [grantTier, setGrantTier] = useState<'' | 'pro' | 'premium'>('');
  const [permanent, setPermanent] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!target) return;
    setGrantTier((target.tier_grant as '' | 'pro' | 'premium') ?? '');
    setPermanent(Boolean(target.tier_grant_is_permanent));
    setExpiresAt(target.tier_grant_expires_at ? toDayjs(target.tier_grant_expires_at).format('YYYY-MM-DD') : '');
    setNote(target.tier_grant_note ?? '');
  }, [target]);

  if (!target) return null;

  const label = formatDisplayName(target.first_name, target.last_name) || target.username;
  const billingLabel = formatTierLabel(target.billing_tier ?? target.household_subscription_tier);

  const handleSubmit = () => {
    const payload: AdminTierGrantPayload = {
      grant_tier: grantTier === '' ? null : grantTier,
      permanent: grantTier !== '' && permanent,
      expires_at: grantTier !== '' && !permanent && expiresAt ? expiresAt : null,
      note: note.trim() || null,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Admin hozzáférés (grant)"
      description={`${label} — fizetős előfizetés: ${billingLabel}. A grant nem változtatja a Stripe számlázást; lejárat után a fizetős csomag marad.`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label htmlFor="grant-tier" className="text-sm font-medium text-foreground">
            Hozzáférési grant
          </label>
          <select
            id="grant-tier"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={grantTier}
            onChange={(e) => setGrantTier(e.target.value as '' | 'pro' | 'premium')}
          >
            {GRANT_OPTIONS.map((opt) => (
              <option key={opt.value || 'none'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {grantTier !== '' ? (
          <>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="rounded border-border"
              />
              Örökös grant (nincs lejárat)
            </label>

            {!permanent ? (
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Lejárat napja</span>
                <DatePicker value={expiresAt} onChange={setExpiresAt} placeholder="Válassz dátumot" />
                <p className="text-xs text-muted-foreground">
                  Lejárat után a háztartás visszakapja a fizetős csomagját ({billingLabel}).
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="grant-note" className="text-sm font-medium text-foreground">
                Megjegyzés (opcionális)
              </label>
              <textarea
                id="grant-note"
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="pl. 1 hónap ajándék Premium"
              />
            </div>
          </>
        ) : null}
      </div>

      <ModalFormFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Mentés"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}

function formatTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'premium':
      return 'Premium';
    case 'pro':
      return 'Pro';
    default:
      return 'Ingyenes';
  }
}
