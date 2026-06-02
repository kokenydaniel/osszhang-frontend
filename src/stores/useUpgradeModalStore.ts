import { create } from 'zustand';
import type { PremiumFeatureId } from '@/config/subscription';
import type { ModuleId } from '@/helpers/module-access';
import type { SubscriptionTier } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBetaMode } from '@/helpers/check-access';

export type UpgradeTier = 'pro' | 'premium';

export interface UpgradeModalOpenOptions {
  requiredTier: UpgradeTier;
  featureLabel?: string;
  featureId?: PremiumFeatureId;
  moduleId?: ModuleId;
}

interface UpgradeModalState {
  isOpen: boolean;
  requiredTier: UpgradeTier;
  featureLabel: string | null;
  featureId: PremiumFeatureId | null;
  moduleId: ModuleId | null;
  open: (options: UpgradeModalOpenOptions) => void;
  close: () => void;
}

export const useUpgradeModalStore = create<UpgradeModalState>((set) => ({
  isOpen: false,
  requiredTier: 'pro',
  featureLabel: null,
  featureId: null,
  moduleId: null,
  open: ({ requiredTier, featureLabel, featureId, moduleId }) =>
    set({
      isOpen: true,
      requiredTier,
      featureLabel: featureLabel ?? null,
      featureId: featureId ?? null,
      moduleId: moduleId ?? null,
    }),
  close: () =>
    set({ isOpen: false, featureLabel: null, featureId: null, moduleId: null }),
}));

export function useUpgradeModal() {
  const isOpen = useUpgradeModalStore((s) => s.isOpen);
  const requiredTier = useUpgradeModalStore((s) => s.requiredTier);
  const featureLabel = useUpgradeModalStore((s) => s.featureLabel);
  const featureId = useUpgradeModalStore((s) => s.featureId);
  const moduleId = useUpgradeModalStore((s) => s.moduleId);
  const open = useUpgradeModalStore((s) => s.open);
  const close = useUpgradeModalStore((s) => s.close);

  const showUpgradeModal = (options: UpgradeModalOpenOptions) => {
    open(options);
  };

  return {
    isOpen,
    requiredTier,
    featureLabel,
    featureId,
    moduleId,
    showUpgradeModal,
    closeUpgradeModal: close,
  };
}

export function openUpgradeModal(
  options: UpgradeModalOpenOptions & { requiredTier: SubscriptionTier | UpgradeTier },
) {
  if (isBetaMode(useAuthStore.getState().user)) return;

  const tier = options.requiredTier === 'premium' ? 'premium' : 'pro';
  useUpgradeModalStore.getState().open({
    requiredTier: tier,
    featureLabel: options.featureLabel,
    featureId: options.featureId,
    moduleId: options.moduleId,
  });
}
