'use client';

import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { formatHUF, formatDate } from '@/utils';
import { UtilitySplitRule, UtilityBill } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FieldHint } from '@/components/ui/FieldHint';
import { FormChoiceCard } from '@/components/ui/FormChoiceCard';
import { HELP } from '@/lib/helpTexts';
import { resolveUtilityTemplates } from '@/lib/utilityTemplates';
import { computeUtilityNetBalance } from '@/lib/utilityBalance';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { cn } from '@/lib/utils';
import { ClickableSelect } from '@/components/ui/clickable-select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import {
  PageHeader,
  MetricStrip,
  DataTable,
  Section,
  InsightBanner,
  StatusPill,
  StatusToggleButton,
  EmptyState,
  AccentPanel,
  type MetricItem,
  type DataTableColumn,
} from '@/components/design';
import {
  Receipt,
  Plus,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Users,
  User,
  Edit3,
  Trash2,
  Clock,
  ArrowLeftRight,
  UserCheck,
  RefreshCw,
  XCircle,
  Calendar,
  Copy,
  LayoutTemplate,
  Undo2,
} from 'lucide-react';

export default function UtilitiesClient() {
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
  const { fetchMe } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isReader = user?.role === 'reader';
  const utilitySplitEnabled = user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? true;
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: settling, run: runSettle } = useAsyncAction();
  const { pending: unsettling, run: runUnsettle } = useAsyncAction();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { pending: templating, run: runTemplates } = useAsyncAction();
  const { wrap: wrapBillPending, isPending: isBillPending } = usePendingIds();
  const myName = user?.firstName || 'Mi';
  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const partnerUser =
    user?.id && partnerId && Number(user.id) === Number(partnerId)
      ? user?.household?.users?.find((hu) => Number(hu.id) !== Number(user.id))
      : user?.household?.users?.find((hu) => Number(hu.id) === Number(partnerId)) ||
        user?.household?.users?.find((hu) => Number(hu.id) !== Number(user.id));
  const partnerName = partnerUser?.firstName || 'Családtag';
  const utilityTemplates = resolveUtilityTemplates(user?.household);

  const ourSplitRule: UtilitySplitRule = isAdmin ? 'dani-private' : 'ildi-private';
  const partnerSplitRule: UtilitySplitRule = isAdmin ? 'ildi-private' : 'dani-private';

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
          title: `${myName} fizeti egyedül`,
          description: HELP.utilities.settlementMine,
          example: 'Pl. saját előfizetés, csak te használod',
          icon: User,
        },
        {
          id: partnerSplitRule,
          title: `${partnerName} fizeti egyedül`,
          description: HELP.utilities.settlementPartner,
          example: 'Pl. a partner saját költsége — nálad csak nyilvántartás',
          icon: User,
        },
      ] as const,
    [myName, partnerName, ourSplitRule, partnerSplitRule],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);
  const [type, setType] = useState('');
  const [total, setTotal] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitRule, setSplitRule] = useState<UtilitySplitRule>('shared');

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

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

  const handleGenerateFromTemplates = () => {
    if (isReader || utilityTemplates.length === 0 || templating) return;
    void runTemplates(async () => {
      const targetMonth = selectedMonth.toString().padStart(2, '0');
      const targetYearMonth = `${selectedYear}-${targetMonth}`;
      for (const t of utilityTemplates) {
        const dueDate = `${targetYearMonth}-${String(t.due_day).padStart(2, '0')}`;
        const exists = bills.some((b) => b.type === t.type && b.dueDate.startsWith(targetYearMonth));
        if (!exists) {
          await addBill({
            type: t.type,
            total: t.total,
            dueDate,
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
  } = computeUtilityNetBalance(filteredBills, isAdmin, utilitySplitEnabled);

  const netBalance = monthSettlement ? 0 : rawNetBalance;

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

  const getRuleBadge = (rule: UtilitySplitRule) => {
    if (rule === 'shared') {
      return (
        <StatusPill status="info" size="xs">
          <Users size={9} strokeWidth={2.4} /> Közös 50/50
        </StatusPill>
      );
    }
    const isOurPrivate = isAdmin ? rule === 'dani-private' : rule === 'ildi-private';
    return (
      <StatusPill status="neutral" size="xs">
        <User size={9} strokeWidth={2.4} /> {isOurPrivate ? 'Te' : partnerName}
      </StatusPill>
    );
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
                ? `${partnerName} tartozik`
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
              <Button
                variant="ghost"
                size="xs"
                loading={unsettling}
                onClick={handleUnsettle}
                className="text-[0.7rem] -mr-1"
              >
                {!unsettling && <Undo2 size={11} />} Visszavonás
              </Button>
            ) : !monthSettlement && rawNetBalance !== 0 && isAdmin ? (
              <Button
                variant="ghost"
                size="xs"
                loading={settling}
                onClick={handleSettlement}
                className="text-[0.7rem] -mr-1"
              >
                {!settling && <UserCheck size={11} />} {settling ? 'Elszámolás…' : 'Tartozás rendezése'}
              </Button>
            ) : undefined,
        },
        {
          label: `Te fizettél`,
          value: formatHUF(wePaidGrandTotal),
          info: HELP.utilities.wePaid,
          hint: `${partnerName} tartozása: ${formatHUF(partnerOwesUsTotal)}`,
          icon: Receipt,
          tone: 'primary',
        },
        {
          label: `${partnerName} fizetett`,
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

  const todayStr = new Date().toISOString().split('T')[0];
  const sortedBills = useMemo(
    () => [...filteredBills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [filteredBills],
  );

  const columns: DataTableColumn<UtilityBill>[] = [
    {
      key: 'type',
      header: 'Tétel',
      width: '40%',
      cell: (row) => {
        const isOverdue = !row.paidDate && row.dueDate < todayStr;
        const iconTone = row.paidDate ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', iconTone)}>
              <Receipt size={13} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-foreground truncate flex items-center gap-2">
                <span className="truncate">{row.type}</span>
              </div>
              {utilitySplitEnabled && <div className="mt-0.5">{getRuleBadge(row.splitRule)}</div>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Határidő',
      width: '14%',
      cell: (row) => {
        const isOverdue = !row.paidDate && row.dueDate < todayStr;
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs tabular-nums',
              isOverdue ? 'text-rose-600 font-medium' : 'text-muted-foreground',
            )}
          >
            <Calendar size={11} strokeWidth={2.2} />
            {formatDate(row.dueDate)}
            {isOverdue && <span className="text-[10px] uppercase tracking-wider">lejárt</span>}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Összeg',
      align: 'right',
      width: '14%',
      cell: (row) => (
        <span className="font-semibold tabular-nums text-foreground text-[0.95rem]">{formatHUF(row.total)}</span>
      ),
    },
    {
      key: 'status',
      header: (
        <span className="inline-flex items-center justify-center gap-1 w-full">
          <span>{utilitySplitEnabled ? 'Fizette' : 'Státusz'}</span>
          <InfoTooltip
            content={utilitySplitEnabled ? HELP.utilities.payerSelect : HELP.utilities.statusToggle}
            side="top"
            label={utilitySplitEnabled ? 'Fizette – kattintható' : 'Státusz – kattintható'}
          />
        </span>
      ),
      align: 'center',
      width: '18%',
      cell: (row) => {
        const isOverdue = !row.paidDate && row.dueDate < todayStr;
        if (utilitySplitEnabled) {
          return (
            <ClickableSelect
              value={row.paidBy || 'Fizetendő'}
              tone={row.paidBy ? 'success' : 'warning'}
              title={
                row.paidBy
                  ? `${isAdmin ? (row.paidBy === 'Mi' ? 'Te' : partnerName) : row.paidBy === 'Mi' ? partnerName : 'Te'} fizette — kattints a módosításhoz`
                  : 'Ki fizette? Válassz a legördülőből'
              }
              disabled={isReader || isBillPending(row.id)}
              onChange={(val) => {
                void wrapBillPending(row.id, async () => {
                  if (val === 'Fizetendő') await updateBill(row.id, { paidBy: null, paidDate: null });
                  else
                    await updateBill(row.id, {
                      paidBy: val as 'Mi' | 'Ildi',
                      paidDate: new Date().toISOString().split('T')[0],
                    });
                });
              }}
              options={[
                { value: 'Fizetendő', label: 'Függőben' },
                { value: 'Mi', label: isAdmin ? 'Te' : partnerName },
                { value: 'Ildi', label: isAdmin ? partnerName : 'Te' },
              ]}
            />
          );
        }
        const statusTitle = row.paidDate
          ? 'Kifizetve — kattints visszaállításhoz'
          : isOverdue
            ? 'Lejárt — kattints kifizetettként jelöléshez'
            : 'Várakozik — kattints kifizetettként jelöléshez';
        return (
          <StatusToggleButton
            status={row.paidDate ? 'success' : isOverdue ? 'danger' : 'warning'}
            title={statusTitle}
            pending={isBillPending(row.id)}
            onClick={() =>
              void wrapBillPending(row.id, () =>
                updateBill(row.id, {
                  paidDate: row.paidDate ? null : new Date().toISOString().split('T')[0],
                }),
              )
            }
          >
            {row.paidDate ? (
              <>
                <CheckCircle size={9} /> Kész
              </>
            ) : isOverdue ? (
              <>
                <XCircle size={9} /> Lejárt
              </>
            ) : (
              <>
                <Clock size={9} /> Várakozik
              </>
            )}
          </StatusToggleButton>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '14%',
      cell: (row) =>
        !isReader ? (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Szerkesztés"
              onClick={() => handleEdit(row)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit3 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                requestDelete({
                  title: 'Rezsi tétel törlése',
                  message: `Biztosan törlöd a „${row.type}" számlát? Ez a művelet nem vonható vissza.`,
                  onConfirm: () => deleteBill(row.id),
                })
              }
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-7 max-w-[1500px] mx-auto w-full">
      <PageHeader
        breadcrumbs={[{ label: 'Közüzem' }, { label: 'Rezsi' }]}
        title="Rezsi menedzsment"
        description="Automatikus elszámolás, megosztás és kiegyenlítés."
        actions={
          !isReader ? (
            <>
              <Button
                variant="outline"
                size="sm"
                loading={cloning}
                onClick={() => void runClone(() => clonePreviousMonth(selectedMonth, selectedYear))}
              >
                {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi'}
              </Button>
              {utilityTemplates.length > 0 && (
                <Button variant="outline" size="sm" loading={templating} onClick={handleGenerateFromTemplates}>
                  {!templating && <LayoutTemplate size={13} />} {templating ? 'Generálás…' : 'Sablonból'}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditingBill(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={13} /> Új rögzítés
              </Button>
            </>
          ) : undefined
        }
      />

      {monthSettlement && utilitySplitEnabled && (
        <AccentPanel
          tone="success"
          icon={UserCheck}
          title="Havi tartozás rendezve"
          titleInfo={HELP.utilities.settlementRecord}
          description={monthSettlement.summary}
          action={
            isAdmin ? (
              <Button variant="ghost" size="xs" loading={unsettling} onClick={handleUnsettle}>
                {!unsettling && <Undo2 size={11} />} Visszavonás
              </Button>
            ) : undefined
          }
        >
          <div className="text-sm text-foreground/90 space-y-1">
            <p>
              <span className="text-muted-foreground">Dátum:</span>{' '}
              <span className="font-medium tabular-nums">{formatDate(monthSettlement.settledAt)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Költségvetésben:</span>{' '}
              <span className="font-medium">
                {monthSettlement.direction === 'partner_pays_household' ? 'bevétel' : 'kiadás'}
              </span>
              {' · '}
              <span className="tabular-nums">{formatHUF(monthSettlement.amount)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Aktuális egyenleg:</span>{' '}
              <span className="font-medium">
                {monthSettlement.direction === 'partner_pays_household' ? 'nőtt' : 'csökkent'} ezzel az összeggel
              </span>
            </p>
          </div>
        </AccentPanel>
      )}

      {utilitySplitEnabled && !partnerUser && (
        <InsightBanner tone="warning" icon={AlertTriangle} title="A rezsimegosztás be van kapcsolva">
          Nincs másik tag regisztrálva. Hívj meg egy családtagot a Beállítások oldalon. A felület most a fallback{' '}
          <i>&quot;Családtag&quot;</i> nevet használja.
        </InsightBanner>
      )}

      <MetricStrip items={metrics} columns={4} variant="separated" />

      {aiUtilityAnomalies?.anomalies && aiUtilityAnomalies.anomalies.length > 0 && (
        <AccentPanel
          tone="ai"
          icon={Sparkles}
          title="AI anomáliafigyelés"
          titleInfo={HELP.utilities.aiAnomaly}
          description="A modell az alábbi szokatlan értékeket észlelte"
          action={
            <Button variant="ghost" size="xs" onClick={() => fetchAiUtilityAnomalies(selectedYear, selectedMonth)}>
              <RefreshCw size={11} /> Frissítés
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {aiUtilityAnomalies.anomalies.map(
              (an: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
                <li key={`${an.meter_id}-${an.actual}`} className="text-foreground/80 flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <b className="font-medium text-foreground">{an.meter_name}</b>: {an.reason}{' '}
                    <span className="text-muted-foreground">
                      (tény: {an.actual}, várható: {Math.round(an.expected)})
                    </span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </AccentPanel>
      )}

      <Section
        title={`Számlák · ${selectedYear}. ${String(selectedMonth).padStart(2, '0')}.`}
        description={`${filteredBills.length} rögzített tétel`}
      >
        {sortedBills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nincsenek rögzített tételek"
            description="Másold az előző hónapot, töltsd ki sablonból (Beállítások), vagy rögzíts kézzel."
            action={
              !isReader ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={cloning}
                    onClick={() => void runClone(() => clonePreviousMonth(selectedMonth, selectedYear))}
                  >
                    {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi másolás'}
                  </Button>
                  {utilityTemplates.length > 0 && (
                    <Button size="sm" loading={templating} onClick={handleGenerateFromTemplates}>
                      {!templating && <LayoutTemplate size={13} />} {templating ? 'Generálás…' : 'Sablonból'}
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          />
        ) : (
          <DataTable columns={columns} data={sortedBills} rowKey={(row) => row.id} />
        )}
      </Section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBill ? 'Rezsi szerkesztése' : 'Új rezsi rögzítése'}
        description={utilitySplitEnabled ? HELP.utilities.settlementIntro : undefined}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.utilities.billType}>Típus</FieldLabel>
            <Input value={type} onChange={(e) => setType(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.utilities.billAmount}>Végösszeg</FieldLabel>
            <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.utilities.billDue}>Határidő</FieldLabel>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
          {utilitySplitEnabled && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Ki fizeti ezt a számlát?</p>
              <FieldHint className="-mt-1">
                A választás alapján számolódik a havi rezsi-mérleg ({myName} ↔ {partnerName}).
              </FieldHint>
              <div className="grid gap-2" role="radiogroup" aria-label="Elszámolás módja">
                {settlementOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <FormChoiceCard
                      key={opt.id}
                      selected={splitRule === opt.id}
                      onSelect={() => setSplitRule(opt.id)}
                      title={opt.title}
                      description={opt.description}
                      example={opt.example}
                      icon={Icon}
                    />
                  );
                })}
              </div>
            </div>
          )}
          <Button type="submit" className="mt-1 w-full">
            Mentés
          </Button>
        </form>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
