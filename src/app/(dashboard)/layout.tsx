'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { isStoreLoading } from '@/lib/loadableStatus';
import { getCurrentMonth, getCurrentYear } from '@/utils';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { HouseholdOnboardingWizard } from '@/components/onboarding/HouseholdOnboardingWizard';
import { canAccessModule, type ModuleId } from '@/lib/moduleAccess';
import { requiresUpgradeForModule } from '@/lib/checkAccess';
import { openUpgradeModal } from '@/stores/useUpgradeModalStore';
import { needsHouseholdOnboarding } from '@/lib/householdOnboarding';
import { loadRouteData } from '@/lib/loadRouteData';
import { formatDisplayName } from '@/lib/personName';
import classNames from 'classnames';

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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, status } = useAuthStore();
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = usePreferenceStore();

  useEffect(() => {
    if (isStoreLoading(status) || !user) return;
    void loadRouteData(pathname, user);
  }, [pathname, status, user]);

  useEffect(() => {
    if (isStoreLoading(status) || !user) return;
    const tierBlocked = (() => {
      const routes: [string, ModuleId][] = [
        ['/savings', 'savings'],
        ['/debts', 'debts'],
        ['/utilities', 'utilities'],
        ['/meters', 'meters'],
        ['/business', 'business'],
      ];
      for (const [prefix, moduleId] of routes) {
        if (pathname.startsWith(prefix) && canAccessModule(user, moduleId)) {
          return requiresUpgradeForModule(user, moduleId);
        }
      }
      return null;
    })();

    if (tierBlocked) {
      openUpgradeModal({
        requiredTier: tierBlocked,
      });
      router.replace('/');
    }
  }, [pathname, router, status, user]);

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
    name: user ? formatDisplayName(user.firstName, user.lastName) || 'Betöltés...' : 'Betöltés...',
  };

  const hasPermissionForRoute = () => {
    if (!user) return true;
    const routes: [string, ModuleId][] = [
      ['/budget', 'budget'],
      ['/savings', 'savings'],
      ['/debts', 'debts'],
      ['/utilities', 'utilities'],
      ['/meters', 'meters'],
      ['/business', 'business'],
    ];
    for (const [prefix, moduleId] of routes) {
      if (pathname.startsWith(prefix)) {
        return canAccessModule(user, moduleId);
      }
    }
    return true;
  };

  const blockedModule = (() => {
    if (!user) return null;
    const routes: [string, ModuleId][] = [
      ['/budget', 'budget'],
      ['/savings', 'savings'],
      ['/debts', 'debts'],
      ['/utilities', 'utilities'],
      ['/meters', 'meters'],
      ['/business', 'business'],
    ];
    for (const [prefix, moduleId] of routes) {
      if (pathname.startsWith(prefix) && !canAccessModule(user, moduleId)) {
        return moduleId;
      }
    }
    return null;
  })();

  const isAllowed = hasPermissionForRoute();
  const showOnboarding = needsHouseholdOnboarding(user);

  useEffect(() => {
    if (!isStoreLoading(status) && !user) {
      router.replace('/login');
    }
  }, [router, status, user]);

  if (isStoreLoading(status)) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={classNames('flex min-h-screen bg-background', showOnboarding && 'overflow-hidden')}>
      <ChangePasswordModal />
      <UpgradeModal />
      <div className={classNames('flex min-h-screen w-full', showOnboarding && 'pointer-events-none select-none blur-[6px] opacity-60')}>
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
                {blockedModule && user?.role !== 'admin' && !user?.permissions?.includes(blockedModule)
                  ? 'Ehhez a modulhoz nincs jogosultságod. Kérd meg az adminisztrátort!'
                  : 'Ez a modul nincs bekapcsolva a háztartásban, vagy nincs hozzáférésed hozzá.'}
              </p>
              <Link
                href="/"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Vissza a Vezérlőpultra
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      </div>
      {showOnboarding && <HouseholdOnboardingWizard />}
    </div>
  );
}
