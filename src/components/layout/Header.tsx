'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/utils';
import { useAuthStore } from '@/stores/useAuthStore';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/budget': 'Kifizetések',
  '/business': 'Little Loom',
  '/utilities': 'Rezsi',
  '/meters': 'Közműórák',
  '/settings': 'Beállítások',
};

interface HeaderProps {
  pathname: string;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  user: { name: string } | null;
  onMobileMenuToggle?: () => void;
}

export function Header({ pathname, month, year, onMonthChange, onYearChange, user, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = Object.entries(PAGE_TITLES).find(
    ([key]) => key !== '/' ? pathname.startsWith(key) : pathname === '/'
  )?.[1] ?? 'Háztartás Menedzser';

  const prevMonth = () => {
    if (month === 1) { onMonthChange(12); onYearChange(year - 1); }
    else onMonthChange(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { onMonthChange(1); onYearChange(year + 1); }
    else onMonthChange(month + 1);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DK';

  return (
    <header 
      className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8 sticky top-0 z-30"
      style={{
        background: 'rgba(11, 15, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all text-slate-400 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          onClick={onMobileMenuToggle}
          aria-label="Menü"
        >
          <Menu size={18} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: '#334155' }}>Háztartás Menedzser</span>
          <span style={{ color: '#1e293b' }}>/</span>
          <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>{title}</span>
        </div>
      </div>

      {/* Right: month picker + user */}
      <div className="flex items-center gap-3">
        {/* Month selector */}
        <div 
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-slate-500 hover:text-slate-200 hover:bg-white/8"
            onClick={prevMonth} 
            aria-label="Előző hónap"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="px-3 text-xs font-bold" style={{ color: '#cbd5e1', minWidth: 80, textAlign: 'center' }}>
            {formatMonthYear(month, year)}
          </span>
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-slate-500 hover:text-slate-200 hover:bg-white/8"
            onClick={nextMonth} 
            aria-label="Következő hónap"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl transition-all"
            style={isDropdownOpen 
              ? { background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
            }
            aria-label="Felhasználói menü"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {/* Avatar */}
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}
            >
              {initials}
            </div>
            <span className="hidden md:block text-xs font-bold" style={{ color: '#cbd5e1' }}>
              {user?.name ?? 'Felhasználó'}
            </span>
            <ChevronDown size={13} className={`transition-transform hidden md:block`} style={{ color: '#475569', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {isDropdownOpen && (
            <div 
              className="absolute top-[calc(100%+8px)] right-0 z-50 w-48 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                background: 'rgba(15, 20, 32, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
              }}
            >
              <button 
                onClick={() => { router.push('/settings'); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group"
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
              >
                <Settings size={15} style={{ color: '#475569' }} />
                <span className="text-sm font-semibold" style={{ color: '#94a3b8' }}>Beállítások</span>
              </button>
              
              <div className="divider my-1" />
              
              <button 
                onClick={() => useAuthStore.getState().logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
              >
                <LogOut size={15} style={{ color: '#f87171' }} />
                <span className="text-sm font-semibold" style={{ color: '#f87171' }}>Kilépés</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
