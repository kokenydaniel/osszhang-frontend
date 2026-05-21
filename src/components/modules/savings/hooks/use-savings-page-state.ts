'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { resolveSavingsSettings } from '@/lib/savingsSettings';
import { formatHUF } from '@/utils';
import { Investment, LedgerEntry } from '@/types';
import { HELP } from '@/lib/helpTexts';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { PiggyBank, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export function useSavingsPageState() {
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

  const { user } = useAuthStore();
  const savingsSettings = useMemo(() => resolveSavingsSettings(user?.household), [user?.household]);
  const separateOwner = savingsSettings.separate_owner.trim();

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

  const closeLedgerModal = () => {
    setIsLedgerModalOpen(false);
    setSelectedSavings(null);
    clearLedgerForm();
  };

  const openLedgerModal = (accId: number) => {
    setSelectedSavings(accId);
    clearLedgerForm();
    setIsLedgerModalOpen(true);
  };

  const startEditLedger = (item: LedgerEntry) => {
    setEditingLedgerId(item.id);
    setLedgerAmount(String(Math.abs(item.amount)));
    setLedgerType(item.amount >= 0 ? 'deposit' : 'withdraw');
    setLedgerReason(item.reason);
    setLedgerDate(item.date);
  };

  const handleLedgerSubmit = async () => {
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
  };

  const handleDeleteLedgerEntry = (item: LedgerEntry, ledgerCurrency: string) => {
    requestDelete({
      title: 'Tétel törlése',
      message: `Biztosan törlöd a „${item.reason}" tételt (${formatCurrencyAmount(item.amount, ledgerCurrency)})?`,
      onConfirm: () => {
        if (!selectedSavings) return;
        deleteLedgerEntry(selectedSavings, item.id);
        if (editingLedgerId === item.id) clearLedgerForm();
      },
    });
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

  const startEditInvestmentValue = (inv: Investment, totalValue: number) => {
    setEditingInvId(inv.id);
    setEditingInvValue(inv.currentValue ? String(inv.currentValue) : Math.round(totalValue).toString());
  };

  const saveInvestmentValue = (invId: number) => {
    updateInvestment(invId, { currentValue: Number(editingInvValue) });
    setEditingInvId(null);
  };

  const cancelEditInvestmentValue = () => {
    setEditingInvId(null);
  };

  const saveInvestmentPayout = (invId: number) => {
    updateInvestment(invId, {
      nextPayoutAmount: Number(editingPayoutAmount),
      nextPayoutDate: editingPayoutDate || null,
    });
    setEditingPayoutInvId(null);
  };

  const personalSavings = separateOwner ? savings.filter((s) => s.owner !== separateOwner) : savings;
  const wifeSavings = separateOwner ? savings.filter((s) => s.owner === separateOwner) : [];
  const personalInvestments = separateOwner
    ? investments.filter((i) => i.owner !== separateOwner)
    : investments;
  const wifeInvestments = separateOwner
    ? investments.filter((i) => i.owner === separateOwner)
    : [];

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
      label: separateOwner ? 'Saját + Közös' : 'Megtakarítások',
      value: formatHUF(sumPersonal),
      info: HELP.savings.personal,
      hint: `${personalSavings.length} számla · ${personalInvestments.length} papír`,
      icon: Wallet,
      tone: 'primary',
      emphasis: true,
    },
    ...(separateOwner
      ? [
          {
            label: separateOwner,
            value: formatHUF(sumWife),
            info: HELP.savings.wife,
            hint: `${wifeSavings.length} számla · ${wifeInvestments.length} papír`,
            icon: PiggyBank,
            tone: 'info' as const,
          },
        ]
      : []),
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

  const selectedAccount = savings.find((s) => s.id === selectedSavings);
  const ledgerCurrency = selectedAccount?.currency || 'HUF';
  const ledgerItems = selectedAccount?.ledger ?? [];

  return {
    savings,
    investments,
    separateOwner,
    convertToHUF,
    formatCurrencyAmount,
    personalSavings,
    wifeSavings,
    personalInvestments,
    wifeInvestments,
    sumPersonalInvestments,
    sumWifeInvestments,
    savingsMetrics,
    getInvestmentValue,
    getMaturityAmount,
    updateSavingsAccount,
    deleteSavingsAccount,
    updateInvestment,
    deleteInvestment,
    requestDelete,
    isLedgerModalOpen,
    closeLedgerModal,
    openLedgerModal,
    selectedSavings,
    ledgerType,
    setLedgerType,
    ledgerAmount,
    setLedgerAmount,
    ledgerReason,
    setLedgerReason,
    ledgerDate,
    setLedgerDate,
    editingLedgerId,
    clearLedgerForm,
    startEditLedger,
    handleLedgerSubmit,
    handleDeleteLedgerEntry,
    ledgerCurrency,
    ledgerItems,
    isNewAssetModalOpen,
    setIsNewAssetModalOpen,
    newAssetInitialKind,
    openNewAsset,
    editingInvId,
    editingInvValue,
    setEditingInvValue,
    editingPayoutInvId,
    setEditingPayoutInvId,
    editingPayoutAmount,
    setEditingPayoutAmount,
    editingPayoutDate,
    setEditingPayoutDate,
    startEditInvestmentValue,
    saveInvestmentValue,
    cancelEditInvestmentValue,
    saveInvestmentPayout,
    ConfirmDeleteModal,
  };
}

export type SavingsPageState = ReturnType<typeof useSavingsPageState>;
