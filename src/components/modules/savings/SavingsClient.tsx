'use client';

import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF, formatDate } from '@/utils';
import { LedgerEntry } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { NewAssetModal } from '@/components/modules/savings/NewAssetModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { cn } from '@/lib/utils';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { motion } from 'motion/react';
import {
  PageHeader,
  MetricStrip,
  SegmentedControl,
  Section,
  EmptyState,
  StatusPill,
  type MetricItem,
} from '@/components/design';
import {
  Plus,
  Trash2,
  PiggyBank,
  Wallet,
  TrendingUp,
  History,
  Pencil,
  Edit3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface Investment {
  id: number;
  name: string;
  type: string;
  owner: string;
  principalAmount: number;
  currentValue?: number | null;
  annualInterestRate: number;
  purchaseDate: string;
  maturityDate?: string | null;
  maturityAmount?: number | null;
  nextPayoutAmount?: number | null;
  nextPayoutDate?: string | null;
  countInSavings?: boolean;
}

export default function SavingsClient() {
  const {
    savings,
    updateSavingsAccount,
    deleteSavingsAccount,
    addLedgerEntry,
    updateLedgerEntry,
    deleteLedgerEntry,
    investments,
    updateInvestment,
    deleteInvestment,
  } = useSavingsStore();

  const { exchangeRates, refreshRates } = usePreferenceStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  const convertToHUF = (amount: number, currency: string) => (exchangeRates[currency] || 1) * amount;

  const formatCurrencyAmount = (amount: number, currency: string) => {
    if (currency === 'HUF') return formatHUF(amount);
    const maxFractionDigits = currency === 'BTC' || currency === 'ETH' ? 8 : 2;
    return `${amount.toLocaleString('hu-HU', { maximumFractionDigits: maxFractionDigits })} ${currency}`;
  };

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedSavings, setSelectedSavings] = useState<number | null>(null);
  const [ledgerType, setLedgerType] = useState<'deposit' | 'withdraw'>('deposit');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerReason, setLedgerReason] = useState('');
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingLedgerId, setEditingLedgerId] = useState<number | null>(null);

  const clearLedgerForm = () => {
    setLedgerAmount('');
    setLedgerReason('');
    setLedgerDate(new Date().toISOString().split('T')[0]);
    setLedgerType('deposit');
    setEditingLedgerId(null);
  };

  const startEditLedger = (item: LedgerEntry) => {
    setEditingLedgerId(item.id);
    setLedgerAmount(String(Math.abs(item.amount)));
    setLedgerType(item.amount >= 0 ? 'deposit' : 'withdraw');
    setLedgerReason(item.reason);
    setLedgerDate(item.date);
  };

  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [newAssetInitialKind, setNewAssetInitialKind] = useState<'account' | 'investment'>('account');

  const openNewAsset = (kind: 'account' | 'investment' = 'account') => {
    setNewAssetInitialKind(kind);
    setIsNewAssetModalOpen(true);
  };

  const [editingInvId, setEditingInvId] = useState<number | null>(null);
  const [editingInvValue, setEditingInvValue] = useState('');
  const [editingPayoutInvId, setEditingPayoutInvId] = useState<number | null>(null);
  const [editingPayoutAmount, setEditingPayoutAmount] = useState('');
  const [editingPayoutDate, setEditingPayoutDate] = useState('');

  const getInvestmentValue = (inv: Investment) => {
    const purchase = new Date(inv.purchaseDate);
    const now = new Date();
    const diffDays = Math.ceil(Math.max(0, now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
    if (inv.currentValue !== undefined && inv.currentValue !== null && Number(inv.currentValue) > 0) {
      const totalValue = Number(inv.currentValue);
      return { totalValue, accruedInterest: totalValue - Number(inv.principalAmount), daysPassed: diffDays, isManualOverride: true };
    }
    const dailyRate = Number(inv.annualInterestRate) / 100 / 365.25;
    const accruedInterest = Number(inv.principalAmount) * diffDays * dailyRate;
    return { totalValue: Number(inv.principalAmount) + accruedInterest, accruedInterest, daysPassed: diffDays, isManualOverride: false };
  };

  const getMaturityAmount = (inv: Investment) => {
    if (inv.maturityAmount) return inv.maturityAmount;
    if (inv.name.toUpperCase().includes('DKJ') && inv.maturityDate) {
      const purchase = new Date(inv.purchaseDate);
      const maturity = new Date(inv.maturityDate);
      const diffDays = Math.ceil(Math.max(0, maturity.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        const rate = Number(inv.annualInterestRate) / 100;
        return Math.round(Number(inv.principalAmount) * (1 + rate * (diffDays / 365.25)));
      }
    }
    return null;
  };

  const personalSavings = savings.filter((s) => s.owner !== 'Little Loom');
  const wifeSavings = savings.filter((s) => s.owner === 'Little Loom');
  const personalInvestments = (investments as Investment[]).filter((i) => i.owner !== 'Little Loom');
  const wifeInvestments = (investments as Investment[]).filter((i) => i.owner === 'Little Loom');

  const sumPersonalInvestments = personalInvestments
    .filter((i) => i.countInSavings !== false)
    .reduce((sum, inv) => sum + getInvestmentValue(inv).totalValue, 0);
  const sumWifeInvestments = wifeInvestments
    .filter((i) => i.countInSavings !== false)
    .reduce((sum, inv) => sum + getInvestmentValue(inv).totalValue, 0);
  const sumPersonal =
    personalSavings
      .filter((s) => s.count_in_savings !== false)
      .reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s, l) => s + l.amount, 0), acc.currency), 0) +
    sumPersonalInvestments;
  const sumWife =
    wifeSavings
      .filter((s) => s.count_in_savings !== false)
      .reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s, l) => s + l.amount, 0), acc.currency), 0) +
    sumWifeInvestments;

  const savingsMetrics: MetricItem[] = [
    {
      label: 'Saját + Közös',
      value: formatHUF(sumPersonal),
      info: HELP.savings.personal,
      hint: `${personalSavings.length} számla · ${personalInvestments.length} papír`,
      icon: Wallet,
      tone: 'primary',
      emphasis: true,
    },
    {
      label: 'Little Loom',
      value: formatHUF(sumWife),
      info: HELP.savings.wife,
      hint: `${wifeSavings.length} számla · ${wifeInvestments.length} papír`,
      icon: PiggyBank,
      tone: 'info',
    },
    {
      label: 'Teljes vagyon',
      value: formatHUF(sumPersonal + sumWife),
      info: HELP.savings.totalWealth,
      hint: 'Számlák és állampapírok',
      icon: TrendingUp,
      tone: 'success',
      emphasis: true,
    },
    {
      label: 'Befektetési arány',
      value:
        sumPersonal + sumWife > 0
          ? `${Math.round(((sumPersonalInvestments + sumWifeInvestments) / (sumPersonal + sumWife)) * 100)}%`
          : '0%',
      info: HELP.savings.investRatio,
      hint: `${formatHUF(sumPersonalInvestments + sumWifeInvestments)} állampapír`,
      icon: Sparkles,
      tone: 'default',
    },
  ];

  const SavingsAccountCard = ({ acc, accent }: { acc: typeof savings[number]; accent: 'primary' | 'rose' }) => {
    const balance = acc.ledger.reduce((s, l) => s + l.amount, 0);
    const inactive = acc.count_in_savings === false;
    return (
      <motion.div
        layout={false}
        whileHover={{ y: -2 }}
        className={cn(
          'rounded-lg border border-border bg-card p-5 flex flex-col gap-4 transition-shadow shadow-soft hover:shadow-lift',
          inactive && 'opacity-60',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md shadow-sm',
                accent === 'primary'
                  ? 'bg-gradient-to-br from-primary to-violet-500 text-primary-foreground'
                  : 'bg-gradient-to-br from-rose-400 to-pink-500 text-white',
              )}
            >
              <Wallet size={15} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground tracking-tight truncate">{acc.institution}</p>
              <p className="text-xs text-muted-foreground">
                {acc.owner} · {acc.currency}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              requestDelete({
                title: 'Számla törlése',
                message: `Biztosan törlöd a „${acc.institution}" számlát és az összes mozgást? Ez a művelet nem vonható vissza.`,
                onConfirm: () => deleteSavingsAccount(acc.id),
              })
            }
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <div>
          <p
            className={cn(
              'text-2xl font-semibold tracking-tight tabular-nums leading-none',
              accent === 'primary' ? 'text-primary' : 'text-rose-600',
            )}
          >
            {formatCurrencyAmount(balance, acc.currency)}
          </p>
          {acc.currency !== 'HUF' && (
            <p className="text-[0.7rem] text-muted-foreground mt-1.5 tabular-nums">
              ≈ {formatHUF(convertToHUF(balance, acc.currency))}{' '}
              <span className="opacity-60">(árfolyamon)</span>
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <button
              type="button"
              onClick={() => updateSavingsAccount(acc.id, { count_in_savings: !acc.count_in_savings })}
              className={cn(
                'relative h-4 w-7 rounded-full transition-colors',
                acc.count_in_savings !== false ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all',
                  acc.count_in_savings !== false ? 'left-[14px]' : 'left-0.5',
                )}
              />
            </button>
            <span title="Beleszámít a fő vagyon összegébe a Széf nézetben">Vagyonba</span>
          </label>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setSelectedSavings(acc.id);
              clearLedgerForm();
              setIsLedgerModalOpen(true);
            }}
          >
            <History size={12} /> Történet
          </Button>
        </div>
      </motion.div>
    );
  };

  const InvestmentCard = ({ inv }: { inv: Investment }) => {
    const { totalValue, accruedInterest, daysPassed } = getInvestmentValue(inv);
    const inactive = inv.countInSavings === false;
    const mAmount = getMaturityAmount(inv);
    const isEditingValue = editingInvId === inv.id;
    const isEditingPayout = editingPayoutInvId === inv.id;

    return (
      <motion.div
        layout={false}
        whileHover={{ y: -2 }}
        className={cn(
          'rounded-lg border border-border bg-card p-5 flex flex-col gap-4 transition-shadow shadow-soft hover:shadow-lift',
          inactive && 'opacity-60',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
              <Sparkles size={15} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground tracking-tight truncate">{inv.name}</p>
              <p className="text-xs text-muted-foreground">
                {inv.owner} · {inv.type === 'bond' ? 'Állampapír' : inv.type}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              requestDelete({
                title: 'Befektetés törlése',
                message: `Biztosan törlöd a „${inv.name}" befektetést? Ez a művelet nem vonható vissza.`,
                onConfirm: () => deleteInvestment(inv.id),
              })
            }
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
              {isEditingValue ? 'Új érték (Ft)' : 'Aktuális érték'}
            </span>
            {!isEditingValue && (
              <button
                onClick={() => {
                  setEditingInvId(inv.id);
                  setEditingInvValue(inv.currentValue ? String(inv.currentValue) : Math.round(totalValue).toString());
                }}
                className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil size={9} /> Szerkeszt
              </button>
            )}
          </div>
          {isEditingValue ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={editingInvValue}
                onChange={(e) => setEditingInvValue(e.target.value)}
                autoFocus
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateInvestment(inv.id, { currentValue: Number(editingInvValue) });
                    setEditingInvId(null);
                  } else if (e.key === 'Escape') {
                    setEditingInvId(null);
                  }
                }}
              />
              <Button
                size="xs"
                onClick={() => {
                  updateInvestment(inv.id, { currentValue: Number(editingInvValue) });
                  setEditingInvId(null);
                }}
              >
                OK
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setEditingInvId(null)}>
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-emerald-600 tabular-nums tracking-tight leading-none">
                {formatHUF(totalValue)}
              </p>
              {inv.currentValue ? (
                <StatusPill status="success" size="xs">MÁK valós</StatusPill>
              ) : (
                <StatusPill status="neutral" size="xs">Becsült</StatusPill>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-xs">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Tőke</p>
            <p className="text-foreground tabular-nums mt-0.5">{formatHUF(inv.principalAmount)}</p>
          </div>
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Éves kamat</p>
            <p className="text-foreground tabular-nums mt-0.5">{inv.annualInterestRate}%</p>
          </div>
          {mAmount && (
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Lejáratkor</p>
              <p className="text-amber-700 tabular-nums mt-0.5">{formatHUF(mAmount)}</p>
            </div>
          )}
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
              Hozam ({daysPassed} nap)
            </p>
            <p className={cn('tabular-nums mt-0.5', accruedInterest >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {accruedInterest >= 0 ? '+' : ''}
              {formatHUF(accruedInterest)}
            </p>
          </div>
        </div>

        {isEditingPayout && (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-2">
            <Input
              type="number"
              value={editingPayoutAmount}
              onChange={(e) => setEditingPayoutAmount(e.target.value)}
              placeholder="Összeg"
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={editingPayoutDate}
              onChange={(e) => setEditingPayoutDate(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex gap-1.5">
              <Button
                size="xs"
                onClick={() => {
                  updateInvestment(inv.id, {
                    nextPayoutAmount: Number(editingPayoutAmount),
                    nextPayoutDate: editingPayoutDate || null,
                  });
                  setEditingPayoutInvId(null);
                }}
                className="flex-1"
              >
                Mentés
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setEditingPayoutInvId(null)} className="flex-1">
                Mégse
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <label className="inline-flex items-center gap-2 text-xs text-foreground">
            <button
              type="button"
              onClick={() => updateInvestment(inv.id, { countInSavings: !inv.countInSavings })}
              className={cn(
                'relative h-4 w-7 rounded-full transition-colors',
                inv.countInSavings !== false ? 'bg-emerald-500' : 'bg-muted-foreground/30',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all',
                  inv.countInSavings !== false ? 'left-[14px]' : 'left-0.5',
                )}
              />
            </button>
            <span title="Beleszámít a fő vagyon összegébe a Széf nézetben">Vagyonba</span>
          </label>
          <span className="text-[0.65rem] text-muted-foreground tabular-nums">
            {formatDate(inv.purchaseDate)}
            {inv.maturityDate && ` → ${formatDate(inv.maturityDate)}`}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Megtakarítások' }, { label: 'Széf' }]}
        title="Megtakarítások · Széf"
        description="Számlák, állampapírok és vagyon — egy nézetben."
        actions={
          <Button size="sm" onClick={() => openNewAsset()}>
            <Plus size={13} /> Új
          </Button>
        }
      />

      <MetricStrip items={savingsMetrics} columns={4} variant="separated" />

      <Section
        title="Saját és közös számlák"
        description={`${personalSavings.length} aktív számla`}
      >
        {personalSavings.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nincs saját vagy közös számla"
            description="Adj hozzá egy új számlát a jobb felső sarokban lévő „Új” gombbal."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {personalSavings.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="primary" />
            ))}
          </div>
        )}
      </Section>

      {wifeSavings.length > 0 && (
        <Section title="Little Loom számlák" description={`${wifeSavings.length} aktív számla`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wifeSavings.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="rose" />
            ))}
          </div>
        </Section>
      )}

      <Section
        title="Állampapírok és kincstári számlák"
        description={`${investments.length} aktív befektetés · ${formatHUF(
          sumPersonalInvestments + sumWifeInvestments,
        )} össz érték`}
      >
        {investments.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nincs befektetés"
            description="Adj hozzá állampapírt a jobb felső sarokban lévő „Új” gombbal (Állampapír fül)."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(investments as Investment[]).map((inv) => (
              <InvestmentCard key={inv.id} inv={inv} />
            ))}
          </div>
        )}
      </Section>

      <NewAssetModal
        isOpen={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        initialKind={newAssetInitialKind}
      />

      {/* LEDGER MODAL */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedSavings(null);
          clearLedgerForm();
        }}
        title="Számla történet"
        description={
          editingLedgerId
            ? 'Tétel szerkesztése — módosítsd az adatokat, majd mentsd.'
            : 'Új mozgás rögzítése vagy korábbi tétel javítása.'
        }
        contentKey={`${ledgerType}-${editingLedgerId ?? 'new'}`}
      >
        <div className="flex flex-col gap-4">
          <SegmentedControl
            variant="choice"
            value={ledgerType}
            onChange={(v) => setLedgerType(v as 'deposit' | 'withdraw')}
            options={[
              {
                value: 'deposit',
                label: 'Befizetés',
                icon: ArrowUpRight,
                tone: 'positive',
                description: 'Növeli az egyenleget',
              },
              {
                value: 'withdraw',
                label: 'Kivétel',
                icon: ArrowDownRight,
                tone: 'negative',
                description: 'Csökkenti az egyenleget',
              },
            ]}
            animated={false}
          />
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.historyAmount}>Összeg</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={ledgerAmount}
              onChange={(e) => setLedgerAmount(e.target.value)}
              step="any"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.historyNote}>Megjegyzés</FieldLabel>
            <Input
              placeholder="pl. Utalás a közösbe"
              value={ledgerReason}
              onChange={(e) => setLedgerReason(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Dátum</FieldLabel>
            <DatePicker value={ledgerDate} onChange={setLedgerDate} />
          </div>
          <div className="flex gap-2">
            {editingLedgerId && (
              <Button type="button" variant="outline" className="flex-1" onClick={clearLedgerForm}>
                Mégse
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={!ledgerAmount.trim() || !ledgerReason.trim()}
              onClick={async () => {
                if (!selectedSavings) return;
                const cleanAmount = ledgerAmount.replace(',', '.');
                const amt = ledgerType === 'deposit' ? Number(cleanAmount) : -Number(cleanAmount);
                if (editingLedgerId) {
                  await updateLedgerEntry(selectedSavings, editingLedgerId, {
                    date: ledgerDate,
                    amount: amt,
                    reason: ledgerReason,
                  });
                  clearLedgerForm();
                } else {
                  await addLedgerEntry(selectedSavings, {
                    date: ledgerDate,
                    amount: amt,
                    reason: ledgerReason,
                  });
                  clearLedgerForm();
                }
              }}
            >
              {editingLedgerId ? (
                <>
                  <Pencil size={13} /> Mentés
                </>
              ) : (
                <>
                  <Plus size={13} /> Rögzítés
                </>
              )}
            </Button>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Korábbi tételek
            </p>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
              {(() => {
                const acc = savings.find((s) => s.id === selectedSavings);
                const ledgerCurrency = acc?.currency || 'HUF';
                const items = acc?.ledger;
                if (!items || items.length === 0) {
                  return <p className="text-xs text-muted-foreground text-center py-4">Még nincsenek tételek.</p>;
                }
                return items
                  .slice()
                  .reverse()
                  .map((item: LedgerEntry) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 bg-muted/40 border rounded-md px-3 py-2',
                        editingLedgerId === item.id ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.reason}</p>
                        <p className="text-[0.7rem] text-muted-foreground tabular-nums">{formatDate(item.date)}</p>
                      </div>
                      <p
                        className={cn(
                          'text-sm font-semibold tabular-nums shrink-0',
                          item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {item.amount >= 0 ? '+' : ''}
                        {formatCurrencyAmount(item.amount, ledgerCurrency)}
                      </p>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Szerkesztés"
                          onClick={() => startEditLedger(item)}
                        >
                          <Edit3 size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Törlés"
                          onClick={() =>
                            requestDelete({
                              title: 'Tétel törlése',
                              message: `Biztosan törlöd a „${item.reason}" tételt (${formatCurrencyAmount(item.amount, ledgerCurrency)})?`,
                              onConfirm: () => {
                                if (!selectedSavings) return;
                                deleteLedgerEntry(selectedSavings, item.id);
                                if (editingLedgerId === item.id) clearLedgerForm();
                              },
                            })
                          }
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
