'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { getCurrentMonth, getCurrentYear } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, user, initialize } = useAppStore();

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
    name: user.firstName ? `${user.firstName} ${user.lastName}` : 'Betöltés...' 
  };

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
          {children}
        </main>
      </div>
    </div>
  );
}
