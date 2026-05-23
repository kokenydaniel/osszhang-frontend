'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/utils';
import { APP_NAME } from '@/lib/branding';
import { useLogout } from '@/hooks/useLogout';
import { Separator } from '@/components/ui/separator';
import classNames from 'classnames';

interface HeaderProps {
  pathname: string;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  user: { name: string } | null;
  onMobileMenuToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Irányítópult',
  '/budget': 'Költségvetés',
  '/business': 'Vállalkozás',
  '/utilities': 'Rezsi',
  '/meters': 'Közműórák',
  '/settings': 'Beállítások',
};

function getPageTitle(pathname: string) {
  if (pathname === '/') return pageTitles['/'];
  const match = Object.entries(pageTitles).find(([k]) => k !== '/' && pathname.startsWith(k));
  return match?.[1] ?? APP_NAME;
}

export function Header({ pathname, month, year, onMonthChange, onYearChange, user, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { logout } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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
    : 'ÖS';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        onClick={onMobileMenuToggle}
        id="mobile-menu-btn"
      >
        <Menu size={18} />
      </button>

      <h1 className="hidden text-sm font-semibold tracking-tight text-foreground lg:block">
        {getPageTitle(pathname)}
      </h1>

      <div className="flex-1" />

      <div className="flex items-center rounded-md border border-border bg-card">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
          id="prev-month-btn"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <span className="min-w-[92px] text-center text-xs font-medium tabular-nums text-foreground">
          {formatMonthYear(month, year)}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
          id="next-month-btn"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative shrink-0" ref={ref}>
        <button
          id="user-menu-btn"
          onClick={() => setOpen((v) => !v)}
          className={classNames(
            'flex h-8 max-w-none items-center gap-2 rounded-md pl-1 pr-2.5 text-sm transition-colors',
            open ? 'bg-muted' : 'hover:bg-muted',
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
            {initials}
          </div>
          <span className="hidden whitespace-nowrap font-medium text-foreground md:block">
            {user?.name ?? 'Tag'}
          </span>
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            className={classNames('hidden md:block text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-52 max-w-[min(calc(100vw-2rem),18rem)] animate-in fade-in slide-in-from-top-1 rounded-lg border border-border bg-popover p-1.5 shadow-md duration-150">
            <div className="px-2.5 py-2">
              <p className="text-sm font-medium leading-snug break-words text-foreground">{user?.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Háztartás tagja</p>
            </div>
            <Separator className="my-1" />
            <button
              id="go-settings-btn"
              onClick={() => { router.push('/settings'); setOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Settings size={14} className="text-muted-foreground" />
              Beállítások
            </button>
            <button
              id="logout-btn"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={14} />
              Kilépés
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
