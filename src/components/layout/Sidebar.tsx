'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import config from '@/config/config';
import { canAccessModule, isHouseholdModuleId, type ModuleId } from '@/helpers/module-access';
import {
  canAccessModuleByTier,
  requiresUpgradeForModule,
  showTierBadgeForModule,
} from '@/helpers/check-access';
import { useUpgradeModalStore } from '@/stores/useUpgradeModalStore';
import { isPlatformAdmin } from '@/config/platform-admin';
import classNames from 'classnames';
import {
  LayoutDashboard, Wallet, Home, Settings,
  TrendingUp, Gauge,   PanelLeftClose, PanelLeftOpen, X, Command,
  PiggyBank, TrendingDown, Users, Wrench, Megaphone, MapPinned,
  Coins, Shield, Building2, HandCoins, Plug, Bot, ScrollText, Webhook, MessageSquareWarning, Sparkles, Layers, Package,
  CircleHelp,
} from 'lucide-react';
import { TierBadge } from '@/components/subscription/TierBadge';
import { useAdminFeedbackAttentionCount } from '@/hooks/useAdminFeedbackAttentionCount';
import { useUserFeedbackUnreadCount } from '@/hooks/useUserFeedbackUnreadCount';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const openUpgrade = useUpgradeModalStore((s) => s.open);
  const platformAdmin = isPlatformAdmin(user);
  const { count: feedbackAttentionCount } = useAdminFeedbackAttentionCount(platformAdmin);
  const { count: feedbackUnreadCount } = useUserFeedbackUnreadCount(!platformAdmin && !!user);

  const appName = config.branding.appName;
  const businessName = user?.household?.business_name ?? user?.household?.business_name ?? 'Vállalkozás';

  const navGroups = [
    {
      section: null,
      items: [{ href: '/', icon: LayoutDashboard, label: 'Irányítópult', id: 'dashboard' as const }],
    },
    {
      section: 'Pénzügyek',
      items: [
        { href: '/budget', icon: Wallet, label: 'Költségvetés', id: 'budget' as const },
        { href: '/savings', icon: PiggyBank, label: 'Megtakarítások', id: 'savings' as const },
        { href: '/debts', icon: TrendingDown, label: 'Tartozások', id: 'debts' as const },
        { href: '/receivables', icon: HandCoins, label: 'Kintlévőség', id: 'receivables' as const },
        { href: '/pocket-money', icon: Coins, label: 'Zsebpénz', id: 'pocket_money' as const },
        { href: '/insurance', icon: Shield, label: 'Biztosítások', id: 'insurance' as const },
        { href: '/rental', icon: Building2, label: 'Bérbeadás', id: 'rental' as const },
      ],
    },
    {
      section: 'Háztartás',
      items: [
        { href: '/utilities', icon: Home, label: 'Rezsi', id: 'utilities' as const },
        { href: '/meters', icon: Gauge, label: 'Közműórák', id: 'meters' as const },
      ],
    },
    {
      section: 'Vállalkozás',
      items: [{ href: '/business', icon: TrendingUp, label: businessName, id: 'business' as const }],
    },
    {
      section: 'Okos eszközök',
      items: [
        {
          href: '/tools/travel',
          icon: MapPinned,
          label: config.modules.labels.travel_planner,
          id: 'travel_planner' as const,
        },
      ],
    },
    {
      section: 'Rendszer',
      items: [
        { href: '/help', icon: CircleHelp, label: 'Súgó', id: 'help' as const },
        { href: '/settings', icon: Settings, label: 'Beállítások', id: 'settings' as const },
      ],
    },
    ...(isPlatformAdmin(user)
      ? [
          {
            section: 'Platform admin',
            items: [
              { href: '/admin/households', icon: Home, label: 'Háztartások', id: 'admin-households' as const },
              {
                href: '/admin/feedback-reports',
                icon: MessageSquareWarning,
                label: 'Bejelentések',
                id: 'admin-feedback-reports' as const,
              },
            ],
          },
          {
            section: 'Kiadás & funkciók',
            items: [
              { href: '/admin/modules', icon: Layers, label: 'Modul kiadás', id: 'admin-modules' as const },
              {
                href: '/admin/platform-services',
                icon: Package,
                label: 'Platform szolgáltatások',
                id: 'admin-platform-services' as const,
              },
              { href: '/admin/integrations', icon: Plug, label: 'Integrációk', id: 'admin-integrations' as const },
              { href: '/admin/ai-features', icon: Bot, label: 'AI kapcsolók', id: 'admin-ai-features' as const },
            ],
          },
          {
            section: 'Üzemeltetés',
            items: [
              { href: '/admin/features', icon: Wrench, label: 'Karbantartás & béta', id: 'admin-features' as const },
              { href: '/admin/announcements', icon: Megaphone, label: 'Rendszerüzenetek', id: 'admin-announcements' as const },
              { href: '/admin/webhooks', icon: Webhook, label: 'Webhook-ok', id: 'admin-webhooks' as const },
              { href: '/admin/audit-logs', icon: ScrollText, label: 'Audit napló', id: 'admin-audit-logs' as const },
              { href: '/admin/product-updates', icon: Sparkles, label: 'Újdonságok', id: 'admin-product-updates' as const },
            ],
          },
        ]
      : []),
  ];

  const globalNavIds = [
    'dashboard',
    'help',
    'settings',
    'feedback',
    ...([
      'admin-households',
      'admin-features',
      'admin-modules',
      'admin-platform-services',
      'admin-announcements',
      'admin-product-updates',
      'admin-feedback-reports',
      'admin-integrations',
      'admin-ai-features',
      'admin-webhooks',
      'admin-audit-logs',
    ] as const),
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const isNavVisible = (id: string) => {
    if (!user) return false;
    if (globalNavIds.includes(id as (typeof globalNavIds)[number])) {
      return true;
    }
    if (isHouseholdModuleId(id)) {
      return canAccessModule(user, id);
    }
    return false;
  };

  const handleNavClick = (
    e: React.MouseEvent,
    href: string,
    moduleId: string,
    label: string,
  ) => {
    if (
      !user || globalNavIds.includes(moduleId as (typeof globalNavIds)[number])
    ) {
      onMobileClose?.();
      return;
    }

    if (isHouseholdModuleId(moduleId) && !canAccessModule(user, moduleId)) {
      e.preventDefault();
      return;
    }

    if (isHouseholdModuleId(moduleId)) {
      const upgradeTier = requiresUpgradeForModule(user, moduleId);
      if (upgradeTier) {
        e.preventDefault();
        openUpgrade({
          requiredTier: upgradeTier === 'premium' ? 'premium' : 'pro',
          featureLabel: label,
          moduleId,
        });
        return;
      }
    }

    onMobileClose?.();
  };

  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 landscape:lg:hidden animate-in fade-in duration-150"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={classNames(
          'fixed landscape:lg:sticky top-0 left-0 z-50 flex h-screen flex-col',
          'border-r border-border bg-sidebar transition-[width,transform] duration-200 ease-out',
          collapsed ? 'landscape:lg:w-[68px]' : 'w-[220px]',
          mobileOpen
            ? 'w-[220px] translate-x-0'
            : 'w-[220px] -translate-x-full landscape:lg:translate-x-0 portrait:max-xl:-translate-x-full',
        )}
      >
        <div
          className={classNames(
            'flex h-14 shrink-0 items-center border-b border-border px-4',
            !showLabels && 'justify-center px-0',
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
            <Command size={14} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          {showLabels && (
            <span className="ml-2.5 truncate text-sm font-semibold tracking-tight text-foreground">
              {appName}
            </span>
          )}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground landscape:lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 min-h-0">
          {navGroups.map((group, gi) => {
            const items = group.items.filter((i) => isNavVisible(i.id));
            if (!items.length) return null;
            return (
              <div key={gi} className="flex flex-col gap-0.5">
                {group.section && showLabels && (
                  <p className="px-2 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.section}
                  </p>
                )}
                {items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const isGlobalNav = globalNavIds.includes(item.id as (typeof globalNavIds)[number]);
                  const moduleId = item.id as ModuleId;
                  const tierLocked =
                    user &&
                    !isGlobalNav &&
                    isHouseholdModuleId(moduleId) &&
                    canAccessModule(user, moduleId) &&
                    !canAccessModuleByTier(user, moduleId);
                  const badgeTier =
                    !isGlobalNav && isHouseholdModuleId(moduleId)
                      ? showTierBadgeForModule(user, moduleId)
                      : null;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href, item.id, item.label)}
                      title={!showLabels ? item.label : undefined}
                      className={classNames(
                        'nav-item',
                        active && 'active',
                        !showLabels && 'justify-center px-2',
                        tierLocked && 'opacity-90',
                      )}
                    >
                      <Icon size={16} strokeWidth={2} className="nav-icon shrink-0" />
                      {showLabels && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {showLabels && item.id === 'admin-feedback-reports' && feedbackAttentionCount > 0 ? (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[0.65rem] font-semibold text-white">
                          {feedbackAttentionCount > 99 ? '99+' : feedbackAttentionCount}
                        </span>
                      ) : null}
                      {showLabels && badgeTier && (
                        <TierBadge tier={badgeTier === 'premium' ? 'premium' : 'pro'} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {!platformAdmin ? (
          <div className="shrink-0 border-t border-border/80 px-3 py-3 mt-auto">
            <Link
              href="/feedback"
              onClick={() => onMobileClose?.()}
              title={!showLabels ? 'Visszajelzés' : undefined}
              className={classNames(
                'nav-item',
                isActive('/feedback') && 'active',
                !showLabels && 'justify-center px-2',
              )}
            >
              <MessageSquareWarning size={16} strokeWidth={2} className="nav-icon shrink-0" />
              {showLabels && <span className="truncate flex-1">Visszajelzés</span>}
              {showLabels && feedbackUnreadCount > 0 ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-semibold text-primary-foreground">
                  {feedbackUnreadCount > 9 ? '9+' : feedbackUnreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        ) : null}

        <div className="shrink-0 border-t border-border p-2">
          <button
            onClick={onToggle}
            className={classNames(
              'hidden landscape:lg:flex w-full items-center justify-center gap-2 rounded-md py-2 px-2',
              'text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen size={15} />
            ) : (
              <>
                <PanelLeftClose size={15} />
                <span>Összecsukás</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
