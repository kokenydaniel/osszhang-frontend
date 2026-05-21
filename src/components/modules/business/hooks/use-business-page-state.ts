'use client';

import { useState, useMemo } from 'react';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import {
  resolveBusinessSettings,
  pickDefaultChannel,
  pickDefaultPayment,
  pickDefaultProvider,
  pickDefaultDestination,
} from '@/lib/businessSettings';
import { formatHUF } from '@/utils';
import { BusinessOrder } from '@/types';
import { HELP } from '@/lib/helpTexts';
import { aiFinanceClient } from '@/lib/api-client';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import {
  ShoppingBag,
  List,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Banknote,
} from 'lucide-react';
import type { MetricItem } from '@/components/design';

export function useBusinessPageState() {
  const { orders, addOrder, deleteOrder, updateOrder, shopifyImport } = useBusinessStore();
  const { user } = useAuthStore();
  const shopifyImportEnabled =
    user?.household?.shopifyImportEnabled ?? user?.household?.shopify_import_enabled ?? false;
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const bizOptions = useMemo(() => resolveBusinessSettings(user?.household), [user?.household]);
  const [activeTab, setActiveTab] = useState<'monthly' | 'summary'>('monthly');
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [realAiAdvice, setRealAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [channel, setChannel] = useState(() => pickDefaultChannel(bizOptions));
  const [payment, setPayment] = useState(() => pickDefaultPayment(bizOptions));
  const [provider, setProvider] = useState(() => pickDefaultProvider(bizOptions));
  const [destination, setDestination] = useState(() => pickDefaultDestination(bizOptions));
  const [paidDate, setPaidDate] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState('');

  const selectedYearMonthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const filteredOrders = useMemo(
    () =>
      orders
        .filter((o) => o.date.startsWith(selectedYearMonthPrefix))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [orders, selectedYearMonthPrefix],
  );

  const openForm = (order?: BusinessOrder) => {
    if (order) {
      setEditId(order.id);
      setCustomer(order.customerName || '');
      setAmount(String(order.amount || ''));
      setOrderDate(order.date || new Date().toISOString().split('T')[0]);
      setChannel(order.channel || pickDefaultChannel(bizOptions));
      setPayment(order.paymentMethod || pickDefaultPayment(bizOptions));
      setProvider(order.provider || pickDefaultProvider(bizOptions));
      setDestination(order.destination || pickDefaultDestination(bizOptions));
      setPaidDate(order.paidDate || '');
      setInvoiceId(order.invoiceId || '');
    } else {
      setEditId(null);
      setCustomer('');
      setAmount('');
      setOrderDate(new Date().toISOString().split('T')[0]);
      setChannel(pickDefaultChannel(bizOptions));
      setPayment(pickDefaultPayment(bizOptions));
      setProvider(pickDefaultProvider(bizOptions));
      setDestination(pickDefaultDestination(bizOptions));
      setPaidDate('');
      setInvoiceId('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !customer) return;
    const payload = {
      date: orderDate,
      customerName: customer,
      channel,
      paymentMethod: payment,
      provider,
      destination,
      amount: Number(amount),
      paidDate: paidDate || null,
      invoiceId,
      state: (paidDate ? 'RENDBEN' : 'KINT') as 'RENDBEN' | 'KINT',
    };
    if (editId) updateOrder(editId, payload);
    else addOrder(payload);
    setIsModalOpen(false);
  };

  const handleShopifySync = async () => {
    setIsSyncing(true);
    try {
      await shopifyImport();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const businessStats = useMemo(() => {
    const yearOrders = orders.filter((o) => o.date.startsWith(String(selectedYear)));
    const totalYTD = yearOrders.reduce((s, o) => s + o.amount, 0);
    const aov = yearOrders.length > 0 ? totalYTD / yearOrders.length : 0;
    const channelMap = orders.reduce((acc, o) => {
      acc[o.channel] = (acc[o.channel] || 0) + o.amount;
      return acc;
    }, {} as Record<string, number>);
    const topChannel = Object.entries(channelMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nincs adat';
    const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const chartData = months.map((m, i) => {
      const mStr = (i + 1).toString().padStart(2, '0');
      const prefix = `${selectedYear}-${mStr}`;
      const mOrders = orders.filter((o) => o.date.startsWith(prefix));
      const received = mOrders.filter((o) => !!o.paidDate).reduce((s, o) => s + o.amount, 0);
      const pending = mOrders.filter((o) => !o.paidDate).reduce((s, o) => s + o.amount, 0);
      return { name: m, bevetel: received, kintlevoseg: pending };
    });
    let aiAdvice = 'A vállalkozásod adatai stabilak. ';
    if (topChannel === 'Meska') aiAdvice += 'A Meska kiemelkedően teljesít, érdemes ott egyedi kampányokat indítani. ';
    if (totalYTD > 1000000) aiAdvice += 'Gratulálunk, átlépted az 1 milliós éves forgalmat! ';
    if (aov < 5000) aiAdvice += 'Az átlagos kosárérték növeléséhez érdemes kiegészítő termékeket ajánlani a pénztárnál. ';
    return { totalYTD, aov, topChannel, channelData, chartData, aiAdvice };
  }, [orders, selectedYear]);

  const handleRequestAiAdvice = async () => {
    setIsAiLoading(true);
    try {
      const prompt = `Kérlek, elemezd az alábbi Little Loom (kisvállalkozás, kézműves webshop) rendelési és bevételi adataimat a(z) ${selectedYear}. évre vonatkozóan, és adj egy 3-4 mondatos barátságos, motiváló stratégiát és tanácsot, hogy hogyan tudnám növelni a bevételem.

Adataim:
- Éves forgalom eddig (YTD): ${businessStats.totalYTD} Ft
- Átlagos rendelési érték (AOV): ${Math.round(businessStats.aov)} Ft
- Legjobban teljesítő csatorna: ${businessStats.topChannel}
- Csatornák szerinti bevételek: ${businessStats.channelData.map((c) => c.name + ': ' + c.value + ' Ft').join(', ')}`;
      const response = await aiFinanceClient.query(prompt, false);
      setRealAiAdvice(response.data.answer);
    } catch (error) {
      console.error('Failed to get AI advice', error);
      setRealAiAdvice('Sajnos nem sikerült elérni az AI szolgáltatást. Kérlek próbáld újra később.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const { totalYTD, aov, topChannel, channelData, chartData, aiAdvice } = businessStats;
  const totalMonthlyIncome = filteredOrders.reduce((s, o) => s + o.amount, 0);
  const totalMonthlyPaid = filteredOrders.filter((o) => o.state === 'RENDBEN').reduce((s, o) => s + o.amount, 0);
  const totalMonthlyPending = filteredOrders.filter((o) => o.state !== 'RENDBEN').reduce((s, o) => s + o.amount, 0);

  const monthlySparkline = chartData
    .slice(Math.max(0, selectedMonth - 6), selectedMonth)
    .map((d) => d.bevetel + d.kintlevoseg);
  const incomeSparkline = chartData.slice(Math.max(0, selectedMonth - 6), selectedMonth).map((d) => d.bevetel);
  const pendingSparkline = chartData.slice(Math.max(0, selectedMonth - 6), selectedMonth).map((d) => d.kintlevoseg);

  const monthlyMetrics: MetricItem[] = [
    {
      label: 'Havi forgalom',
      value: formatHUF(totalMonthlyIncome),
      info: HELP.business.monthlyRevenue,
      hint: `${filteredOrders.length} rendelés`,
      icon: TrendingUp,
      tone: 'primary',
      emphasis: true,
      sparkline: monthlySparkline.length > 1 ? monthlySparkline : undefined,
    },
    {
      label: 'Beérkezett',
      value: formatHUF(totalMonthlyPaid),
      info: HELP.business.paid,
      hint: 'Kifizetve / lekönyvelve',
      icon: CheckCircle,
      tone: 'success',
      sparkline: incomeSparkline.length > 1 ? incomeSparkline : undefined,
    },
    {
      label: 'Kintlévőség',
      value: formatHUF(totalMonthlyPending),
      info: HELP.business.pending,
      hint: 'Még nem teljesült',
      icon: AlertCircle,
      tone: totalMonthlyPending > 0 ? 'warning' : 'default',
      sparkline: pendingSparkline.length > 1 ? pendingSparkline : undefined,
    },
    {
      label: 'Konverzió',
      value: filteredOrders.length > 0 ? `${Math.round((filteredOrders.filter((o) => o.state === 'RENDBEN').length / filteredOrders.length) * 100)}%` : '—',
      info: HELP.business.conversion,
      hint: `${filteredOrders.filter((o) => o.state === 'RENDBEN').length}/${filteredOrders.length} fizetve`,
      icon: CheckCircle,
      tone: 'info',
    },
  ];

  const yearlyTotalsSpark = chartData.map((d) => d.bevetel);
  const summaryMetrics: MetricItem[] = [
    {
      label: 'YTD forgalom',
      value: formatHUF(totalYTD),
      info: HELP.business.ytd,
      hint: `${selectedYear} év eddig`,
      icon: TrendingUp,
      tone: 'primary',
      emphasis: true,
      sparkline: yearlyTotalsSpark,
    },
    {
      label: 'AOV',
      value: formatHUF(aov),
      info: HELP.business.aov,
      hint: 'Átlagos rendelési érték',
      icon: Banknote,
      tone: 'info',
    },
    {
      label: 'Top csatorna',
      value: topChannel,
      info: HELP.business.topChannel,
      hint: 'Legmagasabb bevétel',
      icon: ShoppingBag,
      tone: 'success',
    },
    {
      label: 'Csatornák',
      value: String(channelData.length),
      info: HELP.business.channelCount,
      hint: 'Aktív értékesítési csatorna',
      icon: List,
      tone: 'default',
    },
  ];

  return {
    selectedMonth,
    selectedYear,
    activeTab,
    setActiveTab,
    filteredOrders,
    monthlyMetrics,
    summaryMetrics,
    shopifyImportEnabled,
    isSyncing,
    handleShopifySync,
    openForm,
    deleteOrder,
    requestDelete,
    isModalOpen,
    setIsModalOpen,
    editId,
    customer,
    setCustomer,
    amount,
    setAmount,
    orderDate,
    setOrderDate,
    channel,
    setChannel,
    payment,
    setPayment,
    provider,
    setProvider,
    destination,
    setDestination,
    paidDate,
    setPaidDate,
    invoiceId,
    setInvoiceId,
    bizOptions,
    handleSubmit,
    realAiAdvice,
    isAiLoading,
    handleRequestAiAdvice,
    aiAdvice,
    chartData,
    channelData,
    totalYTD,
    ConfirmDeleteModal,
  };
}

export type BusinessPageState = ReturnType<typeof useBusinessPageState>;
