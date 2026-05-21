import { create } from 'zustand';

interface MetersUiState {
  expandedHistory: Record<number, boolean>;
  expandedFullHistory: Record<number, boolean>;
  calcValues: Record<number, string>;

  toggleHistory: (meterId: number) => void;
  toggleFullHistory: (meterId: number) => void;
  expandFullHistory: (meterId: number) => void;
  setCalcValue: (meterId: number, value: string) => void;
}

export const useMetersUiStore = create<MetersUiState>((set, get) => ({
  expandedHistory: {},
  expandedFullHistory: {},
  calcValues: {},

  toggleHistory: (meterId) =>
    set((state) => ({
      expandedHistory: {
        ...state.expandedHistory,
        [meterId]: !state.expandedHistory[meterId],
      },
    })),

  toggleFullHistory: (meterId) =>
    set((state) => ({
      expandedFullHistory: {
        ...state.expandedFullHistory,
        [meterId]: !state.expandedFullHistory[meterId],
      },
    })),

  expandFullHistory: (meterId) =>
    set((state) => ({
      expandedFullHistory: {
        ...state.expandedFullHistory,
        [meterId]: true,
      },
    })),

  setCalcValue: (meterId, value) =>
    set((state) => ({
      calcValues: { ...state.calcValues, [meterId]: value },
    })),
}));
