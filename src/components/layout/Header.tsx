'use client';

import { useRouter } from 'next/navigation';
import { Settings, LogOut, ChevronDown, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/utils';
import config from '@/config/config';
import { useLogout } from '@/hooks/useLogout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

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
  return match?.[1] ?? config.branding.appName;
}

export function Header({ pathname, month, year, onMonthChange, onYearChange, user, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { logout } = useLogout();

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
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground landscape:lg:hidden"
        onClick={onMobileMenuToggle}
        id="mobile-menu-btn"
      >
        <Menu size={18} />
      </Button>

      <h1 className="hidden text-sm font-semibold tracking-tight text-foreground lg:block">
        {getPageTitle(pathname)}
      </h1>

      <div className="flex-1" />

      <div className="flex items-center rounded-md border border-border bg-card">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={prevMonth}
          className="text-muted-foreground"
          id="prev-month-btn"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </Button>
        <span className="min-w-[92px] text-center text-xs font-medium tabular-nums text-foreground">
          {formatMonthYear(month, year)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={nextMonth}
          className="text-muted-foreground"
          id="next-month-btn"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            id="user-menu-btn"
            className="flex h-8 max-w-none items-center gap-2 pl-1 pr-2.5 text-sm"
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
              className="hidden md:block text-muted-foreground transition-transform data-[state=open]:rotate-180"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium leading-snug break-words text-foreground">{user?.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Háztartás tagja</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            id="go-settings-btn"
            onClick={() => router.push('/settings')}
            className="gap-2.5 cursor-pointer"
          >
            <Settings size={14} className="text-muted-foreground" />
            Beállítások
          </DropdownMenuItem>
          <DropdownMenuItem
            id="logout-btn"
            onClick={() => void logout()}
            variant="destructive"
            className="gap-2.5 cursor-pointer"
          >
            <LogOut size={14} className="text-destructive" />
            Kilépés
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
