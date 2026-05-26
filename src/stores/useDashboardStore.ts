import { create } from 'zustand';
import type { AiCfoBrief } from '@/types';

interface DashboardState {
  aiCfoAdvice: AiCfoBrief | null;
  aiCfoCacheKey: string | null;
  setAiCfoAdvice: (cacheKey: string, advice: AiCfoBrief) => void;
  clearAiCfoAdvice: () => void;
}

export function buildAiCfoCacheKey(
  walletId: number,
  year: number,
  month: number,
  dataFingerprint?: string,
): string {
  const base = `${walletId}-${year}-${month}`;
  return dataFingerprint ? `${base}:${dataFingerprint}` : base;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  aiCfoAdvice: null,
  aiCfoCacheKey: null,

  setAiCfoAdvice: (cacheKey, advice) => set({ aiCfoAdvice: advice, aiCfoCacheKey: cacheKey }),

  clearAiCfoAdvice: () => set({ aiCfoAdvice: null, aiCfoCacheKey: null }),
}));
