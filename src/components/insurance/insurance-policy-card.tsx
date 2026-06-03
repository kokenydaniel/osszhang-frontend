'use client';

import { Calendar, Pencil, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design';
import { insuranceCalculations, isPolicyEffectivelyActive } from '@/calculations/insurance';
import { paymentFrequencyLabel } from '@/helpers/insurance-budget';
import type { InsurancePolicy } from '@/types/insurance';

type InsurancePolicyCardProps = {
  policy: InsurancePolicy;
  canEdit?: boolean;
  onEdit?: () => void;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return value.replace(/-/g, '.');
}

export function InsurancePolicyCard({ policy, canEdit, onEdit }: InsurancePolicyCardProps) {
  const p = policy;
  const annual = insuranceCalculations.effectiveAnnualPremium(p);
  const active = isPolicyEffectivelyActive(p);
  const statusLabel = insuranceCalculations.policyStatusLabel(p);

  return (
    <article
      className={`relative flex flex-col rounded-2xl border-2 p-5 transition-shadow hover:shadow-md ${
        active
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
        <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
          <Calendar size={13} className="shrink-0" />
          <span>
            Megújítás: <strong className="text-foreground">{formatDate(p.renewalDate)}</strong>
            {' · '}
            Fedezet: <strong className="text-foreground">{formatDate(p.coveredUntil)}</strong>
          </span>
        </div>
      </dl>

      {p.budgetSyncEnabled && !p.premiumFree ? (
        <p className="text-[0.65rem] text-sky-600 dark:text-sky-400 mb-2">
          Költségvetésben szinkron ({paymentFrequencyLabel(p.paymentFrequency)})
        </p>
      ) : null}

      {p.notes ? (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 mb-3 line-clamp-3">
          {p.notes}
        </p>
      ) : null}

      {p.attachmentCount > 0 ? (
        <p className="text-[0.65rem] text-muted-foreground mb-2">
          {p.attachmentCount} csatolt dokumentum
        </p>
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
