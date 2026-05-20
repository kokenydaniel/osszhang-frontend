'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Wallet, Home, Settings,
  TrendingUp, Gauge, PanelLeftClose, PanelLeftOpen, X, Command,
  PiggyBank, TrendingDown,
} from 'lucide-react';

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

  const appName = userPreferences?.appName || 'PénzPilot';
  const businessEnabled = user?.household?.businessEnabled ?? user?.household?.business_enabled ?? true;
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';

  const navGroups = [
    {
      section: null,
      items: [{ href: '/', icon: LayoutDashboard, label: 'Irányítópult', id: 'dashboard' }],
    },
    {
      section: 'Pénzügyek',
      items: [
        { href: '/budget', icon: Wallet, label: 'Költségvetés', id: 'budget' },
        { href: '/savings', icon: PiggyBank, label: 'Megtakarítások', id: 'savings' },
        { href: '/debts', icon: TrendingDown, label: 'Tartozások', id: 'debts' },
      ],
    },
    {
      section: 'Háztartás',
      items: [
        { href: '/utilities', icon: Home, label: 'Rezsi', id: 'utilities' },
        { href: '/meters', icon: Gauge, label: 'Közműórák', id: 'meters' },
      ],
    },
    ...(businessEnabled
      ? [
          {
            section: 'Vállalkozás',
            items: [{ href: '/business', icon: TrendingUp, label: businessName, id: 'business' }],
          },
        ]
      : []),
    {
      section: 'Rendszer',
      items: [{ href: '/settings', icon: Settings, label: 'Beállítások', id: 'settings' }],
    },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const hasPermission = (id: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (['dashboard', 'settings'].includes(id)) return true;
    return user.permissions?.includes(id) ?? false;
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
        className={cn(
          'fixed md:sticky top-0 left-0 z-50 flex h-screen flex-col',
          'border-r border-border bg-sidebar transition-[width] duration-200 ease-out',
          collapsed ? 'md:w-[68px]' : 'md:w-[220px]',
          mobileOpen ? 'w-[220px] translate-x-0' : 'w-[220px] -translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand */}
        <div
          className={cn(
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
            const items = group.items.filter((i) => hasPermission(i.id));
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
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={!showLabels ? item.label : undefined}
                      className={cn(
                        'nav-item',
                        active && 'active',
                        !showLabels && 'justify-center px-2',
                      )}
                    >
                      <Icon size={16} strokeWidth={2} className="nav-icon shrink-0" />
                      {showLabels && <span className="truncate">{item.label}</span>}
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
            className={cn(
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
