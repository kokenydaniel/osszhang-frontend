'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Check, CreditCard, Download, ExternalLink, FlaskConical, Lock, Sparkles, Star } from 'lucide-react';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import { SubscriptionPlanCards } from '@/components/subscription/SubscriptionPlanCards';
import { SettingsBlock, SettingsSectionHeading } from '@/components/modules/settings/settings-ui';
import { subscriptionClient } from '@/lib/api-client';
import { mapBillingSummaryFromApi } from '@/lib/mapBilling';
import {
  BILLING_FEATURE_MATRIX,
  isBillingFeatureUnlocked,
  tierPlanLabel,
} from '@/lib/billingFeatures';
import { InsightBanner } from '@/components/design';
import { effectiveTier, isBetaMode } from '@/lib/checkAccess';
import { d } from '@/lib/dates';
import { getAuthToken } from '@/lib/authToken';
import type { BillingInterval } from '@/lib/subscriptionPlans';
import { redirectToStripeCheckout, redirectToStripePortal } from '@/lib/stripeCheckout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { UserProfile } from '@/types';
import type { BillingInvoice, BillingSummary } from '@/types/billing';

interface BillingSettingsProps {
  user: UserProfile | null;
}

function formatBillingDate(iso: string): string {
  return d(iso).format('YYYY. MMMM D.');
}

function formatCardExpiry(expMonth: number, expYear: number): string {
  if (!expMonth || !expYear) return '—';
  return `${String(expMonth).padStart(2, '0')}/${expYear}`;
}

function cardBrandLabel(brand: string): string {
  const normalized = brand.toLowerCase();
  if (normalized === 'visa') return 'Visa';
  if (normalized === 'mastercard') return 'Mastercard';
  if (normalized === 'amex') return 'American Express';
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function cardBrandAccent(brand: string): string {
  const normalized = brand.toLowerCase();
  if (normalized === 'visa') return 'from-blue-700 to-blue-900';
  if (normalized === 'mastercard') return 'from-slate-800 to-slate-950';
  return 'from-slate-800 to-slate-900';
}

function invoiceStatusClass(status: BillingInvoice['status']): string {
  if (status === 'paid') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  if (status === 'open' || status === 'draft') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }
  return 'border-border bg-muted/40 text-muted-foreground';
}

function nextChargeLabel(billing: BillingSummary | null): string | null {
  if (billing?.subscriptionStatus === 'canceled' || billing?.cancelAtPeriodEnd) {
    return null;
  }
  const upcoming = billing?.upcomingInvoice;
  if (upcoming?.date && upcoming.amount) {
    return `Következő levonás: ${formatBillingDate(upcoming.date)} (${upcoming.amount})`;
  }
  if (billing?.nextBillingDate && billing.billingAmount) {
    return `Következő levonás: ${formatBillingDate(billing.nextBillingDate)} (${billing.billingAmount})`;
  }
  if (billing?.nextBillingDate) {
    return `Következő levonás: ${formatBillingDate(billing.nextBillingDate)}`;
  }
  return null;
}

async function downloadInvoiceFile(invoice: BillingInvoice): Promise<boolean> {
  if (invoice.pdfUrl) {
    window.open(invoice.pdfUrl, '_blank', 'noopener,noreferrer');
    return true;
  }

  if (!invoice.downloadUrl) return false;

  const token = getAuthToken();
  const response = await fetch(invoice.downloadUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) return false;

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `penzpilot-szamla-${invoice.id}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
  return true;
}

export function BillingSettings({ user }: BillingSettingsProps) {
  const searchParams = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { addNotification } = useNotificationStore();
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const userTier = effectiveTier(user);
  const betaMode = isBetaMode(user);
  const displayTier = billing?.effectiveTier ?? userTier;
  const isPaid = displayTier === 'pro' || displayTier === 'premium';
  const isCanceled = billing?.subscriptionStatus === 'canceled' || Boolean(billing?.cancelAtPeriodEnd);
  const isActiveSubscription = isPaid && !isCanceled;
  const accessEndDate = billing?.accessEndsAt ?? billing?.nextBillingDate;
  const nextCharge = nextChargeLabel(billing);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionClient.getBilling();
      setBilling(mapBillingSummaryFromApi(res.data));
    } catch {
      addNotification('A számlázási adatok betöltése nem sikerült.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    const refreshFromPortal = () => {
      void loadBilling();
      void fetchMe();
    };

    window.addEventListener('focus', refreshFromPortal);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshFromPortal();
      }
    });

    return () => {
      window.removeEventListener('focus', refreshFromPortal);
    };
  }, [fetchMe, loadBilling]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      addNotification('Sikeres fizetés! Az előfizetésed hamarosan frissül.', 'success');
      void fetchMe();
      void loadBilling();
    }
    if (searchParams.get('canceled') === 'true') {
      addNotification('A fizetés megszakítva.', 'info');
    }
    if (searchParams.get('tab') === 'billing') {
      void loadBilling();
      void fetchMe();
    }
  }, [addNotification, fetchMe, loadBilling, searchParams]);

  const handleCheckout = async (priceId: string) => {
    setActionLoading(true);
    setLoadingPriceId(priceId);
    try {
      await redirectToStripeCheckout(priceId);
    } catch {
      addNotification('A fizetés indítása nem sikerült.', 'error');
      setActionLoading(false);
      setLoadingPriceId(null);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      await redirectToStripePortal();
    } catch {
      addNotification('A számlázási portál megnyitása nem sikerült.', 'error');
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: BillingInvoice) => {
    try {
      const ok = await downloadInvoiceFile(invoice);
      if (!ok) {
        addNotification('Ehhez a számlához még nincs letölthető PDF.', 'info');
      }
    } catch {
      addNotification('A számla letöltése nem sikerült.', 'error');
    }
  };

  const planLabel = tierPlanLabel(displayTier);

  return (
    <>
      <SettingsSectionHeading
        title="Előfizetés és számlázás"
        description="Csomagod, fizetési módod és korábbi számláid — egy helyen."
      />

      {betaMode && (
        <InsightBanner tone="info" icon={FlaskConical} title="Béta mód aktív">
          A Stripe számlázás ki van kapcsolva. Minden Pro és Premium funkció szabadon használható fizetés nélkül.
          Kapcsold ki a béta módot a Platform fülön, ha éles előfizetést szeretnél.
        </InsightBanner>
      )}

      {isCanceled && !loading && !betaMode && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Előfizetés lemondva</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {accessEndDate ? (
                <>
                  A csomagod a periódus végéig aktív marad:{' '}
                  <span className="font-medium text-foreground">{formatBillingDate(accessEndDate)}</span>.
                  Utána visszaváltasz az ingyenes csomagra.
                </>
              ) : (
                'Az előfizetésed lejárt. A Pro/Premium funkciók már nem érhetők el.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* A) Current plan */}
      <div
        className={classNames(
          'rounded-2xl border p-6',
          isCanceled
            ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-card to-card'
            : displayTier === 'premium'
            ? 'border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] via-card to-card'
            : displayTier === 'pro'
              ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-card to-card'
              : 'border-border bg-muted/20',
        )}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {displayTier === 'premium' && <Star size={18} className="text-violet-500 fill-current" />}
            {displayTier === 'pro' && <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />}
            <h3 className="text-xl font-semibold text-foreground tracking-tight">{planLabel}</h3>
            {displayTier === 'pro' && !isCanceled && <TierBadge tier="pro" />}
            {displayTier === 'premium' && !isCanceled && <TierBadge tier="premium" />}
            {isCanceled && (
              <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Lemondva
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Betöltés…</p>
          ) : displayTier === 'free' ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Egy közös kassza és alap cashflow — ingyenesen, korlátozások nélkül az alapfunkciókra.
            </p>
          ) : isCanceled ? (
            <p className="text-sm text-muted-foreground">
              {billing?.billingAmount}
              {accessEndDate ? ` · Hozzáférés eddig: ${formatBillingDate(accessEndDate)}` : ''}
            </p>
          ) : (
            <div className="space-y-1">
              {nextCharge && (
                <p className="text-sm text-foreground">
                  <span className="font-medium">{nextCharge}</span>
                </p>
              )}
              {!nextCharge && billing?.billingAmount && (
                <p className="text-sm text-muted-foreground">{billing.billingAmount}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {displayTier !== 'premium' && !betaMode && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <SubscriptionPlanCards
            currentTier={displayTier}
            interval={billingInterval}
            onIntervalChange={setBillingInterval}
            onSelectPlan={(priceId) => void handleCheckout(priceId)}
            loadingPriceId={loadingPriceId}
            showFreePlan={displayTier === 'free'}
          />
        </div>
      )}

      {/* B) Feature matrix */}
      <SettingsBlock
        title="Mi van a csomagomban?"
        description="A jelenlegi előfizetési szinteddel elérhető funkciók."
        icon={Check}
        toneClassName="bg-primary/10 text-primary"
      >
        <ul className="space-y-2.5">
          {BILLING_FEATURE_MATRIX.map((feature) => {
            const unlocked = isBillingFeatureUnlocked(displayTier, feature.minTier);
            return (
              <li
                key={feature.id}
                className={classNames(
                  'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5',
                  unlocked ? 'border-border bg-card' : 'border-border/60 bg-muted/20',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {unlocked ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check size={13} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Lock size={12} />
                    </span>
                  )}
                  <span
                    className={classNames(
                      'text-sm',
                      unlocked ? 'text-foreground font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {feature.label}
                  </span>
                </div>
                {!unlocked && feature.minTier !== 'free' && (
                  <TierBadge tier={feature.minTier} />
                )}
              </li>
            );
          })}
        </ul>
      </SettingsBlock>

      {/* C) Payment method */}
      {isPaid && !betaMode && (
        <SettingsBlock
          title="Fizetési mód"
          description="A regisztrált bankkártya adatai."
          icon={CreditCard}
          toneClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          footer={
            <Button type="button" size="sm" variant="outline" loading={actionLoading} onClick={() => void handlePortal()}>
              <ExternalLink size={13} className="mr-1.5" />
              Kártya / Adatok módosítása
            </Button>
          }
        >
          {loading ? (
            <p className="text-sm text-muted-foreground">Betöltés…</p>
          ) : billing?.paymentMethod ? (
            <div
              className={classNames(
                'relative overflow-hidden rounded-xl border border-border bg-gradient-to-br text-white p-5 max-w-sm shadow-md',
                cardBrandAccent(billing.paymentMethod.brand),
              )}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/70">
                  {cardBrandLabel(billing.paymentMethod.brand)}
                </p>
                <CreditCard size={18} className="text-white/50" />
              </div>
              <p className="mt-6 font-mono text-lg tracking-[0.2em]">
                •••• •••• •••• {billing.paymentMethod.last4}
              </p>
              <p className="mt-4 text-xs text-white/75">
                Lejár: {formatCardExpiry(billing.paymentMethod.expMonth, billing.paymentMethod.expYear)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Még nincs mentett fizetési mód. A kártyaadatokat a Stripe fizetéskor rögzítjük.
            </p>
          )}
        </SettingsBlock>
      )}

      {/* D) Billing history */}
      {isPaid && !betaMode && (
        <SettingsBlock
          title="Számlázási előzmények"
          description="Az utolsó 5 sikeres fizetésed és számlád."
          icon={Download}
          toneClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Betöltés…</p>
          ) : !billing?.invoices.length ? (
            <p className="text-sm text-muted-foreground py-4 rounded-lg border border-dashed border-border px-4">
              Még nincs számlázási előzmény.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4 font-semibold">Dátum</th>
                    <th className="pb-2 pr-4 font-semibold">Csomag</th>
                    <th className="pb-2 pr-4 font-semibold">Összeg</th>
                    <th className="pb-2 pr-4 font-semibold">Státusz</th>
                    <th className="pb-2 font-semibold text-right">Számla</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                        {formatBillingDate(invoice.date)}
                      </td>
                      <td className="py-3 pr-4 text-foreground">{invoice.planLabel}</td>
                      <td className="py-3 pr-4 text-foreground font-medium tabular-nums">{invoice.amount}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={classNames(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold',
                            invoiceStatusClass(invoice.status),
                          )}
                        >
                          {invoice.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Számla letöltése"
                          onClick={() => void handleDownloadInvoice(invoice)}
                        >
                          <Download size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SettingsBlock>
      )}

      {isActiveSubscription && !betaMode && (
        <div className="flex justify-center pt-1 pb-2">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline disabled:opacity-50"
            disabled={actionLoading}
            onClick={() => void handlePortal()}
          >
            Előfizetés lemondása
          </button>
        </div>
      )}

      {displayTier === 'free' && !loading && !betaMode && (
        <p className="text-xs text-muted-foreground text-center rounded-lg border border-dashed border-border px-4 py-3">
          A fizetés Stripe Checkouton keresztül történik. Sikeres előfizetés után a háztartás csomagja automatikusan frissül.
        </p>
      )}
    </>
  );
}
