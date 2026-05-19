'use client';

import { useState } from 'react';
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
  ChevronLeft, 
  ChevronRight,
  X,
  PiggyBank,
  BarChart3
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

  const householdName = user?.household?.name || 'Otthon';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-200" 
          onClick={onMobileClose}
        />
      )}

      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen flex flex-col transition-all duration-300 z-50
          ${collapsed ? 'md:w-[72px]' : 'md:w-64'} 
          ${mobileOpen ? 'w-64 translate-x-0 shadow-2xl' : 'w-64 -translate-x-full md:translate-x-0'}
        `}
        style={{
          background: 'rgba(11, 15, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo area */}
        <div className="h-16 md:h-20 flex items-center px-4 md:px-5 gap-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 14px rgba(129,140,248,0.3)' }}>
            <Wallet size={18} className="text-white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 min-w-0 transition-opacity duration-200">
              <div className="text-sm font-black text-white truncate tracking-tight">PénzPilot</div>
              <div className="text-[0.6rem] font-bold truncate" style={{ color: '#818cf8' }}>
                {householdName}
              </div>
            </div>
          )}
          {/* Mobile close */}
          {mobileOpen && (
            <button 
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-5 custom-scrollbar">
          {navItems.map((group, gi) => {
            const filteredItems = group.items.filter(item => hasPermission(item.id));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gi} className="flex flex-col gap-1">
                {group.section && (!collapsed || mobileOpen) && (
                  <div className="px-3 mb-1.5 section-label">
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm group relative"
                      style={active ? {
                        background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.15))',
                        color: '#a5b4fc',
                        boxShadow: 'inset 0 0 0 1px rgba(129,140,248,0.25)',
                      } : {
                        color: '#64748b',
                      }}
                    >
                      {/* Active indicator */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#818cf8' }} />
                      )}
                      <span className={`shrink-0 transition-colors ${active ? 'text-brand-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {item.icon}
                      </span>
                      {(!collapsed || mobileOpen) && (
                        <span className={`truncate transition-colors ${active ? 'text-brand-light' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer toggle */}
        <div className="p-3 hidden md:block" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all font-bold text-sm"
            style={{ color: '#475569', background: 'rgba(255,255,255,0.03)' }}
            onClick={onToggle} 
            aria-label="Sidebar toggle"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span className="ml-2">Összecsuk</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
