'use client';

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
import { OptionsSelect } from '@/components/ui/OptionsSelect';
import { formatHUF, formatDate } from '@/utils';
import { useState, useMemo } from 'react';
import { BusinessOrder } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LabelWithInfo } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { aiFinanceClient } from '@/api/aiFinanceClient';
import { cn } from '@/lib/utils';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import {
  PageHeader,
  MetricStrip,
  SegmentedControl,
  DataTable,
  Section,
  AccentPanel,
  StatusPill,
  EmptyState,
  type MetricItem,
  type DataTableColumn,
} from '@/components/design';
import {
  ShoppingBag,
  List,
  BarChart3,
  Plus,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  User,
  TrendingUp,
  AlertCircle,
  Truck,
  Banknote,
  RefreshCw,
  Cpu,
  Sparkles,
  FileText,
  Calendar,
} from 'lucide-react';

export default function BusinessClient() {
  const { orders, addOrder, deleteOrder, updateOrder, shopifyImport } = useBusinessStore();
  const { user } = useAuthStore();
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

  const getChannelIcon = (c: string) => {
    const l = c.toLowerCase();
    if (l.includes('webshop') || l.includes('shopify')) return ShoppingBag;
    if (l.includes('piac') || l.includes('mesk')) return Truck;
    if (l.includes('privát')) return User;
    return ShoppingBag;
  };

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

  const orderColumns: DataTableColumn<BusinessOrder>[] = [
    {
      key: 'customer',
      header: 'Vevő',
      width: '24%',
      cell: (order) => {
        const ChannelIcon = getChannelIcon(order.channel);
        const tone = order.state === 'RENDBEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', tone)}>
              <ChannelIcon size={13} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-foreground truncate">{order.customerName}</div>
              {order.shopifyOrderNumber && (
                <div className="text-[0.65rem] font-mono text-muted-foreground mt-0.5">{order.shopifyOrderNumber}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'channel',
      header: 'Csatorna',
      width: '14%',
      cell: (order) => <span className="text-xs text-foreground/85">{order.channel}</span>,
    },
    {
      key: 'payment',
      header: 'Fizetés',
      width: '16%',
      cell: (order) => (
        <div className="text-xs">
          <div className="text-foreground/85">{order.paymentMethod}</div>
          <div className="text-muted-foreground text-[10px]">{order.provider}</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Dátum',
      width: '12%',
      cell: (order) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Calendar size={11} strokeWidth={2.2} /> {formatDate(order.date)}
        </span>
      ),
    },
    {
      key: 'invoice',
      header: 'Számla',
      width: '10%',
      cell: (order) =>
        order.invoiceId ? (
          <span className="inline-flex items-center gap-1 text-[0.7rem] font-mono bg-muted/60 text-foreground/75 px-1.5 py-0.5 rounded">
            <FileText size={10} strokeWidth={2.2} /> {order.invoiceId}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Összeg',
      align: 'right',
      width: '12%',
      cell: (order) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(order.amount)}</span>
      ),
    },
    {
      key: 'state',
      header: 'Státusz',
      align: 'center',
      width: '8%',
      cell: (order) =>
        order.state === 'RENDBEN' ? (
          <StatusPill status="success" dot>Rendben</StatusPill>
        ) : (
          <StatusPill status="warning" dot>Kint</StatusPill>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '8%',
      cell: (order) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => openForm(order)}>
            <Edit3 size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() =>
              requestDelete({
                title: 'Rendelés törlése',
                message: `Biztosan törlöd a „${order.customerName || 'névtelen'}" rendelést? Ez a művelet nem vonható vissza.`,
                onConfirm: () => deleteOrder(order.id),
              })
            }
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const channelColors = ['oklch(0.55 0.22 275)', 'oklch(0.62 0.22 25)', 'oklch(0.72 0.16 60)', 'oklch(0.65 0.18 150)'];

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Vállalkozás' }, { label: 'Little Loom' }]}
        title="Little Loom CRM"
        description={`${selectedYear}. ${String(selectedMonth).padStart(2, '0')}. havi rendelések, kintlévőségek és éves trendek`}
        actions={
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as 'monthly' | 'summary')}
            options={[
              { value: 'monthly', label: 'Rendelések', icon: List, count: filteredOrders.length },
              { value: 'summary', label: 'Éves trendek', icon: BarChart3 },
            ]}
          />
        }
      />

      <MetricStrip items={activeTab === 'monthly' ? monthlyMetrics : summaryMetrics} columns={4} variant="separated" />

      {activeTab === 'monthly' && (
        <Section
          title={`Rendelések · ${selectedYear}. ${String(selectedMonth).padStart(2, '0')}.`}
          description="Hivatalos rendelési napló · Shopify-import támogatással"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShopifySync} disabled={isSyncing}>
                <RefreshCw size={13} className={cn(isSyncing && 'animate-spin')} />
                {isSyncing ? 'Szinkron…' : 'Shopify import'}
              </Button>
              <Button size="sm" onClick={() => openForm()}>
                <Plus size={13} /> Új rendelés
              </Button>
            </div>
          }
        >
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Nincsenek rendelések"
              description="Még nincs rögzített rendelés ebben a hónapban."
              action={
                <Button size="sm" onClick={() => openForm()}>
                  <Plus size={13} /> Új rendelés
                </Button>
              }
            />
          ) : (
            <DataTable columns={orderColumns} data={filteredOrders} rowKey={(o) => o.id} minWidth="900px" />
          )}
        </Section>
      )}

      {activeTab === 'summary' && (
        <div className="flex flex-col gap-7">
          <AccentPanel
            tone="ai"
            icon={Cpu}
            title="Little Loom AI stratéga"
            titleInfo={HELP.business.aiStrategist}
            description="Személyre szabott növekedési stratégia"
            glow
            action={
              <Button variant="ghost" size="xs" onClick={handleRequestAiAdvice} disabled={isAiLoading}>
                <RefreshCw size={11} className={cn(isAiLoading && 'animate-spin')} />
                {isAiLoading ? 'Elemzés…' : 'Új elemzés'}
              </Button>
            }
          >
            {isAiLoading ? 'Az adatok elemzése és a stratégia generálása folyamatban…' : realAiAdvice || aiAdvice}
          </AccentPanel>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Section title={`Havi cashflow · ${selectedYear}`} description="Bevétel és kintlévőség havi bontásban">
                <div className="rounded-lg border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.50 0.012 260)', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} tick={{ fill: 'oklch(0.50 0.012 260)', fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: 'oklch(0.965 0.005 250)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-md bg-popover border border-border px-3 py-2 shadow-md">
                                <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                                  {label} havi mérleg
                                </p>
                                {(payload as unknown as Array<{ name: string; value: number }>).map((p) => (
                                  <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
                                    <span className="text-foreground/70">{p.name === 'bevetel' ? 'Bevétel' : 'Kintlévőség'}</span>
                                    <span className={cn('font-semibold tabular-nums', p.name === 'bevetel' ? 'text-primary' : 'text-rose-600')}>
                                      {formatHUF(p.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 11 }} />
                      <Bar dataKey="bevetel" fill="oklch(0.55 0.22 275)" name="Bevétel" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="kintlevoseg" fill="oklch(0.62 0.22 25)" name="Kintlévőség" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>

            <div className="lg:col-span-2">
              <Section title="Csatorna megoszlás" description={`${selectedYear} év · súlyozva`}>
                <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3.5">
                  {channelData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Még nincs rendelési adat.</p>
                  ) : (
                    channelData
                      .sort((a, b) => b.value - a.value)
                      .map((c, i) => {
                        const percentage = totalYTD > 0 ? Math.round((c.value / totalYTD) * 100) : 0;
                        const color = channelColors[i % channelColors.length];
                        return (
                          <div key={c.name} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center gap-3 text-xs">
                              <span className="inline-flex items-center gap-1.5 font-medium text-foreground min-w-0 truncate">
                                <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
                                <span className="truncate">{c.name}</span>
                              </span>
                              <span className="font-semibold text-foreground tabular-nums shrink-0">
                                {percentage}% · {formatHUF(c.value)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Rendelés szerkesztése' : 'Új rendelés'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.business.orderDate}>Dátum</FieldLabel>
              <DatePicker value={orderDate} onChange={setOrderDate} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.business.customer}>Vevő neve</FieldLabel>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input className="pl-8" value={customer} onChange={(e) => setCustomer(e.target.value)} required placeholder="pl. Tóth Tímea" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.business.orderAmount}>Összeg (Ft)</FieldLabel>
              <div className="relative">
                <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input type="number" className="pl-8" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.business.channel}>Csatorna</FieldLabel>
              <OptionsSelect value={channel} onChange={setChannel} options={bizOptions.channels} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.business.paymentMethod}>Fizetés módja</FieldLabel>
              <OptionsSelect value={payment} onChange={setPayment} options={bizOptions.payment_methods} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.business.provider}>Szolgáltató</FieldLabel>
              <OptionsSelect value={provider} onChange={setProvider} options={bizOptions.providers} />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.destination}>Hová érkezik</FieldLabel>
            <OptionsSelect value={destination} onChange={setDestination} options={bizOptions.destinations} />
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <LabelWithInfo className="text-xs font-medium" info={HELP.business.paymentSection}>
              Kifizetés és számla
            </LabelWithInfo>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.paidDateBiz}>
                  Kifizetés dátuma
                </FieldLabel>
                <DatePicker value={paidDate} onChange={setPaidDate} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.invoiceNumber}>
                  Számla sorszáma
                </FieldLabel>
                <Input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="E-LL-2026-XX" />
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-1">
            <Sparkles size={14} /> Adatok rögzítése
          </Button>
        </form>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
