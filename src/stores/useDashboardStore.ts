import { create } from 'zustand';
import type { AiCfoBrief } from '@/types';

interface DashboardState {
  aiCfoAdvice: AiCfoBrief | null;
  aiCfoCacheKey: string | null;
  setAiCfoAdvice: (cacheKey: string, advice: AiCfoBrief) => void;
  clearAiCfoAdvice: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  aiCfoAdvice: null,
  aiCfoCacheKey: null,
  setAiCfoAdvice: (cacheKey, advice) => set({ aiCfoAdvice: advice, aiCfoCacheKey: cacheKey }),
  clearAiCfoAdvice: () => set({ aiCfoAdvice: null, aiCfoCacheKey: null }),
}));
