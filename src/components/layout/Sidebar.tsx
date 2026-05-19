'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  LayoutDashboard, 
  Wallet, 
  ShoppingBag, 
  Home, 
  Zap, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  X,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

const NAV_ITEMS = [
  {
    section: null,
    items: [
      { href: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', id: 'dashboard' },
    ],
  },
  {
    section: 'Modulok',
    items: [
      { href: '/budget', icon: <Wallet size={18} />, label: 'Költségvetés', id: 'budget' },
      { href: '/business', icon: <ShoppingBag size={18} />, label: 'Little Loom', id: 'business' },
      { href: '/utilities', icon: <Home size={18} />, label: 'Rezsi', id: 'utilities' },
      { href: '/meters', icon: <Zap size={18} />, label: 'Közműórák', id: 'meters' },
    ],
  },
  {
    section: 'Beállítások',
    items: [
      { href: '/settings', icon: <Settings size={18} />, label: 'Beállítások', id: 'settings' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const businessEnabled = user?.household?.businessEnabled ?? user?.household?.business_enabled ?? true;
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';

  const navItems = [
    {
      section: null,
      items: [
        { href: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', id: 'dashboard' },
      ],
    },
    {
      section: 'Modulok',
      items: [
        { href: '/budget', icon: <Wallet size={18} />, label: 'Költségvetés', id: 'budget' },
        ...(businessEnabled ? [{ href: '/business', icon: <ShoppingBag size={18} />, label: businessName, id: 'business' }] : []),
        { href: '/utilities', icon: <Home size={18} />, label: 'Rezsi', id: 'utilities' },
        { href: '/meters', icon: <Zap size={18} />, label: 'Közműórák', id: 'meters' },
      ],
    },
    {
      section: 'Beállítások',
      items: [
        { href: '/settings', icon: <Settings size={18} />, label: 'Beállítások', id: 'settings' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const hasPermission = (itemId: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (['dashboard', 'settings'].includes(itemId)) return true;
    return user.permissions?.includes(itemId) ?? false;
  };

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-200" 
          onClick={onMobileClose}
        />
      )}

      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 z-50
          ${collapsed ? 'md:w-[68px]' : 'md:w-64'} 
          ${mobileOpen ? 'w-64 translate-x-0 shadow-2xl' : 'w-64 -translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 md:h-20 flex items-center px-4 md:px-5 border-b border-white/5 gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
            <Wallet size={20} className="text-brand-primary" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 min-w-0 transition-opacity duration-200">
              <div className="text-sm font-black text-white truncate uppercase tracking-tighter">PénzPilot</div>
              <div className="text-[0.6rem] font-bold text-brand-primary/80 uppercase tracking-widest truncate">
                {user?.household?.name || 'Családi Vezérlő'}
              </div>
            </div>
          )}
          {/* Mobile close button */}
          {mobileOpen && (
            <button 
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6 custom-scrollbar">
          {navItems.map((group, gi) => {
            const filteredItems = group.items.filter(item => hasPermission(item.id));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gi} className="flex flex-col gap-1">
                {group.section && (!collapsed || mobileOpen) && (
                  <div className="px-3 text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    {group.section}
                  </div>
                )}
                {filteredItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm
                        ${active 
                          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                      `}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {(!collapsed || mobileOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 hidden md:block">
          <button 
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={onToggle} 
            aria-label="Sidebar toggle"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span className="ml-2 font-bold text-sm">Összecsuk</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
