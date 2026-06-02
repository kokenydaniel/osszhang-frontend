'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/components/design';
import { SettingsTopTabs } from '@/components/settings/blocks/settings-top-tabs';
import { SettingsProfileTab } from '@/components/settings/profile/profile-tab';
import { SettingsHouseholdTab } from '@/components/settings/household/household-tab';
import { SettingsModulesTab } from '@/components/settings/modules-tab/modules-tab';
import { SettingsDeleteHouseholdModal } from '@/components/settings/household/delete-household-modal';
import { BillingSettings } from '@/components/settings/billing/billing-settings';
import { useAuthStore } from '@/stores/useAuthStore';
import { CreditCard, Home, LayoutGrid, User } from 'lucide-react';

export type SettingsTabId = 'profile' | 'household' | 'modules' | 'billing';
const VALID_TABS: SettingsTabId[] = ['profile', 'household', 'modules', 'billing'];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as SettingsTabId)) {
      setActiveTab(tab as SettingsTabId);
    }
  }, [searchParams]);

  const settingsTabs = [
    { id: 'profile' as const, label: 'Profilom', icon: User, hint: 'Személyes adatok, jelszó, fiók törlése' },
    { id: 'household' as const, label: 'Háztartás', icon: Home, hint: 'Név, családtagok, jogosultságok' },
    { id: 'modules' as const, label: 'Modulok', icon: LayoutGrid, hint: 'Bekapcsolható funkciók és beállításaik' },
    { id: 'billing' as const, label: 'Előfizetés', icon: CreditCard, hint: 'Csomag, fizetés, számlák' },
  ];

  return (
    <div className="flex flex-col gap-7 w-full min-w-0 max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Rendszer' }, { label: 'Beállítások' }]}
        title="Beállítások"
        description="Profil, háztartás és modulok — minden egy helyen."
      />

      <SettingsTopTabs tabs={settingsTabs} active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-8 w-full"
        >
          {activeTab === 'profile' && <SettingsProfileTab openDeleteModal={() => setIsDeleteModalOpen(true)} />}
          {activeTab === 'household' && <SettingsHouseholdTab />}
          {activeTab === 'modules' && <SettingsModulesTab />}
          {activeTab === 'billing' && <BillingSettings user={user} />}
        </motion.div>
      </AnimatePresence>

      <SettingsDeleteHouseholdModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
      />
    </div>
  );
}
