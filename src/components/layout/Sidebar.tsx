'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { canAccessModule, isModuleEnabled, type ModuleId } from '@/lib/moduleAccess';
import { canAccessModuleByTier, requiresUpgradeForModule, showTierBadgeForModule } from '@/lib/checkAccess';
import { useUpgradeModalStore } from '@/stores/useUpgradeModalStore';
import { resolveAppName } from '@/lib/branding';
import { isPlatformAdmin } from '@/lib/platformAdmin';
import { isPlatformFeatureEnabled } from '@/lib/platformFeatureFlags';
import classNames from 'classnames';
import {
  LayoutDashboard, Wallet, Home, Settings,
  TrendingUp, Gauge, PanelLeftClose, PanelLeftOpen, X, Command,
  PiggyBank, TrendingDown, Users, ToggleLeft, Megaphone, MapPinned,
} from 'lucide-react';
import { TierBadge } from '@/components/subscription/TierBadge';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { userPreferences } = usePreferenceStore();
  const openUpgrade = useUpgradeModalStore((s) => s.open);

  const appName = resolveAppName(userPreferences?.appName);
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';

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
    ...(isPlatformFeatureEnabled(user, 'enable_ai_travel_planner')
      ? [
          {
            section: '🛠️ Okos eszközök',
            items: [
              {
                href: '/tools/travel',
                icon: MapPinned,
                label: 'Utazástervező',
                id: 'tools-travel' as const,
              },
            ],
          },
        ]
      : []),
    {
      section: 'Rendszer',
      items: [{ href: '/settings', icon: Settings, label: 'Beállítások', id: 'settings' as const }],
    },
    ...(isPlatformAdmin(user)
      ? [
          {
            section: 'Platform admin',
            items: [
              { href: '/admin/users', icon: Users, label: 'Felhasználók', id: 'admin-users' as const },
              { href: '/admin/features', icon: ToggleLeft, label: 'Rendszer funkciók', id: 'admin-features' as const },
              { href: '/admin/announcements', icon: Megaphone, label: 'Rendszerüzenetek', id: 'admin-announcements' as const },
            ],
          },
        ]
      : []),
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const isNavVisible = (id: string) => {
    if (!user) return false;
    if (id === 'tools-travel') return isPlatformFeatureEnabled(user, 'enable_ai_travel_planner');
    if (['dashboard', 'settings', 'admin-users', 'admin-features', 'admin-announcements'].includes(id)) return true;
    return isModuleEnabled(user.household, id as ModuleId);
  };

  const handleNavClick = (
    e: React.MouseEvent,
    href: string,
    moduleId: string,
    label: string,
  ) => {
    if (
      !user ||
      ['dashboard', 'settings', 'admin-users', 'admin-features', 'admin-announcements', 'tools-travel'].includes(
        moduleId,
      )
    ) {
      onMobileClose?.();
      return;
    }

    const mod = moduleId as ModuleId;

    if (!canAccessModule(user, mod)) {
      e.preventDefault();
      return;
    }

    const upgradeTier = requiresUpgradeForModule(user, mod);
    if (upgradeTier) {
      e.preventDefault();
      openUpgrade({
        requiredTier: upgradeTier === 'premium' ? 'premium' : 'pro',
        featureLabel: label,
      });
      return;
    }

    onMobileClose?.();
  };

  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden animate-in fade-in duration-150"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={classNames(
          'fixed md:sticky top-0 left-0 z-50 flex h-screen flex-col',
          'border-r border-border bg-sidebar transition-[width] duration-200 ease-out',
          collapsed ? 'md:w-[68px]' : 'md:w-[220px]',
          mobileOpen ? 'w-[220px] translate-x-0' : 'w-[220px] -translate-x-full md:translate-x-0',
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
              className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground md:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
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
                  const mod = item.id as ModuleId;
                  const tierLocked =
                    user &&
                    !['dashboard', 'settings', 'admin-users', 'admin-features', 'admin-announcements', 'tools-travel'].includes(
                      item.id,
                    ) &&
                    canAccessModule(user, mod) &&
                    !canAccessModuleByTier(user, mod);
                  const badgeTier =
                    !['admin-users', 'admin-features', 'admin-announcements', 'tools-travel'].includes(item.id) &&
                    showTierBadgeForModule(user, mod);

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

        <div className="shrink-0 border-t border-border p-2">
          <button
            onClick={onToggle}
            className={classNames(
              'hidden md:flex w-full items-center justify-center gap-2 rounded-md py-2 px-2',
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
