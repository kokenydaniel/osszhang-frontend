'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, ShieldAlert } from 'lucide-react';
import { InsightBanner, MetricStrip, SectionPanel, StatusPill } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ADMIN_AI_FEATURE_LABELS, describeOpenAiPricingSource, formatAiCostDisplay, formatTokenCount } from '@/helpers/admin-helpers';
import { useEnsureExchangeRates } from '@/hooks/useEnsureExchangeRates';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { formatDate } from '@/utils';
import type { AdminHouseholdAiSettings, AdminHouseholdAiSettingsPayload, AdminHouseholdAiUsage } from '@/types/admin';

type AdminHouseholdAiUsagePanelProps = {
  aiUsage: AdminHouseholdAiUsage | undefined;
  aiSettings: AdminHouseholdAiSettings | undefined;
  saving?: boolean;
  onSave?: (payload: AdminHouseholdAiSettingsPayload) => Promise<boolean>;
};

export function AdminHouseholdAiUsagePanel({
  aiUsage,
  aiSettings,
  saving = false,
  onSave,
}: AdminHouseholdAiUsagePanelProps) {
  useEnsureExchangeRates();
  const usdToHufRate = useExchangeRatesStore((s) => s.rates.USD);

  const usage = aiUsage ?? {
    total_prompt_tokens: 0,
    total_completion_tokens: 0,
    total_tokens: 0,
    request_count: 0,
    cost_usd: 0,
    requests_without_cost: 0,
    month_prompt_tokens: 0,
    month_completion_tokens: 0,
    month_total_tokens: 0,
    month_request_count: 0,
    month_cost_usd: 0,
    month_requests_without_cost: 0,
    by_feature: [],
    last_used_at: null,
    pricing_configured: false,
  };

  const settings = aiSettings ?? {
    usage_blocked: false,
    monthly_token_limit: null,
    monthly_limit_reached: false,
  };

  const [usageBlocked, setUsageBlocked] = useState(settings.usage_blocked);
  const [monthlyLimit, setMonthlyLimit] = useState(
    settings.monthly_token_limit != null ? String(settings.monthly_token_limit) : '',
  );

  useEffect(() => {
    setUsageBlocked(settings.usage_blocked);
    setMonthlyLimit(settings.monthly_token_limit != null ? String(settings.monthly_token_limit) : '');
  }, [settings.monthly_token_limit, settings.usage_blocked]);

  const parsedLimit = useMemo(() => {
    const trimmed = monthlyLimit.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
  }, [monthlyLimit]);

  const dirty =
    usageBlocked !== settings.usage_blocked ||
    parsedLimit !== settings.monthly_token_limit;

  const hasUsage = usage.total_tokens > 0 || usage.request_count > 0;
  const limitReached = settings.monthly_limit_reached && !settings.usage_blocked;
  const missingCostRecords = usage.requests_without_cost > 0;

  const handleSave = async () => {
    if (!onSave || !dirty) return;
    await onSave({
      usage_blocked: usageBlocked,
      monthly_token_limit: parsedLimit,
    });
  };

  return (
    <SectionPanel
      title="OpenAI fogyasztás"
      description={
        usage.last_used_at
          ? `Utolsó AI hívás: ${formatDate(usage.last_used_at)}`
          : 'Még nincs rögzített OpenAI token fogyasztás ehhez a háztartáshoz.'
      }
      icon={Bot}
      tone="violet"
    >
      {(settings.usage_blocked || limitReached) && (
        <div className="mb-4 space-y-2">
          {settings.usage_blocked ? (
            <InsightBanner tone="danger" title="AI tiltva" icon={ShieldAlert}>
              Ehhez a háztartáshoz az AI funkciók jelenleg le vannak tiltva. A felhasználók 403 hibát kapnak minden
              AI kérésnél.
            </InsightBanner>
          ) : null}
          {limitReached ? (
            <InsightBanner tone="warning" title="Havi limit elérve">
              A háztartás elérte a beállított havi token limitet ({formatTokenCount(settings.monthly_token_limit ?? 0)}).
              Új AI hívások a következő hónapig tiltva.
            </InsightBanner>
          ) : null}
        </div>
      )}

      {!usage.pricing_configured ? (
        <InsightBanner tone="warning" title="Ismeretlen modell árazás" className="mb-4">
          A használt modellhez nincs OpenAI Standard tier ár a rendszerben — ellenőrizd a{' '}
          <a href="https://platform.openai.com/docs/pricing" target="_blank" rel="noreferrer" className="underline">
            hivatalos árlistát
          </a>
          , és frissítsd a <code className="text-xs">openai_model_pricing.php</code> configot.
        </InsightBanner>
      ) : null}

      {missingCostRecords ? (
        <InsightBanner tone="info" title="Hiányzó költségadatok" className="mb-4">
          {usage.requests_without_cost} korábbi hívásnál nincs rögzített költség (a rögzítés bevezetése előtti, vagy
          árképzés nélküli időszakból).
        </InsightBanner>
      ) : null}

      <MetricStrip
        items={[
          {
            label: 'Költség (összesen)',
            value: formatAiCostDisplay(usage.cost_usd, usdToHufRate),
            hint: `${formatTokenCount(usage.total_tokens)} token · ${formatTokenCount(usage.request_count)} hívás`,
            tone: 'primary',
          },
          {
            label: 'Költség (e hónap)',
            value: formatAiCostDisplay(usage.month_cost_usd, usdToHufRate),
            hint: settings.monthly_token_limit
              ? `${formatTokenCount(usage.month_total_tokens)} token · limit: ${formatTokenCount(settings.monthly_token_limit)}`
              : `${formatTokenCount(usage.month_request_count)} hívás · ${formatTokenCount(usage.month_total_tokens)} token`,
            tone: limitReached ? 'warning' : usage.month_total_tokens > 0 ? 'warning' : 'default',
          },
          {
            label: 'Token (összesen)',
            value: formatTokenCount(usage.total_tokens),
            hint: `${formatTokenCount(usage.total_prompt_tokens)} prompt + ${formatTokenCount(usage.total_completion_tokens)} completion`,
          },
        ]}
        columns={3}
        variant="separated"
      />

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        {describeOpenAiPricingSource(usage.pricing)}. A megjelenített összegek a hívások pillanatában rögzített{' '}
        <code className="text-[0.7rem]">cost_usd</code> mezők összege. A forint érték élő USD/HUF árfolyamon számolt
        megjelenítés.
      </p>

      {onSave ? (
        <div className="mt-5 rounded-lg border border-border bg-muted/10 p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">AI korlátozás</p>
            <p className="text-xs text-muted-foreground mt-1">
              Túlzott fogyasztás esetén teljes tiltás vagy havi token limit beállítható. A limit csak OpenAI token
              fogyasztást számol.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 bg-card px-4 py-3">
            <div>
              <Label htmlFor="ai-usage-blocked" className="text-sm font-medium">
                AI teljes tiltása
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Minden AI funkció blokkolva — függetlenül az előfizetéstől.
              </p>
            </div>
            <Switch
              id="ai-usage-blocked"
              checked={usageBlocked}
              onCheckedChange={setUsageBlocked}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-monthly-limit">Havi token limit (opcionális)</Label>
            <Input
              id="ai-monthly-limit"
              type="number"
              min={1000}
              step={1000}
              placeholder="Nincs limit"
              value={monthlyLimit}
              onChange={(event) => setMonthlyLimit(event.target.value)}
              disabled={saving || usageBlocked}
            />
            <p className="text-xs text-muted-foreground">
              Üresen hagyva nincs limit. Minimum 1000 token. A hónap elején nullázódik.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={!dirty || saving} loading={saving} onClick={() => void handleSave()}>
              Korlátozás mentése
            </Button>
          </div>
        </div>
      ) : null}

      {!hasUsage ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Az AI funkciók használatakor (tanácsadó, kategória javaslat, utazástervező stb.) automatikusan rögzítjük a
          token fogyasztást és a hívás pillanatában számolt költséget háztartásonként.
        </p>
      ) : usage.by_feature.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Funkciónként</p>
          <div className="flex flex-wrap gap-2">
            {usage.by_feature.map((row) => (
              <StatusPill key={row.feature} status="neutral" size="xs">
                {ADMIN_AI_FEATURE_LABELS[row.feature] ?? row.feature}: {formatTokenCount(row.total_tokens)} token
                {' · '}
                {row.request_count}×
                {row.cost_usd > 0 ? ` · ${formatAiCostDisplay(row.cost_usd, usdToHufRate)}` : null}
              </StatusPill>
            ))}
          </div>
        </div>
      ) : null}
    </SectionPanel>
  );
}
