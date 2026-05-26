import { create } from 'zustand';
import type { Meter } from '@/types';

interface MetersState {
  meters: Meter[];
  isLoading: boolean;
  isLoaded: boolean;

  setMeters: (meters: Meter[]) => void;
  setLoading: (loading: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  patchMeter: (id: number, updated: Meter) => void;
  appendMeter: (meter: Meter) => void;
  removeMeter: (id: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  meters: [] as Meter[],
  isLoading: false,
  isLoaded: false,
};

export const useMetersStore = create<MetersState>((set) => ({
  ...INITIAL_STATE,

  setMeters: (meters) => set({ meters, isLoading: false, isLoaded: true }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  patchMeter: (id, updated) =>
    set((state) => ({
      meters: state.meters.map((meter) => (meter.id === id ? updated : meter)),
    })),
  appendMeter: (meter) => set((state) => ({ meters: [...state.meters, meter] })),
  removeMeter: (id) => set((state) => ({ meters: state.meters.filter((m) => m.id !== id) })),
  reset: () => set(INITIAL_STATE),
}));
