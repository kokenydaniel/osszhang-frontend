'use client';

import Link from 'next/link';
import classNames from 'classnames';
import { ArrowRight, BookOpen, ExternalLink, Settings2 } from 'lucide-react';
import type { HelpAccessInfo } from '@/helpers/help-assistant';
import { PRICING_PATH, SETTINGS_MODULES_PATH } from '@/helpers/help-assistant';
import type { HelpAssistantLink } from '@/lib/api-client/clients/help-assistant-client';
import { Button } from '@/components/ui/button';

function renderSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIndex} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={partIndex}>{part}</span>;
    });

    return (
      <span key={index} className="block whitespace-pre-wrap">
        {content}
      </span>
    );
  });
}

const ACCESS_BADGE: Record<HelpAccessInfo['kind'], { label: string; className: string }> = {
  available: { label: 'Elérhető', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  enable_module: { label: 'Bekapcsolás szükséges', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  no_permission: { label: 'Nincs jogosultság', className: 'bg-destructive/10 text-destructive' },
  tier_locked: { label: 'Magasabb csomag', className: 'bg-primary/10 text-primary' },
  coming_soon: { label: 'Hamarosan', className: 'bg-muted text-muted-foreground' },
};

type HelpMessageBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
  access?: HelpAccessInfo;
  pricingHref?: string;
  links?: HelpAssistantLink[];
  rejected?: boolean;
  compact?: boolean;
};

function linkIcon(kind: HelpAssistantLink['kind']) {
  if (kind === 'settings') return <Settings2 className="mr-1 h-3 w-3" />;
  if (kind === 'pricing') return <ExternalLink className="ml-1 h-3 w-3" />;
  if (kind === 'help') return <BookOpen className="mr-1 h-3 w-3" />;
  return <ArrowRight className="ml-1 h-3 w-3" />;
}

export function HelpMessageBubble({
  role,
  text,
  access,
  pricingHref,
  links,
  rejected,
  compact,
}: HelpMessageBubbleProps) {
  const isUser = role === 'user';
  const aiLinks = links ?? [];
  const hasLegacyActions = Boolean(access || pricingHref);
  const showAiLinks = !isUser && aiLinks.length > 0;

  return (
    <div className={classNames('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={classNames(
          'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : rejected
              ? 'bg-muted/50 text-muted-foreground border border-border/60 rounded-bl-md'
              : 'bg-muted/80 text-foreground border border-border/60 rounded-bl-md',
          compact && 'text-[13px] px-3 py-2',
        )}
      >
        <div className="space-y-1">{renderSimpleMarkdown(text)}</div>

        {!isUser && access && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className={classNames('text-[11px] font-medium px-2 py-0.5 rounded-full', ACCESS_BADGE[access.kind].className)}>
              {ACCESS_BADGE[access.kind].label}
              {access.tierLabel ? ` · ${access.tierLabel}` : ''}
            </span>
          </div>
        )}

        {showAiLinks && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {aiLinks.map((link) => (
              <Button
                key={`${link.path}-${link.label}`}
                asChild
                size="sm"
                variant={link.kind === 'pricing' ? 'default' : 'secondary'}
                className="h-7 text-xs"
              >
                <Link href={link.path}>
                  {link.kind !== 'pricing' && linkIcon(link.kind)}
                  {link.label}
                  {link.kind === 'pricing' && linkIcon(link.kind)}
                </Link>
              </Button>
            ))}
          </div>
        )}

        {!isUser && hasLegacyActions && !showAiLinks && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {access?.kind === 'available' && access.path && (
              <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
                <Link href={access.path}>
                  Megnyitás
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
            {access?.kind === 'enable_module' && (
              <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
                <Link href={SETTINGS_MODULES_PATH}>
                  <Settings2 className="mr-1 h-3 w-3" />
                  Modulok
                </Link>
              </Button>
            )}
            {(access?.kind === 'tier_locked' || pricingHref) && (
              <Button asChild size="sm" className="h-7 text-xs">
                <Link href={pricingHref ?? PRICING_PATH}>
                  Csomagok
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
