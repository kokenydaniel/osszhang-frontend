'use client';

import { useState } from 'react';
import { StatusCodes } from '@/types/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useUpgradeModalStore } from '@/stores/useUpgradeModalStore';
import { canCreatePrivateWallet } from '@/helpers/check-access';
import { canEditHousehold } from '@/utils/household-role';
import { walletClient } from '@/lib/api-client';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { WalletProfile } from '@/types';
import { WalletSwitcher } from './wallet-switcher';

interface WalletSwitcherContainerProps {
  className?: string;
  compact?: boolean;
  fullWidthMobile?: boolean;
}

export function WalletSwitcherContainer(props: WalletSwitcherContainerProps) {
  const { user, fetchMe } = useAuthStore();
  const { activeWalletId, setActiveWalletId } = useWalletStore();
  const openUpgrade = useUpgradeModalStore((s) => s.open);
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const [submitting, setSubmitting] = useState(false);
  const [deletingWalletId, setDeletingWalletId] = useState<number | null>(null);

  const wallets = user?.wallets ?? [];
  const canEdit = canEditHousehold(user);

  const handleCreateSubmit = async (name: string) => {
    setSubmitting(true);
    try {
      const res = await walletClient.create({ name, isShared: false });
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) throw new Error('API Error');
      const rawWallet = res[1];
      const created = {
        ...rawWallet,
        id: rawWallet.id,
        householdId: rawWallet.household_id,
        ownerId: rawWallet.owner_id,
        isShared: rawWallet.is_shared,
        manualBalance: rawWallet.manual_balance,
      };
      await fetchMe();
      setActiveWalletId(created.id);
      addNotification('Privát kassza létrehozva!', 'success');
    } catch {
      addNotification('A kassza létrehozása nem sikerült.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenameSubmit = async (walletId: number, name: string) => {
    setSubmitting(true);
    try {
      await walletClient.update(walletId, { name });
      await fetchMe();
      addNotification('Kassza neve mentve.', 'success');
    } catch {
      addNotification('Az átnevezés nem sikerült.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWallet = async (wallet: WalletProfile) => {
    setDeletingWalletId(wallet.id);
    try {
      await walletClient.delete(wallet.id);
      await fetchMe();
      if (activeWalletId === wallet.id) {
        const shared = useAuthStore.getState().user?.wallets?.find((w) => w.is_shared);
        setActiveWalletId(shared?.id ?? null);
      }
      addNotification('Privát kassza törölve.', 'success');
    } catch {
      addNotification('A kassza törlése nem sikerült.', 'error');
    } finally {
      setDeletingWalletId(null);
    }
  };

  const requestDeleteWallet = (wallet: WalletProfile) => {
    requestDelete({
      title: 'Privát kassza törlése',
      message: `Biztosan törlöd a „${wallet.name}” kasszát? A benne lévő tranzakciók, megtakarítások és tartozások véglegesen törlődnek.`,
      confirmText: 'Törlés',
      onConfirm: () => handleDeleteWallet(wallet),
    });
  };

  const onRequestUpgrade = () => {
    openUpgrade({ requiredTier: 'pro', featureLabel: 'Privát kassza', featureId: 'private_wallet' });
  };

  if (!wallets.length) return null;

  return (
    <>
      <WalletSwitcher
        {...props}
        wallets={wallets}
        activeWalletId={activeWalletId}
        canEdit={canEdit}
        canCreatePrivate={canCreatePrivateWallet(user)}
        userId={user?.id}
        submitting={submitting}
        deletingWalletId={deletingWalletId}
        onSelectWallet={setActiveWalletId}
        onCreateSubmit={handleCreateSubmit}
        onRenameSubmit={handleRenameSubmit}
        onRequestDeleteWallet={requestDeleteWallet}
        onRequestUpgrade={onRequestUpgrade}
      />
      <ConfirmDeleteModal />
    </>
  );
}
