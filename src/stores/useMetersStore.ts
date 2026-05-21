import { create } from 'zustand';
import { Meter, MeterReading } from '@/types';
import { metersClient } from '@/lib/api-client';

interface MetersState {
  meters: Meter[];
  isLoading: boolean;

  fetchMeters: () => Promise<void>;
  addMeter: (m: Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>) => Promise<void>;
  deleteMeter: (id: number) => Promise<void>;
  
  addMeterReading: (meterId: number, reading: Omit<MeterReading, 'id' | 'consumption'>) => Promise<void>;
  updateMeterReading: (meterId: number, readingId: number, reading: Partial<Omit<MeterReading, 'id' | 'consumption'>>) => Promise<void>;
  deleteMeterReading: (meterId: number, readingId: number) => Promise<void>;
}

export const useMetersStore = create<MetersState>((set, get) => ({
  meters: [],
  isLoading: false,

  fetchMeters: async () => {
    set({ isLoading: true });
    try {
      const res = await metersClient.getAll();
      set({ meters: res.data });
    } catch (e) {
      console.error('Failed to fetch meters', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addMeter: async (m) => {
    const res = await metersClient.create(m);
    set({ meters: [...get().meters, res.data] });
  },

  deleteMeter: async (id) => {
    await metersClient.delete(id);
    set({ meters: get().meters.filter((m) => m.id !== id) });
  },

  addMeterReading: async (meterId, reading) => {
    const res = await metersClient.addReading(meterId, reading);
    set({
      meters: get().meters.map((m) =>
        m.id === meterId ? res.data : m
      ),
    });
  },

  updateMeterReading: async (meterId, readingId, reading) => {
    const res = await metersClient.updateReading(meterId, readingId, reading);
    set({
      meters: get().meters.map((m) =>
        m.id === meterId ? res.data : m
      ),
    });
  },

  deleteMeterReading: async (meterId, readingId) => {
    const res = await metersClient.deleteReading(meterId, readingId);
    set({
      meters: get().meters.map((m) =>
        m.id === meterId ? res.data : m
      ),
    });
  },
}));
