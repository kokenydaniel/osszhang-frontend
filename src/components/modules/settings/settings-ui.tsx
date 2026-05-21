'use client';

import type { LucideIcon } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import classNames from 'classnames';

export interface SettingsTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
}

/** Kompakt felső fül sáv — teljes szélesség */
export function SettingsTopTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: SettingsTabItem[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex w-full gap-1 rounded-xl border border-border bg-muted/30 p-1"
      aria-label="Beállítások menü"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={tab.hint}
            onClick={() => onChange(tab.id as T)}
            className={classNames(
              'flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 transition-all touch-manipulation sm:flex-row sm:gap-2 sm:px-3',
              isActive
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Icon size={15} strokeWidth={2.2} className={classNames('shrink-0', isActive && 'text-primary')} />
              <span className={classNames('truncate text-[0.9375rem] font-semibold', !isActive && 'font-medium')}>
                {tab.label}
              </span>
            </span>
            {isActive && tab.hint ? (
              <span className="hidden sm:block text-[0.7rem] font-normal text-muted-foreground truncate max-w-full px-1">
                {tab.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsSectionHeading({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge}
      </div>
      {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
    </div>
  );
}

export function SettingsBlock({
  title,
  description,
  icon: Icon,
  toneClassName,
  children,
  footer,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  toneClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <header className="flex items-start gap-3 border-b border-border bg-gradient-to-r from-muted/30 to-transparent px-5 py-4">
        <div
          className={classNames(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
            toneClassName,
          )}
        >
          <Icon size={17} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>}
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
      {footer ? (
        <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6 flex flex-wrap justify-end gap-2">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Modul / integráció kártya — egységes fejléc: ikon + szöveg balra, kapcsoló jobbra */
export function ModuleFeatureCard({
  title,
  description,
  enabled,
  onToggle,
  icon,
  iconClassName,
  children,
  footer,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  iconClassName?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article
      className={classNames(
        'flex flex-col rounded-xl border transition-all duration-200 overflow-hidden',
        enabled
          ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
          : 'border-border bg-muted/10',
      )}
    >
      <div className="flex gap-4 p-5 sm:p-6">
        <div
          className={classNames(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm',
            enabled
              ? iconClassName ?? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-muted text-muted-foreground border border-border',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-foreground leading-snug">{title}</h4>
            <span
              className={classNames(
                'text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                enabled
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground',
              )}
            >
              {enabled ? 'Be' : 'Ki'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-prose">{description}</p>
          {!enabled && (
            <p className="text-xs text-muted-foreground/80 mt-2 italic">
              Ki van kapcsolva — nem jelenik meg a menüben és a kapcsolódó beállítások rejtve maradnak.
            </p>
          )}
        </div>
        <div className="flex h-12 shrink-0 items-start pt-0.5">
          <Switch checked={enabled} onCheckedChange={() => onToggle()} aria-label={`${title} ${enabled ? 'kikapcsolása' : 'bekapcsolása'}`} />
        </div>
      </div>
      {enabled && children ? (
        <div className="border-t border-border bg-muted/20 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 space-y-4">
          {children}
        </div>
      ) : null}
      {footer ? (
        <div className="border-t border-border bg-muted/10 px-5 py-4 sm:px-6 flex flex-wrap justify-end gap-2">
          {footer}
        </div>
      ) : null}
    </article>
  );
}

export function SettingsDivider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          {label}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }
  return <div className="h-px bg-border my-2" />;
}

export function PermissionChip({
  label,
  icon: Icon,
  active,
  disabled,
  pending,
  onClick,
  title,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      title={title}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.8rem] font-medium transition-colors duration-100 touch-manipulation',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground',
        !disabled && !pending && !active && 'hover:border-foreground/25 hover:bg-muted/40 hover:text-foreground cursor-pointer',
        disabled && 'cursor-default opacity-80',
        pending && 'opacity-60 pointer-events-none',
      )}
    >
      <Icon size={12} strokeWidth={2.4} />
      {label}
    </button>
  );
}

export function MemberCard({
  initials,
  name,
  username,
  badges,
  actions,
  permissions,
}: {
  initials: string;
  name: string;
  username: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  permissions: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden hover:border-primary/15 transition-colors">
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-primary/[0.04] to-transparent border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-2">{name}</p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">@{username}</p>
            {badges && <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="px-4 sm:px-5 py-4 bg-muted/10">
        <p className="text-xs font-medium text-muted-foreground mb-2.5">Hozzáférés modulokhoz</p>
        <div className="flex flex-wrap gap-1.5">{permissions}</div>
      </div>
    </div>
  );
}

export function DangerZonePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/[0.04] via-card to-card overflow-hidden">
      <header className="flex items-start gap-3 px-5 py-4 border-b border-destructive/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Trash2 size={16} strokeWidth={2.2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

export function CategoryTag({
  name,
  onDelete,
}: {
  name: string;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-border bg-gradient-to-br from-card to-muted/20 px-3 py-2.5 text-sm shadow-sm hover:border-primary/25 hover:shadow-md transition-all">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="flex-1 truncate font-medium text-foreground">{name}</span>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        aria-label={`${name} törlése`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
