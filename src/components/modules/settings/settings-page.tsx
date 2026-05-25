'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/components/design';
import { SettingsTopTabs } from '@/components/modules/settings/settings-ui';
import { useSettingsState } from '@/components/modules/settings/hooks/use-settings-state';
import { SettingsProfileTab } from '@/components/modules/settings/settings-profile-tab';
import { SettingsHouseholdTab } from '@/components/modules/settings/settings-household-tab';
import { SettingsModulesTab } from '@/components/modules/settings/settings-modules-tab';
import { BillingSettings } from '@/components/modules/settings/BillingSettings';
import { SettingsPlatformTab } from '@/components/modules/settings/settings-platform-tab';
import { SettingsDeleteHouseholdModal } from '@/components/modules/settings/settings-delete-household-modal';
import { type SettingsTabId, useSettingsUiStore } from '@/stores/useSettingsUiStore';

const VALID_TABS: SettingsTabId[] = ['profile', 'household', 'modules', 'billing', 'platform'];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const state = useSettingsState();
  const { activeTab, setActiveTab, settingsTabs, ConfirmDeleteModal } = state;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as SettingsTabId)) {
      useSettingsUiStore.getState().setActiveTab(tab as SettingsTabId);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
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
          {activeTab === 'profile' && <SettingsProfileTab {...state} />}
          {activeTab === 'household' && <SettingsHouseholdTab {...state} />}
          {activeTab === 'modules' && <SettingsModulesTab {...state} />}
          {activeTab === 'billing' && <BillingSettings user={state.user} />}
          {activeTab === 'platform' && <SettingsPlatformTab />}
        </motion.div>
      </AnimatePresence>

      <SettingsDeleteHouseholdModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
