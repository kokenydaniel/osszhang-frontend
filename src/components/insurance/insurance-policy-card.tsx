'use client';

import { useState } from 'react';
import { Calendar, Pencil, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design';
import { insuranceCalculations, isPolicyEffectivelyActive } from '@/calculations/insurance';
import { paymentFrequencyLabel } from '@/helpers/insurance-budget';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { canUseFeature } from '@/helpers/check-access';
import { useAuthStore } from '@/stores/useAuthStore';
import { InsurancePolicyAttachments } from './insurance-policy-attachments';
import type { InsurancePolicy } from '@/types/insurance';

type InsurancePolicyCardProps = {
  policy: InsurancePolicy;
  canEdit?: boolean;
  onEdit?: () => void;
  onAttachmentCountChange?: (policyId: number, count: number) => void;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return value.replace(/-/g, '.');
}

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${y}.${m}`;
}

function recentPaidPeriods(paidBudgetPeriods: string[], limit = 6): string[] {
  return [...paidBudgetPeriods].sort().reverse().slice(0, limit);
}

export function InsurancePolicyCard({
  policy,
  canEdit,
  onEdit,
  onAttachmentCountChange,
}: InsurancePolicyCardProps) {
  const user = useAuthStore((s) => s.user);
  const p = policy;
  const annual = insuranceCalculations.effectiveAnnualPremium(p);
  const active = isPolicyEffectivelyActive(p);
  const attachmentsEnabled =
    isPlatformFeatureEnabled(user, 'enable_attachments') && canUseFeature(user, 'attachments');
  const [docsOpen, setDocsOpen] = useState(false);

  const hasPaidHistory = p.budgetSyncEnabled && !p.premiumFree && p.paidBudgetPeriods?.length > 0;
  const recentPaid = hasPaidHistory ? recentPaidPeriods(p.paidBudgetPeriods) : [];
  const hasMorePaid = hasPaidHistory && p.paidBudgetPeriods.length > 6;

  const contractStartLabel =
    p.budgetStartYear && p.budgetStartMonth
      ? `${p.budgetStartYear}.${String(p.budgetStartMonth).padStart(2, '0')}`
      : null;

  return (
    <article
      className={`relative flex flex-col rounded-2xl border-2 p-5 transition-shadow hover:shadow-md ${active
          ? 'border-sky-500/25 bg-gradient-to-br from-sky-500/[0.04] to-card'
          : 'border-border/70 bg-muted/20 opacity-90'
        }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 border border-sky-500/20">
            <Shield size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground truncate">{p.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{p.insurer || '—'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusPill status={p.isActive ? 'success' : 'neutral'}>
            {p.isActive ? 'Aktív' : 'Megszűnt'}
          </StatusPill>
          {p.premiumFree ? (
            <StatusPill status="info" size="xs">
              Díjmentes
            </StatusPill>
          ) : null}
          {p.policyKind === 'life_investment' ? (
            <StatusPill status="primary" size="xs">
              Élet / alap
            </StatusPill>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-3">
        {p.policyKind === 'life_investment' && p.fundValue != null && p.fundValue > 0 ? (
          <div className="col-span-2">
            <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              Befektetési érték
            </dt>
            <dd className="font-semibold tabular-nums text-primary">
              {insuranceCalculations.formatPremium(p.fundValue, p.currency)}
            </dd>
          </div>
        ) : null}
        {!p.premiumFree ? (
          <>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Éves díj</dt>
              <dd className="font-semibold tabular-nums">
                {insuranceCalculations.formatPremium(annual, p.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                {paymentFrequencyLabel(p.paymentFrequency)} díj
              </dt>
              <dd className="font-semibold tabular-nums text-muted-foreground">
                {insuranceCalculations.formatPremium(p.paymentAmount, p.currency)}
              </dd>
            </div>
          </>
        ) : (
          <div className="col-span-2 text-xs text-muted-foreground">Nincs fizetendő díj</div>
        )}
      </dl>

      <div className="border-t border-border/50 pt-2.5 mb-2.5 space-y-1.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Szerződés érvényessége
        </p>
        <div className="flex flex-col gap-1 text-xs">
          {contractStartLabel ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={11} className="shrink-0 text-sky-500" />
              <span>
                Kezdete: <strong className="text-foreground">{contractStartLabel}</strong>
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={11} className="shrink-0 text-amber-500" />
            <span>
              Fedezet vége:{' '}
              <strong className={p.coveredUntil && p.coveredUntil < new Date().toISOString().slice(0, 10) ? 'text-rose-600' : 'text-foreground'}>
                {formatDate(p.coveredUntil)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar size={11} className="shrink-0 text-emerald-500" />
            <span>
              Következő megújítás: <strong className="text-foreground">{formatDate(p.renewalDate)}</strong>
            </span>
          </div>
        </div>
      </div>

      {hasPaidHistory ? (
        <div className="border-t border-border/50 pt-2.5 mb-2.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Befizetések ({p.paidBudgetPeriods.length} db)
          </p>
          <div className="flex flex-wrap gap-1">
            {recentPaid.map((ym) => (
              <span
                key={ym}
                className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums"
                title={`${formatYearMonth(ym)} — ${insuranceCalculations.formatPremium(p.paymentAmount, p.currency)}`}
              >
                <CheckCircle2 size={9} />
                {formatYearMonth(ym)}
              </span>
            ))}
            {hasMorePaid && (
              <span className="text-[0.65rem] text-muted-foreground/70 self-center ml-0.5">
                +{p.paidBudgetPeriods.length - 6} további
              </span>
            )}
          </div>
          <p className="text-[0.65rem] text-muted-foreground/70 mt-1">
            {paymentFrequencyLabel(p.paymentFrequency)} · {insuranceCalculations.formatPremium(p.paymentAmount, p.currency)} / alkalom
          </p>
        </div>
      ) : p.budgetSyncEnabled && !p.premiumFree ? (
        <p className="text-[0.65rem] text-sky-600 dark:text-sky-400 mb-2">
          Költségvetésben szinkron ({paymentFrequencyLabel(p.paymentFrequency)}) — még nincs rögzített befizetés
        </p>
      ) : null}

      {p.notes ? (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 mb-3 line-clamp-3">
          {p.notes}
        </p>
      ) : null}

      {attachmentsEnabled ? (
        <details
          className="border-t border-border/50 pt-3 mb-2 group"
          open={docsOpen}
          onToggle={(e) => setDocsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="text-xs font-medium text-muted-foreground cursor-pointer list-none flex items-center justify-between gap-2 hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span>
              Dokumentumok
              <span className="tabular-nums text-foreground/80"> ({p.attachmentCount})</span>
            </span>
            <span className="text-[0.65rem] text-primary group-open:hidden">Megnyitás</span>
            <span className="text-[0.65rem] text-primary hidden group-open:inline">Bezárás</span>
          </summary>
          <div className="pt-3">
            {docsOpen ? (
              <InsurancePolicyAttachments
                policyId={p.id}
                canEdit={!!canEdit}
                onCountChange={(count) => onAttachmentCountChange?.(p.id, count)}
              />
            ) : null}
          </div>
        </details>
      ) : null}

      {canEdit && onEdit ? (
        <div className="mt-auto pt-2 border-t border-border/50 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil size={13} />
            Szerkesztés
          </Button>
        </div>
      ) : null}
    </article>
  );
}
