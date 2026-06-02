'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Check, CreditCard, Download, ExternalLink, FlaskConical, Lock, Sparkles, Star } from 'lucide-react';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import { SubscriptionPlanCards } from '@/components/subscription/SubscriptionPlanCards';
import { SettingsBlock } from '@/components/settings/blocks/settings-block';
import { SettingsSectionHeading } from '@/components/settings/blocks/settings-section-heading';
import { subscriptionClient } from '@/lib/api-client';
import {
  BILLING_FEATURE_MATRIX,
  isBillingFeatureUnlocked,
  tierPlanLabel,
} from '@/config/billing/features';
import { InsightBanner } from '@/components/design';
import { effectiveTier, isBetaMode } from '@/helpers/check-access';
import { toDayjs } from '@/utils/dates';
import { getAuthToken } from '@/helpers/auth-token';
import type { BillingInterval } from '@/config/billing/subscription-plans';
import { redirectToStripeCheckout, redirectToStripePortal } from '@/helpers/stripe-checkout';
import { consumeBillingCheckoutReturn } from '@/helpers/billing-checkout-return';
import { StatusCodes } from '@/types/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { UserProfile } from '@/types';
import type { BillingInvoice, BillingSummary } from '@/types/billing';

interface BillingSettingsProps {
  user: UserProfile | null;
}

function formatBillingDate(iso: string): string {
  return toDayjs(iso).format('YYYY. MMMM D.');
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
  if (billing?.subscription_status === 'canceled' || billing?.cancel_at_period_end) {
    return null;
  }
  const upcoming = billing?.upcoming_invoice;
  if (upcoming?.date && upcoming.amount) {
    return `Következő levonás: ${formatBillingDate(upcoming.date)} (${upcoming.amount})`;
  }
  if (billing?.next_billing_date && billing.billing_amount) {
    return `Következő levonás: ${formatBillingDate(billing.next_billing_date)} (${billing.billing_amount})`;
  }
  if (billing?.next_billing_date) {
    return `Következő levonás: ${formatBillingDate(billing.next_billing_date)}`;
  }
  return null;
}

async function downloadInvoiceFile(invoice: BillingInvoice): Promise<boolean> {
  if (invoice.pdf_url) {
    window.open(invoice.pdf_url, '_blank', 'noopener,noreferrer');
    return true;
  }

  if (!invoice.download_url) return false;

  const token = getAuthToken();
  const response = await fetch(invoice.download_url, {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { addNotification } = useNotificationStore();
  const checkoutReturnHandledRef = useRef(false);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const betaMode = isBetaMode(user);
  const billingTier =
    billing?.billing_tier ??
    user?.billing_tier ??
    user?.household?.billing_tier ??
    user?.household?.subscription_tier ??
    'free';
  const accessTier =
    billing?.access_tier ??
    user?.household?.access_tier ??
    effectiveTier(user);
  const displayTier = accessTier;
  const tierGrant = billing?.tier_grant ?? user?.household?.tier_grant ?? null;
  const tierDiffersFromBilling = billingTier !== accessTier;
  const hasGrantBoost = tierDiffersFromBilling && tierGrant !== null;
  const isPaid = displayTier === 'pro' || displayTier === 'premium';
  const isCanceled = billing?.subscription_status === 'canceled' || Boolean(billing?.cancel_at_period_end);
  const isActiveSubscription = isPaid && !isCanceled;
  const accessEndDate = billing?.access_ends_at ?? billing?.next_billing_date;
  const nextCharge = nextChargeLabel(billing);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionClient.getBilling();
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setBilling(res[1] as BillingSummary);
    } catch (e) {
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
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';

    if (!isSuccess && !isCanceled) return;
    if (checkoutReturnHandledRef.current) return;

    const clearReturnParams = () => {
      router.replace('/settings?tab=billing', { scroll: false });
    };

    checkoutReturnHandledRef.current = true;

    if (isSuccess) {
      if (consumeBillingCheckoutReturn('success')) {
        addNotification('Sikeres fizetés! Az előfizetésed hamarosan frissül.', 'success');
        void fetchMe();
        void loadBilling();
      }
      clearReturnParams();
      return;
    }

    if (isCanceled) {
      if (consumeBillingCheckoutReturn('canceled')) {
        addNotification('A fizetés megszakítva.', 'info');
      }
      clearReturnParams();
    }
  }, [addNotification, fetchMe, loadBilling, router, searchParams]);

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
  const paidPlanLabel = tierPlanLabel(billingTier);

  return (
    <>
      <SettingsSectionHeading
        title="Előfizetés és számlázás"
        description="Csomagod, fizetési módod és korábbi számláid — egy helyen."
      />

      {betaMode && (
        <InsightBanner tone="info" icon={FlaskConical} title="Béta mód aktív">
          A Stripe számlázás ki van kapcsolva. Minden Pro és Premium funkció szabadon használható fizetés nélkül.
          Kapcsold ki a béta módot a Platform admin → Rendszer funkciók menüpontban, ha éles előfizetést szeretnél.
        </InsightBanner>
      )}

      {!betaMode && tierDiffersFromBilling ? (
        <InsightBanner tone="info" icon={Sparkles} title="Kibővített hozzáférés">
          Jelenlegi hozzáférésed: <strong>{planLabel}</strong>. Fizetős előfizetésed (Stripe):{' '}
          <strong>{paidPlanLabel}</strong>.
          {tierGrant
            ? tierGrant.is_permanent
              ? ' Az admin által adott hozzáférés örökös — a számlázás a fizetős csomagod szerint marad.'
              : tierGrant.expires_at
                ? ` Az admin grant ${formatBillingDate(tierGrant.expires_at)}-ig érvényes, utána a fizetős csomagod (${paidPlanLabel}) marad.`
                : ' Az admin grant aktív — a számlázás a fizetős csomagod szerint marad.'
            : ' A funkciók a magasabb hozzáférési szint szerint érhetők el.'}
        </InsightBanner>
      ) : null}

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
          ) : displayTier === 'free' && billingTier === 'free' ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Egy közös kassza és alap cashflow — ingyenesen, korlátozások nélkül az alapfunkciókra.
            </p>
          ) : displayTier === 'free' && billingTier !== 'free' ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Fizetős előfizetésed: <span className="font-medium text-foreground">{paidPlanLabel}</span>.
            </p>
          ) : tierDiffersFromBilling ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Hozzáférés: <span className="font-medium text-foreground">{planLabel}</span>
              {' · '}
              Fizetős csomag (számlázás): <span className="font-medium text-foreground">{paidPlanLabel}</span>
            </p>
          ) : isCanceled ? (
            <p className="text-sm text-muted-foreground">
              {billing?.billing_amount}
              {accessEndDate ? ` · Hozzáférés eddig: ${formatBillingDate(accessEndDate)}` : ''}
            </p>
          ) : (
            <div className="space-y-1">
              {nextCharge && (
                <p className="text-sm text-foreground">
                  <span className="font-medium">{nextCharge}</span>
                </p>
              )}
              {!nextCharge && billing?.billing_amount && (
                <p className="text-sm text-muted-foreground">{billing.billing_amount}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {billingTier !== 'premium' && !betaMode && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <SubscriptionPlanCards
            currentTier={billingTier}
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
            const unlocked = isBillingFeatureUnlocked(accessTier, feature.minTier);
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
                  <div className="min-w-0">
                    <span
                      className={classNames(
                        'text-sm block',
                        unlocked ? 'text-foreground font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {feature.label}
                    </span>
                    {!unlocked ? (
                      <span className="text-xs text-muted-foreground mt-0.5 block leading-relaxed">
                        {feature.upgradeHint}
                      </span>
                    ) : null}
                  </div>
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
          ) : billing?.payment_method ? (
            <div
              className={classNames(
                'relative mx-auto flex aspect-[1.586/1] w-full max-w-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-br p-5 text-white shadow-md sm:mx-0',
                cardBrandAccent(billing.payment_method.brand),
              )}
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative flex items-start justify-between gap-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/70">
                  {cardBrandLabel(billing.payment_method.brand)}
                </p>
                <CreditCard size={18} className="shrink-0 text-white/50" />
              </div>
              <p className="relative mt-auto font-mono text-base tracking-[0.15em] sm:text-lg sm:tracking-[0.2em]">
                •••• •••• •••• {billing.payment_method.last4}
              </p>
              <p className="relative mt-3 text-xs text-white/75">
                Lejár: {formatCardExpiry(billing.payment_method.exp_month, billing.payment_method.exp_year)}
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
                      <td className="py-3 pr-4 text-foreground">{invoice.plan_label}</td>
                      <td className="py-3 pr-4 text-foreground font-medium tabular-nums">{invoice.amount}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={classNames(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold',
                            invoiceStatusClass(invoice.status),
                          )}
                        >
                          {invoice.status_label}
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
