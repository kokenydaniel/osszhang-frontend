'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { DEFAULT_POCKET_MONEY_ICON_ID } from '@/config/pocket-money-icons';
import type { PocketMoneyRosterMember } from '@/types/pocket-money';
import { formatDisplayName } from '@/utils/person-name';
import type { UserProfile } from '@/types';
import { PocketMoneyIconPicker } from './pocket-money-icon-picker';
import { PocketMoneyStickerColorPicker } from './pocket-money-sticker-color-picker';
import { PocketMoneyAvatar } from './pocket-money-avatar';

export type PocketMoneyMemberModalMode =
  | { mode: 'create' }
  | { mode: 'edit'; member: PocketMoneyRosterMember };

type PocketMoneyMemberModalProps = {
  open: boolean;
  state: PocketMoneyMemberModalMode | null;
  householdUsers: UserProfile[];
  onClose: () => void;
  onSave: (member: PocketMoneyRosterMember, mode: 'create' | 'update') => Promise<void>;
};

export function PocketMoneyMemberModal({
  open,
  state,
  householdUsers,
  onClose,
  onSave,
}: PocketMoneyMemberModalProps) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState(DEFAULT_POCKET_MONEY_ICON_ID);
  const [stickerColor, setStickerColor] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState<string | null>(null);
  const [memberUserId, setMemberUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = state?.mode === 'edit';

  useEffect(() => {
    if (!open || !state) return;
    if (state.mode === 'edit') {
      setLabel(state.member.label);
      setIcon(state.member.icon);
      setStickerColor(state.member.stickerColor ?? null);
      setIconColor(state.member.iconColor ?? null);
      setMemberUserId(state.member.memberUserId ? String(state.member.memberUserId) : '');
    } else {
      setLabel('');
      setIcon(DEFAULT_POCKET_MONEY_ICON_ID);
      setStickerColor(null);
      setIconColor(null);
      setMemberUserId('');
    }
    setError(null);
  }, [open, state]);

  const onUserLink = (userId: string) => {
    setMemberUserId(userId);
    if (!userId) return;
    const u = householdUsers.find((h) => String(h.id) === userId);
    if (u && !label.trim()) {
      setLabel(formatDisplayName(u.first_name, u.last_name) || u.username);
    }
  };

  const submit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Add meg a gyerek nevét.');
      return;
    }
    if (!state) return;

    const member: PocketMoneyRosterMember = {
      id: state.mode === 'edit' ? state.member.id : '',
      label: trimmed,
      memberUserId: memberUserId ? Number(memberUserId) : null,
      icon,
      stickerColor,
      iconColor,
    };

    setSaving(true);
    setError(null);
    try {
      await onSave(member, state.mode === 'edit' ? 'update' : 'create');
      onClose();
    } catch {
      setError('A mentés nem sikerült.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Gyerek szerkesztése' : 'Új gyerek'}
      description="Név, matrica és ikon — ezt választod ki minden tételnél."
      size="lg"
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
          <PocketMoneyAvatar
            iconId={icon}
            variant="sticker"
            animate={false}
            stickerColor={stickerColor}
            iconColor={iconColor}
          />
          <p className="text-sm text-muted-foreground">
            Így fog kinézni a matrica a kártyán. A színek opcionálisak — „Auto” = automatikus szín az ikonhoz.
          </p>
        </div>

        <FormField label="Név">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="pl. Anna" />
        </FormField>

        <FormField label="Ikon" hint="Válassz egy kedvencet a név mellé.">
          <PocketMoneyIconPicker
            value={icon}
            onChange={setIcon}
            stickerColor={stickerColor}
            iconColor={iconColor}
          />
        </FormField>

        <PocketMoneyStickerColorPicker
          stickerColor={stickerColor}
          iconColor={iconColor}
          onStickerColorChange={setStickerColor}
          onIconColorChange={setIconColor}
        />

        <FormField label="Háztartás tag (opcionális)" hint="Ha van fiókja, összekötheted.">
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-2 text-sm"
            value={memberUserId}
            onChange={(e) => onUserLink(e.target.value)}
          >
            <option value="">Nincs összekötve</option>
            {householdUsers.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {formatDisplayName(u.first_name, u.last_name) || u.username}
              </option>
            ))}
          </select>
        </FormField>

        <ModalFormFooter
          onCancel={onClose}
          submitType="button"
          onSubmit={() => void submit()}
          loading={saving}
          submitLabel={isEdit ? 'Mentés' : 'Hozzáadás'}
        />
      </div>
    </Modal>
  );
}
