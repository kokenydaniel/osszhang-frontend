'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User as UserIcon, ChevronDown, Menu } from 'lucide-react';
import { MONTH_NAMES } from '@/types';
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

export function Header({
  pathname,
  month,
  year,
  onMonthChange,
  onYearChange,
  user,
  onMobileMenuToggle,
}: HeaderProps) {
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
    <header className="flex h-14 md:h-20 items-center justify-between px-3 md:px-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile hamburger */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white" 
          onClick={onMobileMenuToggle}
          aria-label="Menü"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center text-sm font-semibold text-slate-500 gap-2">
          <span>Háztartás Menedzser</span>
          <span>/</span>
          <span className="text-slate-200">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Period selector */}
        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
          <button className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white" onClick={prevMonth} aria-label="Előző hónap">
            ‹
          </button>
          <button className="px-2 md:px-4 text-xs md:text-sm font-bold text-slate-200">
            {formatMonthYear(month, year)}
          </button>
          <button className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white" onClick={nextMonth} aria-label="Következő hónap">
            ›
          </button>
        </div>



        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className={`flex items-center gap-2 md:gap-3 p-1 md:pr-3 rounded-full transition-colors border ${isDropdownOpen ? 'border-brand-primary bg-white/5' : 'border-transparent hover:bg-white/5'}`}
            aria-label="Felhasználói menü"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-xs font-bold text-white shadow-lg">{initials}</div>
            <span className="hidden md:block text-sm font-bold text-slate-200">{user?.name ?? 'Felhasználó'}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-48 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <button 
                onClick={() => { router.push('/settings'); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left text-sm font-semibold text-slate-200"
              >
                <Settings size={16} className="text-slate-400" />
                Beállítások
              </button>
              
              <div className="h-px bg-white/5 my-2" />
              
              <button 
                onClick={() => useAuthStore.getState().logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left text-sm font-semibold text-red-500"
              >
                <LogOut size={16} />
                Kilépés
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
