'use client';

import { useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  Coins,
  ExternalLink,
  Gauge,
  HandCoins,
  LayoutDashboard,
  MapPinned,
  PiggyBank,
  Settings2,
  Shield,
  Sparkles,
  TrendingDown,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import { StatusPill } from '@/components/design';
import type { HelpGuideTopic } from '@/config/help-guide';
import {
  PRICING_PATH,
  SETTINGS_MODULES_PATH,
  resolveTopicAccess,
} from '@/helpers/help-assistant';
import { getTopicFaqs } from '@/helpers/help-page-faqs';
import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  budget: Wallet,
  budget_categories: Wrench,
  savings: PiggyBank,
  debts: TrendingDown,
  receivables: HandCoins,
  pocket_money: Coins,
  insurance: Shield,
  rental: Building2,
  utilities: Zap,
  meters: Gauge,
  business: Briefcase,
  travel_planner: MapPinned,
  settings: Settings2,
  subscription: Sparkles,
  wallets: Wallet,
  data_import: BookOpen,
};

function accessPill(access: ReturnType<typeof resolveTopicAccess>) {
  switch (access.kind) {
    case 'available':
      return <StatusPill status="success">Elérhető nálad</StatusPill>;
    case 'enable_module':
      return <StatusPill status="warning">Bekapcsolás szükséges</StatusPill>;
    case 'no_permission':
      return <StatusPill status="danger">Nincs jogosultság</StatusPill>;
    case 'tier_locked':
      return (
        <StatusPill status="primary">
          {access.tierLabel ? `${access.tierLabel} csomag` : 'Magasabb csomag'}
        </StatusPill>
      );
    default:
      return null;
  }
}

function TopicActions({
  topic,
  access,
}: {
  topic: HelpGuideTopic;
  access: ReturnType<typeof resolveTopicAccess>;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {access.kind === 'available' && access.path && (
        <Button asChild size="sm" variant="secondary">
          <Link href={access.path}>
            Modul megnyitása
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
      {access.kind === 'enable_module' && (
        <Button asChild size="sm" variant="secondary">
          <Link href={SETTINGS_MODULES_PATH}>
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Modulok beállítása
          </Link>
        </Button>
      )}
      {access.kind === 'tier_locked' && (
        <Button asChild size="sm">
          <Link href={PRICING_PATH}>
            Csomagok összehasonlítása
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}

export function HelpTopicPanel({
  topic,
  user,
  defaultOpen = false,
  forceOpen,
}: {
  topic: HelpGuideTopic;
  user: UserProfile | null | undefined;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || forceOpen || false);
  const isOpen = forceOpen ?? open;

  const access = resolveTopicAccess(topic, user);
  const faqs = getTopicFaqs(topic);
  const TopicIcon = TOPIC_ICONS[topic.id] ?? BookOpen;
  const detailFaqs = faqs.filter((faq) => !faq.id.startsWith('feature.') && !faq.id.startsWith('tip.'));

  return (
    <article className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((prev) => !prev)}
        className={classNames(
          'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors',
          !forceOpen && 'hover:bg-muted/20',
        )}
        aria-expanded={isOpen}
        disabled={forceOpen}
      >
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <TopicIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{topic.title}</h2>
            {accessPill(access)}
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{topic.summary}</p>
        </div>
        {!forceOpen && (
          <ChevronDown
            className={classNames(
              'h-5 w-5 shrink-0 text-muted-foreground mt-2 transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border px-5 py-6 space-y-8 bg-muted/10">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mire jó, mit csinál
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{topic.overview}</p>
            <TopicActions topic={topic} access={access} />
          </section>

          {topic.features.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Fő funkciók
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {topic.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-border/70 bg-card px-4 py-3.5"
                  >
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(access.kind === 'available' || access.kind === 'enable_module') && topic.howToStart.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Hogyan kezdd — lépésről lépésre
              </h3>
              <ol className="space-y-3">
                {topic.howToStart.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-foreground leading-relaxed">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {detailFaqs.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Mezők, számítások és gyakori kérdések
              </h3>
              <div className="flex flex-col gap-4">
                {detailFaqs.map((faq) => (
                  <div key={faq.id} className="rounded-lg border border-border/60 bg-card px-4 py-3.5">
                    <p className="text-sm font-medium text-foreground">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topic.tips.length > 0 && (
            <section className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
                Tippek
              </h3>
              <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                {topic.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
