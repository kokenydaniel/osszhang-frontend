'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, Lock, Users } from 'lucide-react';
import classNames from 'classnames';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useUpgradeModalStore } from '@/stores/useUpgradeModalStore';
import { canCreatePrivateWallet } from '@/lib/checkAccess';
import { canEditHousehold } from '@/lib/householdRole';
import { walletClient } from '@/lib/api-client';
import { mapWalletFromApi } from '@/lib/mapWallet';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { WalletProfile } from '@/types';

interface WalletSwitcherProps {
  className?: string;
  compact?: boolean;
}

function WalletTypeIcon({ isShared, size = 14 }: { isShared: boolean; size?: number }) {
  if (isShared) {
    return <Users size={size} className="shrink-0" aria-hidden />;
  }
  return <Lock size={size} className="shrink-0" aria-hidden />;
}

export function WalletSwitcher({ className, compact = false }: WalletSwitcherProps) {
  const { user, fetchMe } = useAuthStore();
  const { activeWalletId, setActiveWalletId } = useWalletStore();
  const openUpgrade = useUpgradeModalStore((s) => s.open);
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingWalletId, setDeletingWalletId] = useState<number | null>(null);
  const [renamingWalletId, setRenamingWalletId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const wallets = user?.wallets ?? [];
  const canEdit = canEditHousehold(user);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setRenamingWalletId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const activeWallet = wallets.find((w) => w.id === activeWalletId) ?? wallets[0];

  const handleSelect = (walletId: number) => {
    setActiveWalletId(walletId);
    setOpen(false);
    setCreating(false);
  };

  const handleCreateClick = () => {
    if (!canCreatePrivateWallet(user)) {
      openUpgrade({ requiredTier: 'pro', featureLabel: 'Privát kassza' });
      setOpen(false);
      return;
    }
    setCreating(true);
    setNewWalletName('');
  };

  const handleCreateSubmit = async () => {
    const name = newWalletName.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      const res = await walletClient.create({ name, isShared: false });
      const created = mapWalletFromApi(res.data);
      await fetchMe();
      setActiveWalletId(created.id);
      addNotification('Privát kassza létrehozva!', 'success');
      setCreating(false);
      setOpen(false);
      setNewWalletName('');
    } catch {
      addNotification('A kassza létrehozása nem sikerült.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canDeleteWallet = (wallet: WalletProfile) =>
    !wallet.isShared && wallet.ownerId === user?.id;

  const canRenameWallet = (wallet: WalletProfile) =>
    !wallet.isShared && wallet.ownerId === user?.id;

  const startRenameWallet = (wallet: WalletProfile) => {
    setRenamingWalletId(wallet.id);
    setRenameValue(wallet.name);
    setCreating(false);
  };

  const handleRenameSubmit = async (walletId: number) => {
    const name = renameValue.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      await walletClient.update(walletId, { name });
      await fetchMe();
      addNotification('Kassza neve mentve.', 'success');
      setRenamingWalletId(null);
      setRenameValue('');
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
        const shared = useAuthStore.getState().user?.wallets?.find((w) => w.isShared);
        setActiveWalletId(shared?.id ?? null);
      }
      addNotification('Privát kassza törölve.', 'success');
      setOpen(false);
    } catch {
      addNotification('A kassza törlése nem sikerült.', 'error');
    } finally {
      setDeletingWalletId(null);
    }
  };

  const requestDeleteWallet = (wallet: WalletProfile) => {
    requestDelete({
      title: 'Privát kassza törlése',
      message: `Biztosan törlöd a „${wallet.name}" kasszát? A benne lévő tranzakciók, megtakarítások és tartozások véglegesen törlődnek.`,
      confirmText: 'Törlés',
      onConfirm: () => handleDeleteWallet(wallet),
    });
  };

  if (!wallets.length) return null;

  const activeIsShared = activeWallet?.isShared ?? true;

  return (
    <div className={classNames('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={classNames(
          'inline-flex items-center gap-2 rounded-lg border text-sm font-medium text-foreground',
          'hover:bg-muted/60 transition-colors shadow-sm',
          activeIsShared
            ? 'border-sky-500/25 bg-sky-500/5'
            : 'border-violet-500/25 bg-violet-500/5',
          compact ? 'h-8 px-2.5' : 'h-9 px-3',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className={classNames(
            'flex h-6 w-6 items-center justify-center rounded-md shrink-0',
            activeIsShared ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
          )}
        >
          <WalletTypeIcon isShared={activeIsShared} size={13} />
        </span>
        {!compact && (
          <span className="max-w-[140px] truncate">{activeWallet?.name ?? 'Kassza'}</span>
        )}
        <ChevronDown
          size={14}
          className={classNames('text-muted-foreground transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[260px] max-w-[min(calc(100vw-2rem),300px)] rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
        >
          <p className="px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Kasszák
          </p>

          {wallets.map((wallet) => {
            const selected = wallet.id === activeWallet?.id;
            const isShared = wallet.isShared;
            const deletable = canDeleteWallet(wallet);
            const renamable = canRenameWallet(wallet);
            const isRenaming = renamingWalletId === wallet.id;

            if (isRenaming) {
              return (
                <div key={wallet.id} className="px-1 py-1 space-y-2">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Kassza neve"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleRenameSubmit(wallet.id);
                      if (e.key === 'Escape') setRenamingWalletId(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      loading={submitting}
                      onClick={() => void handleRenameSubmit(wallet.id)}
                    >
                      Mentés
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRenamingWalletId(null)}
                    >
                      Mégse
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={wallet.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(wallet.id)}
                  className={classNames(
                    'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    selected
                      ? isShared
                        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <span
                    className={classNames(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      isShared
                        ? 'bg-sky-500/12 text-sky-600 dark:text-sky-400'
                        : 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
                    )}
                  >
                    <WalletTypeIcon isShared={isShared} size={13} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{wallet.name}</span>
                    <span className="block text-[0.65rem] text-muted-foreground">
                      {isShared ? 'Közös kassza' : 'Privát kassza'}
                    </span>
                  </span>
                </button>
                {renamable && (
                  <button
                    type="button"
                    aria-label={`${wallet.name} átnevezése`}
                    onClick={() => startRenameWallet(wallet)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {deletable && (
                  <button
                    type="button"
                    aria-label={`${wallet.name} törlése`}
                    disabled={deletingWalletId === wallet.id}
                    onClick={() => requestDeleteWallet(wallet)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}

          <div className="my-1 h-px bg-border" />

          {creating ? (
            <div className="px-2 py-2 space-y-2">
              <Input
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="Pl. Saját zsebpénz"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreateSubmit();
                  if (e.key === 'Escape') setCreating(false);
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" loading={submitting} onClick={() => void handleCreateSubmit()}>
                  Létrehozás
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
                  Mégse
                </Button>
              </div>
            </div>
          ) : canEdit ? (
            <button
              type="button"
              onClick={handleCreateClick}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus size={14} />
              Új privát kassza
            </button>
          ) : null}
        </div>
      )}
      <ConfirmDeleteModal />
    </div>
  );
}
