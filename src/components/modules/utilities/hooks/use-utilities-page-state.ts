import { useEffect, useMemo } from 'react';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useUtilitiesUiStore } from '@/stores/useUtilitiesUiStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { formatHUF, formatDate, today, compareDates } from '@/utils';
import { resolveUtilityTemplates } from '@/lib/utilityTemplates';
import { billMatchesMonthYear } from '@/lib/utilityBills';
import { computeUtilityNetBalance } from '@/lib/utilityBalance';
import {
  otherPrivateRule,
  resolveUtilitySplitLabels,
  viewerPrivateRule,
} from '@/lib/utilityViewer';
import { HELP } from '@/lib/helpTexts';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { ArrowLeftRight, CheckCircle, Clock, Receipt, User, Users } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export function useUtilitiesPageState() {
  const {
    bills,
    settlements,
    fetchBills,
    addBill,
    deleteBill,
    updateBill,
    clonePreviousMonth,
    settleMonth,
    unsettleMonth,
    aiUtilityAnomalies,
    fetchAiUtilityAnomalies,
  } = useUtilitiesStore();
  const ui = useUtilitiesUiStore();
  const { fetchTransactions } = useBudgetStore();
  const { fetchMe, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const isAdmin = user?.role === 'admin';
  const isReader = isHouseholdReader(user);
  const utilitySplitConfigured =
    user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled = utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const canUseAi = canUseFeature(user, 'ai');
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: settling, run: runSettle } = useAsyncAction();
  const { pending: unsettling, run: runUnsettle } = useAsyncAction();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { pending: templating, run: runTemplates } = useAsyncAction();
  const { wrap: wrapBillPending, isPending: isBillPending } = usePendingIds();
  const utilityLabels = useMemo(() => resolveUtilitySplitLabels(user), [user]);
  const {
    onHouseholdSide,
    partnerId,
    counterpartyLabel,
    partnerSideLabel,
    householdSideLabel,
    splitPartnerUser,
  } = utilityLabels;
  const utilityTemplates = resolveUtilityTemplates(user?.household);

  const ourSplitRule = viewerPrivateRule(onHouseholdSide);
  const partnerSplitRule = otherPrivateRule(onHouseholdSide);

  const settlementOptions = useMemo(
    () =>
      [
        {
          id: 'shared' as const,
          title: 'Közös költség (50–50%)',
          description: HELP.utilities.settlementShared,
          example: 'Villany, gáz, víz a közös háztartásban',
          icon: Users,
        },
        {
          id: ourSplitRule,
          title: `${onHouseholdSide ? 'Te (háztartás)' : 'Te'} fizeti egyedül`,
          description: HELP.utilities.settlementMine,
          example: 'Pl. saját előfizetés, csak te használod',
          icon: User,
        },
        {
          id: partnerSplitRule,
          title: `${onHouseholdSide ? partnerSideLabel : householdSideLabel} fizeti egyedül`,
          description: HELP.utilities.settlementPartner,
          example: 'Pl. a partner saját költsége — nálad csak nyilvántartás',
          icon: User,
        },
      ] as const,
    [onHouseholdSide, partnerSideLabel, householdSideLabel, ourSplitRule, partnerSplitRule],
  );

  useEffect(() => {
    if (bills.length === 0 && settlements.length === 0) {
      fetchBills();
    }
  }, [bills.length, settlements.length, fetchBills]);

  useEffect(() => {
    if (!canUseAi) return;
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [canUseAi, fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  const filteredBills = bills.filter((b) => billMatchesMonthYear(b.dueDate, selectedMonth, selectedYear));

  const handleGenerateFromTemplates = () => {
    if (isReader || utilityTemplates.length === 0 || templating) return;
    void runTemplates(async () => {
      const targetMonth = selectedMonth.toString().padStart(2, '0');
      const targetYearMonth = `${selectedYear}-${targetMonth}`;
      for (const t of utilityTemplates) {
        const billDueDate = `${targetYearMonth}-${String(t.due_day).padStart(2, '0')}`;
        const exists = bills.some((b) => b.type === t.type && b.dueDate.startsWith(targetYearMonth));
        if (!exists) {
          await addBill({
            type: t.type,
            total: t.total,
            dueDate: billDueDate,
            splitRule: t.split_rule,
            paidBy: null,
            paidDate: null,
          });
        }
      }
    });
  };

  const monthSettlement = settlements.find((s) => s.year === selectedYear && s.month === selectedMonth);

  const {
    partnerOwesUs: partnerOwesUsTotal,
    weOwePartner: weOwePartnerTotal,
    wePaidGrandTotal,
    partnerPaidGrandTotal,
    netBalance: rawNetBalance,
  } = computeUtilityNetBalance(filteredBills, user?.id, partnerId, utilitySplitEnabled);

  const handleSettlement = () => {
    if (!isAdmin || rawNetBalance === 0 || monthSettlement || settling) return;
    void runSettle(async () => {
      const settlement = await settleMonth(selectedMonth, selectedYear);
      void Promise.all([fetchTransactions(), fetchMe()]);
      addNotification(
        settlement.direction === 'partner_pays_household'
          ? `Elszámolás rögzítve — bevétel és egyenleg +${formatHUF(settlement.amount)}`
          : `Elszámolás rögzítve — kiadás és egyenleg −${formatHUF(settlement.amount)}`,
        'success',
      );
    });
  };

  const handleUnsettle = () => {
    if (!isAdmin || !monthSettlement) return;
    requestDelete({
      title: 'Elszámolás visszavonása',
      message:
        'A havi rezsi elszámolás törlődik, az aktuális egyenleg visszaáll, és a kapcsolódó költségvetési tétel is eltűnik (ha még megvan). Biztosan folytatod?',
      onConfirm: async () => {
        await runUnsettle(async () => {
          await unsettleMonth(selectedMonth, selectedYear);
          void Promise.all([fetchTransactions(), fetchMe()]);
          addNotification('Elszámolás visszavonva.', 'success');
        });
      },
    });
  };

  const balanceMetricAction: 'settle' | 'unsettle' | null =
    utilitySplitEnabled && isAdmin
      ? monthSettlement
        ? 'unsettle'
        : rawNetBalance !== 0
          ? 'settle'
          : null
      : null;

  const paidCount = filteredBills.filter((b) => !!b.paidDate).length;
  const totalCount = filteredBills.length;
  const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  const metrics: MetricItem[] = utilitySplitEnabled
    ? [
        {
          label: monthSettlement
            ? 'Elszámolás'
            : rawNetBalance === 0
              ? 'Nincs tartozás'
              : rawNetBalance > 0
                ? `${counterpartyLabel} tartozik`
                : 'Te tartozol',
          value: monthSettlement
            ? 'Rendezve'
            : rawNetBalance === 0
              ? 'Kvitt'
              : formatHUF(Math.abs(rawNetBalance)),
          info: HELP.utilities.balance,
          hint: monthSettlement
            ? formatDate(monthSettlement.settledAt)
            : rawNetBalance === 0
              ? 'Nincs kifizetendő különbség'
              : 'Ebben a hónapban',
          icon: ArrowLeftRight,
          tone: monthSettlement || rawNetBalance === 0 ? 'success' : rawNetBalance > 0 ? 'success' : 'danger',
          emphasis: true,
        },
        {
          label: `Te fizettél`,
          value: formatHUF(wePaidGrandTotal),
          info: HELP.utilities.wePaid,
          hint: `${counterpartyLabel} tartozása: ${formatHUF(partnerOwesUsTotal)}`,
          icon: Receipt,
          tone: 'primary',
        },
        {
          label: `${counterpartyLabel} fizetett`,
          value: formatHUF(partnerPaidGrandTotal),
          info: HELP.utilities.partnerPaid,
          hint: `Te tartozol: ${formatHUF(weOwePartnerTotal)}`,
          icon: Receipt,
          tone: 'info',
        },
        {
          label: 'Készültség',
          value: `${paidPercent}%`,
          info: HELP.utilities.readiness,
          hint: `${paidCount}/${totalCount} kifizetve`,
          icon: CheckCircle,
          tone: paidPercent === 100 ? 'success' : paidPercent > 50 ? 'warning' : 'default',
        },
      ]
    : [
        {
          label: 'Havi összes',
          value: formatHUF(filteredBills.reduce((s, b) => s + b.total, 0)),
          info: HELP.utilities.totalBills,
          hint: 'Tárgyhavi összes',
          icon: Receipt,
          tone: 'primary',
        },
        {
          label: 'Kifizetve',
          value: formatHUF(filteredBills.filter((b) => !!b.paidDate).reduce((s, b) => s + b.total, 0)),
          info: HELP.utilities.paid,
          hint: 'Kiegyenlített számlák',
          icon: CheckCircle,
          tone: 'success',
        },
        {
          label: 'Várakozik',
          value: formatHUF(filteredBills.filter((b) => !b.paidDate).reduce((s, b) => s + b.total, 0)),
          info: HELP.utilities.waiting,
          hint: 'Függőben lévő',
          icon: Clock,
          tone: 'warning',
        },
        {
          label: 'Készültség',
          value: `${paidPercent}%`,
          info: HELP.utilities.readiness,
          hint: `${paidCount}/${totalCount} tétel`,
          icon: CheckCircle,
          tone: paidPercent === 100 ? 'success' : 'default',
        },
      ];

  const todayStr = today();
  const sortedBills = useMemo(
    () => [...filteredBills].sort((a, b) => compareDates(a.dueDate, b.dueDate)),
    [filteredBills],
  );

  return {
    user,
    isAdmin,
    isReader,
    utilitySplitEnabled,
    utilityLabels,
    utilityTemplates,
    selectedMonth,
    selectedYear,
    cloning,
    runClone,
    clonePreviousMonth,
    templating,
    handleGenerateFromTemplates,
    openNewBillModal: ui.openNewBillModal,
    monthSettlement,
    splitPartnerUser,
    settling,
    unsettling,
    handleSettlement,
    handleUnsettle,
    balanceMetricAction,
    metrics,
    aiUtilityAnomalies,
    fetchAiUtilityAnomalies,
    canUseAi,
    filteredBills,
    sortedBills,
    todayStr,
    isModalOpen: ui.isModalOpen,
    setIsModalOpen: ui.setIsModalOpen,
    editingBill: ui.editingBill,
    type: ui.type,
    setType: ui.setType,
    total: ui.total,
    setTotal: ui.setTotal,
    dueDate: ui.dueDate,
    setDueDate: ui.setDueDate,
    splitRule: ui.splitRule,
    setSplitRule: ui.setSplitRule,
    settlementOptions,
    householdSideLabel,
    partnerSideLabel,
    handleSubmit: (e: React.FormEvent) => ui.handleSubmit(e, { isReader, utilitySplitEnabled }),
    handleEdit: ui.handleEdit,
    deleteBill,
    updateBill,
    requestDelete,
    wrapBillPending,
    isBillPending,
    ConfirmDeleteModal,
  };
}

export type UtilitiesPageState = ReturnType<typeof useUtilitiesPageState>;
