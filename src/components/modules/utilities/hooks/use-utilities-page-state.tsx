'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { formatHUF, formatDate } from '@/utils';
import { UtilitySplitRule, UtilityBill } from '@/types';
import { resolveUtilityTemplates } from '@/lib/utilityTemplates';
import { computeUtilityNetBalance } from '@/lib/utilityBalance';
import {
  otherPrivateRule,
  resolveUtilitySplitLabels,
  viewerPrivateRule,
} from '@/lib/utilityViewer';
import { HELP } from '@/lib/helpTexts';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { metricDebtHint, SettleDebtButton, UnsettleDebtButton } from '@/components/modules/utilities/utilities-settlement-buttons';
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
  const { fetchTransactions } = useBudgetStore();
  const { fetchMe, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const isAdmin = user?.role === 'admin';
  const isReader = user?.role === 'reader';
  const utilitySplitEnabled = user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);
  const [type, setType] = useState('');
  const [total, setTotal] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitRule, setSplitRule] = useState<UtilitySplitRule>('shared');

  useEffect(() => {
    if (bills.length === 0 && settlements.length === 0) {
      fetchBills();
    }
  }, [bills.length, settlements.length, fetchBills]);

  useEffect(() => {
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  const filteredBills = bills.filter((b) => {
    const d = new Date(b.dueDate);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReader) return;
    if (!total) return;
    const targetSplitRule = utilitySplitEnabled ? splitRule : 'dani-private';
    if (editingBill) {
      updateBill(editingBill.id, { type, total: Number(total), dueDate, splitRule: targetSplitRule });
      setEditingBill(null);
    } else {
      addBill({ type, total: Number(total), dueDate, paidDate: null, paidBy: null, splitRule: targetSplitRule });
    }
    setIsModalOpen(false);
    setType('');
    setTotal('');
    setSplitRule('shared');
  };

  const handleEdit = (bill: UtilityBill) => {
    setEditingBill(bill);
    setType(bill.type);
    setTotal(bill.total.toString());
    setDueDate(bill.dueDate);
    setSplitRule(bill.splitRule);
    setIsModalOpen(true);
  };

  const openNewBillModal = () => {
    setEditingBill(null);
    setIsModalOpen(true);
  };

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
          action:
            monthSettlement && isAdmin ? (
              <UnsettleDebtButton loading={unsettling} onClick={handleUnsettle} />
            ) : !monthSettlement && rawNetBalance !== 0 && isAdmin ? (
              <SettleDebtButton loading={settling} onClick={handleSettlement} />
            ) : undefined,
        },
        {
          label: `Te fizettél`,
          value: formatHUF(wePaidGrandTotal),
          info: HELP.utilities.wePaid,
          hint: metricDebtHint(`${counterpartyLabel} tartozása:`, partnerOwesUsTotal),
          icon: Receipt,
          tone: 'primary',
        },
        {
          label: `${counterpartyLabel} fizetett`,
          value: formatHUF(partnerPaidGrandTotal),
          info: HELP.utilities.partnerPaid,
          hint: metricDebtHint('Te tartozol:', weOwePartnerTotal),
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

  const todayStr = new Date().toISOString().split('T')[0];
  const sortedBills = useMemo(
    () => [...filteredBills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
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
    openNewBillModal,
    monthSettlement,
    splitPartnerUser,
    settling,
    unsettling,
    handleSettlement,
    handleUnsettle,
    metrics,
    aiUtilityAnomalies,
    fetchAiUtilityAnomalies,
    filteredBills,
    sortedBills,
    todayStr,
    isModalOpen,
    setIsModalOpen,
    editingBill,
    type,
    setType,
    total,
    setTotal,
    dueDate,
    setDueDate,
    splitRule,
    setSplitRule,
    settlementOptions,
    householdSideLabel,
    partnerSideLabel,
    handleSubmit,
    handleEdit,
    deleteBill,
    updateBill,
    requestDelete,
    wrapBillPending,
    isBillPending,
    ConfirmDeleteModal,
  };
}

export type UtilitiesPageState = ReturnType<typeof useUtilitiesPageState>;
