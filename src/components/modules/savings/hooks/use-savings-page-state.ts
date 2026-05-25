import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useSavingsUiStore } from '@/stores/useSavingsUiStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { resolveSavingsSettings } from '@/lib/savingsSettings';
import { savingsBalance } from '@/lib/mapSavings';
import { formatHUF } from '@/utils';
import { dayjs, d } from '@/lib/dates';
import { Investment, LedgerEntry } from '@/types';
import { HELP } from '@/lib/helpTexts';
import { isHouseholdReader } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { PiggyBank, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export function useSavingsPageState() {
  const {
    savings,
    updateSavingsAccount,
    deleteSavingsAccount,
    deleteLedgerEntry,
    investments,
    updateInvestment,
    deleteInvestment,
    fetchSavings,
    loadedWalletId,
    isLoading: walletLoading,
  } = useSavingsStore();
  const ui = useSavingsUiStore();
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const isReader = isHouseholdReader(user);
  const savingsSettings = useMemo(() => resolveSavingsSettings(user?.household), [user?.household]);
  const separateOwner = savingsSettings.separate_owner.trim();
  const { exchangeRates, refreshRates, selectedMonth, selectedYear } = usePreferenceStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const pathname = usePathname();

  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  useEffect(() => {
    if (activeWalletId === null || !pathname.startsWith('/savings')) return;
    void fetchSavings(activeWalletId, { silent: true, forceReload: true });
  }, [activeWalletId, fetchSavings, pathname]);

  const walletDataReady =
    activeWalletId !== null && !walletLoading && loadedWalletId === activeWalletId;

  const convertToHUF = (amount: number, currency: string) => (exchangeRates[currency] || 1) * amount;

  const formatCurrencyAmount = (amount: number, currency: string) => {
    if (currency === 'HUF') return formatHUF(amount);
    const maxFractionDigits = currency === 'BTC' || currency === 'ETH' ? 8 : 2;
    return `${amount.toLocaleString('hu-HU', { maximumFractionDigits: maxFractionDigits })} ${currency}`;
  };

  const getInvestmentValue = (inv: Investment) => {
    const purchase = d(inv.purchaseDate);
    const now = dayjs();
    const diffDays = Math.ceil(Math.max(0, now.diff(purchase, 'day')));
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
      const purchase = d(inv.purchaseDate);
      const maturity = d(inv.maturityDate);
      const diffDays = Math.ceil(Math.max(0, maturity.diff(purchase, 'day')));
      if (diffDays > 0) {
        const rate = Number(inv.annualInterestRate) / 100;
        return Math.round(Number(inv.principalAmount) * (1 + rate * (diffDays / 365.25)));
      }
    }
    return null;
  };

  const handleDeleteLedgerEntry = (item: LedgerEntry, ledgerCurrency: string) => {
    requestDelete({
      title: 'Tétel törlése',
      message: `Biztosan törlöd a „${item.reason}" tételt (${formatCurrencyAmount(item.amount, ledgerCurrency)})?`,
      onConfirm: () => {
        if (!ui.selectedSavings) return;
        deleteLedgerEntry(ui.selectedSavings, item.id);
        if (ui.editingLedgerId === item.id) ui.clearLedgerForm();
      },
    });
  };

  const accounts = savings.filter((s) => s.type === 'account');
  const goals = savings.filter((s) => s.type === 'goal');

  const personalAccounts = separateOwner ? accounts.filter((s) => s.owner !== separateOwner) : accounts;
  const wifeAccounts = separateOwner ? accounts.filter((s) => s.owner === separateOwner) : [];
  const personalInvestments = separateOwner ? investments.filter((i) => i.owner !== separateOwner) : investments;
  const wifeInvestments = separateOwner ? investments.filter((i) => i.owner === separateOwner) : [];

  const sumPersonalInvestments = personalInvestments
    .filter((i) => i.countInSavings !== false)
    .reduce((sum, inv) => sum + getInvestmentValue(inv).totalValue, 0);
  const sumWifeInvestments = wifeInvestments
    .filter((i) => i.countInSavings !== false)
    .reduce((sum, inv) => sum + getInvestmentValue(inv).totalValue, 0);
  const sumPersonal =
    [...personalAccounts, ...goals.filter((g) => !separateOwner || g.owner !== separateOwner)]
      .filter((s) => s.count_in_savings !== false)
      .reduce((sum, acc) => sum + convertToHUF(savingsBalance(acc), acc.currency), 0) + sumPersonalInvestments;
  const sumWife =
    [...wifeAccounts, ...goals.filter((g) => separateOwner && g.owner === separateOwner)]
      .filter((s) => s.count_in_savings !== false)
      .reduce((sum, acc) => sum + convertToHUF(savingsBalance(acc), acc.currency), 0) + sumWifeInvestments;

  const savingsMetrics: MetricItem[] = [
    {
      label: separateOwner ? 'Saját + Közös' : 'Megtakarítások',
      value: formatHUF(sumPersonal),
      info: HELP.savings.personal,
      hint: `${personalAccounts.length} számla · ${goals.length} cél · ${personalInvestments.length} papír`,
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
            hint: `${wifeAccounts.length} számla · ${wifeInvestments.length} papír`,
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

  const selectedAccount = savings.find((s) => s.id === ui.selectedSavings);
  const ledgerCurrency = selectedAccount?.currency || 'HUF';
  const ledgerItems = selectedAccount?.ledger ?? [];

  return {
    savings,
    investments,
    separateOwner,
    convertToHUF,
    formatCurrencyAmount,
    goals,
    accounts,
    personalAccounts,
    wifeAccounts,
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
    isLedgerModalOpen: ui.isLedgerModalOpen,
    closeLedgerModal: ui.closeLedgerModal,
    openLedgerModal: ui.openLedgerModal,
    selectedSavings: ui.selectedSavings,
    ledgerType: ui.ledgerType,
    setLedgerType: ui.setLedgerType,
    ledgerAmount: ui.ledgerAmount,
    setLedgerAmount: ui.setLedgerAmount,
    ledgerReason: ui.ledgerReason,
    setLedgerReason: ui.setLedgerReason,
    ledgerDate: ui.ledgerDate,
    setLedgerDate: ui.setLedgerDate,
    editingLedgerId: ui.editingLedgerId,
    clearLedgerForm: ui.clearLedgerForm,
    startEditLedger: ui.startEditLedger,
    handleLedgerSubmit: ui.handleLedgerSubmit,
    handleDeleteLedgerEntry,
    ledgerCurrency,
    ledgerItems,
    isNewAssetModalOpen: ui.isNewAssetModalOpen,
    setIsNewAssetModalOpen: ui.setIsNewAssetModalOpen,
    newAssetInitialKind: ui.newAssetInitialKind,
    openNewAsset: ui.openNewAsset,
    editingInvId: ui.editingInvId,
    editingInvValue: ui.editingInvValue,
    setEditingInvValue: ui.setEditingInvValue,
    editingPayoutInvId: ui.editingPayoutInvId,
    setEditingPayoutInvId: ui.setEditingPayoutInvId,
    editingPayoutAmount: ui.editingPayoutAmount,
    setEditingPayoutAmount: ui.setEditingPayoutAmount,
    editingPayoutDate: ui.editingPayoutDate,
    setEditingPayoutDate: ui.setEditingPayoutDate,
    startEditInvestmentValue: ui.startEditInvestmentValue,
    saveInvestmentValue: ui.saveInvestmentValue,
    cancelEditInvestmentValue: ui.cancelEditInvestmentValue,
    saveInvestmentPayout: ui.saveInvestmentPayout,
    isReader,
    walletDataReady,
    selectedMonth,
    selectedYear,
    ConfirmDeleteModal,
  };
}

export type SavingsPageState = ReturnType<typeof useSavingsPageState>;
