import { useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, Lock, Users } from 'lucide-react';
import classNames from 'classnames';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { WalletProfile } from '@/types';

export interface WalletSwitcherProps {
  className?: string;
  compact?: boolean;
  fullWidthMobile?: boolean;
  
  wallets: WalletProfile[];
  activeWalletId: number | null;
  canEdit: boolean;
  canCreatePrivate: boolean;
  userId?: number;
  submitting: boolean;
  deletingWalletId: number | null;
  
  onSelectWallet: (id: number) => void;
  onCreateSubmit: (name: string) => Promise<void>;
  onRenameSubmit: (id: number, name: string) => Promise<void>;
  onRequestDeleteWallet: (wallet: WalletProfile) => void;
  onRequestUpgrade: () => void;
}

function WalletTypeIcon({ isShared, size = 14 }: { isShared: boolean; size?: number }) {
  if (isShared) {
    return <Users size={size} className="shrink-0" aria-hidden />;
  }
  return <Lock size={size} className="shrink-0" aria-hidden />;
}

export function WalletSwitcher({
  className,
  compact = false,
  fullWidthMobile = true,
  wallets,
  activeWalletId,
  canEdit,
  canCreatePrivate,
  userId,
  submitting,
  deletingWalletId,
  onSelectWallet,
  onCreateSubmit,
  onRenameSubmit,
  onRequestDeleteWallet,
  onRequestUpgrade,
}: WalletSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [renamingWalletId, setRenamingWalletId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeWallet = wallets.find((w) => w.id === activeWalletId) ?? wallets[0];
  const activeIsShared = activeWallet?.is_shared ?? true;

  const canDeleteWallet = (wallet: WalletProfile) => !wallet.is_shared && wallet.owner_id === userId;
  const canRenameWallet = (wallet: WalletProfile) => !wallet.is_shared && wallet.owner_id === userId;

  const handleSelect = (walletId: number) => {
    onSelectWallet(walletId);
    setOpen(false);
    setCreating(false);
  };

  const handleCreateClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (!canCreatePrivate) {
      onRequestUpgrade();
      setOpen(false);
      return;
    }
    setCreating(true);
    setNewWalletName('');
  };

  const handleCreateSubmitAction = async () => {
    const name = newWalletName.trim();
    if (!name) return;
    await onCreateSubmit(name);
    setCreating(false);
    setOpen(false);
    setNewWalletName('');
  };

  const startRenameWallet = (e: React.MouseEvent<HTMLElement>, wallet: WalletProfile) => {
    e.preventDefault();
    e.stopPropagation();
    setRenamingWalletId(wallet.id);
    setRenameValue(wallet.name);
    setCreating(false);
  };

  const handleRenameSubmitAction = async (walletId: number) => {
    const name = renameValue.trim();
    if (!name) return;
    await onRenameSubmit(walletId, name);
    setRenamingWalletId(null);
    setRenameValue('');
  };

  return (
    <div className={classNames('relative min-w-0', fullWidthMobile ? 'w-full sm:w-auto' : 'w-auto', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={classNames(
              'inline-flex min-w-0 items-center gap-2 rounded-lg border text-sm font-medium text-foreground',
              'hover:bg-muted/60 transition-colors shadow-sm touch-manipulation',
              activeIsShared
                ? 'border-sky-500/25 bg-sky-500/5'
                : 'border-violet-500/25 bg-violet-500/5',
              compact ? 'h-8 px-2.5' : 'h-9 px-3',
              fullWidthMobile ? 'w-full justify-between sm:w-auto sm:justify-start sm:max-w-[12rem]' : 'max-w-[12rem]',
            )}
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
              <span className="min-w-0 truncate text-left">{activeWallet?.name ?? 'Kassza'}</span>
            )}
            <ChevronDown
              size={14}
              className={classNames(
                'text-muted-foreground transition-transform shrink-0',
                fullWidthMobile && 'ml-auto sm:ml-0',
                open && 'rotate-180',
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[calc(100vw-24px)] max-w-[300px] max-h-[min(70vh,calc(100dvh-6rem))] overflow-y-auto overscroll-contain"
        >
          <DropdownMenuLabel className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            Kasszák
          </DropdownMenuLabel>

          {wallets.map((wallet) => {
            const selected = wallet.id === activeWallet?.id;
            const isShared = wallet.is_shared;
            const isRenaming = renamingWalletId === wallet.id;

            if (isRenaming) {
              return (
                <div key={wallet.id} className="px-2 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Kassza neve"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleRenameSubmitAction(wallet.id);
                      if (e.key === 'Escape') setRenamingWalletId(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      loading={submitting}
                      onClick={() => void handleRenameSubmitAction(wallet.id)}
                    >
                      Mentés
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRenamingWalletId(null)}>
                      Mégse
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={wallet.id} className="flex items-center gap-0.5 px-1 py-0.5">
                <DropdownMenuItem
                  className={classNames(
                    'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors cursor-pointer',
                    selected
                      ? isShared
                        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 focus:bg-sky-500/10 focus:text-sky-700 dark:focus:text-sky-300'
                        : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 focus:bg-violet-500/10 focus:text-violet-700 dark:focus:text-violet-300'
                      : 'text-foreground',
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleSelect(wallet.id);
                  }}
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
                </DropdownMenuItem>

                {canRenameWallet(wallet) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={(e) => startRenameWallet(e, wallet)}
                  >
                    <Pencil size={14} />
                  </Button>
                )}
                {canDeleteWallet(wallet) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingWalletId === wallet.id}
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      onRequestDeleteWallet(wallet);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            );
          })}

          <DropdownMenuSeparator />

          {creating ? (
            <div className="px-2 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="Pl. Saját zsebpénz"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreateSubmitAction();
                  if (e.key === 'Escape') setCreating(false);
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" loading={submitting} onClick={() => void handleCreateSubmitAction()}>
                  Létrehozás
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
                  Mégse
                </Button>
              </div>
            </div>
          ) : canEdit ? (
            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground cursor-pointer mx-1 mb-1"
              onSelect={(e: Event) => handleCreateClick(e as unknown as React.MouseEvent<HTMLElement>)}
            >
              <Plus size={14} />
              Új privát kassza
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
