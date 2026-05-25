import { create } from 'zustand';
import type { SubscriptionTier } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBetaMode } from '@/lib/checkAccess';

export type UpgradeTier = 'pro' | 'premium';

interface UpgradeModalState {
  isOpen: boolean;
  requiredTier: UpgradeTier;
  featureLabel: string | null;
  open: (options: { requiredTier: UpgradeTier; featureLabel?: string }) => void;
  close: () => void;
}

export const useUpgradeModalStore = create<UpgradeModalState>((set) => ({
  isOpen: false,
  requiredTier: 'pro',
  featureLabel: null,
  open: ({ requiredTier, featureLabel }) =>
    set({ isOpen: true, requiredTier, featureLabel: featureLabel ?? null }),
  close: () => set({ isOpen: false, featureLabel: null }),
}));

export function useUpgradeModal() {
  const isOpen = useUpgradeModalStore((s) => s.isOpen);
  const requiredTier = useUpgradeModalStore((s) => s.requiredTier);
  const featureLabel = useUpgradeModalStore((s) => s.featureLabel);
  const open = useUpgradeModalStore((s) => s.open);
  const close = useUpgradeModalStore((s) => s.close);

  const showUpgradeModal = (options: { requiredTier: UpgradeTier; featureLabel?: string }) => {
    open(options);
  };

  return { isOpen, requiredTier, featureLabel, showUpgradeModal, closeUpgradeModal: close };
}

export function openUpgradeModal(options: {
  requiredTier: SubscriptionTier | UpgradeTier;
  featureLabel?: string;
}) {
  if (isBetaMode(useAuthStore.getState().user)) return;

  const tier = options.requiredTier === 'premium' ? 'premium' : 'pro';
  useUpgradeModalStore.getState().open({
    requiredTier: tier,
    featureLabel: options.featureLabel,
  });
}
