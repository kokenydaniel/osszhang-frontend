'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useInitStore } from '@/stores/useInit';
import { getCurrentMonth, getCurrentYear } from '@/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className || ''}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      {/* Secondary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      {/* Main content panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Skeleton className="lg:col-span-3 h-80 rounded-3xl" />
        <Skeleton className="lg:col-span-2 h-80 rounded-3xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
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

  useEffect(() => {
    initialize();
  }, [initialize]);


  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(JSON.parse(saved));
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  const handleToggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(!prev));
      return !prev;
    });
  };

  const currentUser = { 
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Betöltés...' 
  };

  // Permission protection logic
  const hasPermissionForRoute = () => {
    if (!user) return true; // wait for user details
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={handleToggle} 
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          pathname={pathname}
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          user={currentUser}
          onMobileMenuToggle={() => setMobileOpen(prev => !prev)}
        />
        <main className="flex-1 p-3 md:p-6 w-full overflow-x-hidden">
          {!isAllowed ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 md:p-12 max-w-md w-full bg-slate-900/40 backdrop-blur-xl border border-red-500/10 rounded-3xl shadow-2xl relative overflow-hidden my-auto mx-auto mt-20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-wider">Hozzáférés megtagadva</h2>
              <p className="text-slate-400 text-sm md:text-base mb-8">
                Ehhez a modulhoz nincs jogosultságod. Kérd meg a háztartásod adminisztrátorát, hogy adjon hozzáférést a beállításokban!
              </p>
              <a 
                href="/"
                className="bg-brand-primary hover:bg-brand-light text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 text-sm"
              >
                Vissza a Vezérlőpultra
              </a>
            </div>
          ) : !isInitialized ? (
            <DashboardSkeleton />
          ) : children}
        </main>
      </div>
    </div>
  );
}
