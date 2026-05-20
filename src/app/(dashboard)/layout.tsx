'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useInitStore } from '@/stores/useInit';
import { getCurrentMonth, getCurrentYear } from '@/utils';
import { Lock } from 'lucide-react';
import Link from 'next/link';

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-card border border-border shadow-sm animate-pulse ${className ?? ''}`}>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-muted" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="rounded-lg bg-card border border-border shadow-sm animate-pulse p-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-lg bg-card border border-border shadow-sm animate-pulse h-72" />
        <div className="lg:col-span-2 rounded-lg bg-card border border-border shadow-sm animate-pulse h-72" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user } = useAuthStore();
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = usePreferenceStore();
  const { initialize, isInitialized } = useInitStore();

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(JSON.parse(saved));
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  const handleToggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(!prev));
      return !prev;
    });
  };

  const currentUser = {
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Betöltés...',
  };

  const hasPermissionForRoute = () => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    const permissions = user.permissions || [];
    if (pathname.startsWith('/budget') && !permissions.includes('budget')) return false;
    if (pathname.startsWith('/utilities') && !permissions.includes('utilities')) return false;
    if (pathname.startsWith('/meters') && !permissions.includes('meters')) return false;
    if (pathname.startsWith('/business') && !permissions.includes('business')) return false;
    if (pathname.startsWith('/savings') && !permissions.includes('savings')) return false;
    if (pathname.startsWith('/debts') && !permissions.includes('debts')) return false;
    return true;
  };

  const isAllowed = hasPermissionForRoute();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pathname={pathname}
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          user={currentUser}
          onMobileMenuToggle={() => setMobileOpen((p) => !p)}
        />
        <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
          {!isAllowed ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 max-w-sm mx-auto mt-12">
              <div className="h-11 w-11 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-5">
                <Lock size={18} />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2">Hozzáférés megtagadva</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ehhez a modulhoz nincs jogosultságod. Kérd meg az adminisztrátort!
              </p>
              <Link
                href="/"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Vissza a Vezérlőpultra
              </Link>
            </div>
          ) : !isInitialized ? (
            <DashboardSkeleton />
          ) : children}
        </main>
      </div>
    </div>
  );
}
