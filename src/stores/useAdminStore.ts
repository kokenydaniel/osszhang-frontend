import { create } from 'zustand';
import type { AdminUser, AdminUsersMeta, AdminHousehold, AdminHouseholdsMeta, FeatureFlag, SystemAnnouncement, ProductUpdate } from '@/types/admin';

interface AdminState {
  users: AdminUser[];
  meta: AdminUsersMeta | null;
  households: AdminHousehold[];
  householdsMeta: AdminHouseholdsMeta | null;
  isLoading: boolean;
  isLoaded: boolean;
  householdsLoading: boolean;
  householdsLoaded: boolean;
  featureFlags: Record<string, FeatureFlag>;
  featureFlagsLoading: boolean;
  featureFlagsLoaded: boolean;
  announcements: SystemAnnouncement[];
  announcementsLoading: boolean;
  announcementsLoaded: boolean;
  productUpdates: ProductUpdate[];
  productUpdatesLoading: boolean;
  productUpdatesLoaded: boolean;
  setUsersPage: (users: AdminUser[], meta: AdminUsersMeta) => void;
  patchUser: (user: AdminUser) => void;
  setHouseholdsPage: (households: AdminHousehold[], meta: AdminHouseholdsMeta) => void;
  patchHousehold: (household: AdminHousehold) => void;
  setLoading: (loading: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  setHouseholdsLoading: (loading: boolean) => void;
  setHouseholdsLoaded: (loaded: boolean) => void;
  setFeatureFlags: (flags: Record<string, FeatureFlag>) => void;
  patchFeatureFlag: (key: string, value: boolean) => void;
  setFeatureFlagsLoading: (loading: boolean) => void;
  setFeatureFlagsLoaded: (loaded: boolean) => void;
  setAnnouncements: (announcements: SystemAnnouncement[]) => void;
  applyAnnouncementToggle: (announcement: SystemAnnouncement) => void;
  patchAnnouncement: (announcement: SystemAnnouncement) => void;
  removeAnnouncement: (id: number) => void;
  prependAnnouncement: (announcement: SystemAnnouncement) => void;
  setAnnouncementsLoading: (loading: boolean) => void;
  setAnnouncementsLoaded: (loaded: boolean) => void;
  setProductUpdates: (updates: ProductUpdate[]) => void;
  patchProductUpdate: (update: ProductUpdate) => void;
  removeProductUpdate: (id: number) => void;
  prependProductUpdate: (update: ProductUpdate) => void;
  setProductUpdatesLoading: (loading: boolean) => void;
  setProductUpdatesLoaded: (loaded: boolean) => void;
  reset: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  users: [],
  meta: null,
  households: [],
  householdsMeta: null,
  isLoading: false,
  isLoaded: false,
  householdsLoading: false,
  householdsLoaded: false,
  featureFlags: {},
  featureFlagsLoading: false,
  featureFlagsLoaded: false,
  announcements: [],
  announcementsLoading: false,
  announcementsLoaded: false,
  productUpdates: [],
  productUpdatesLoading: false,
  productUpdatesLoaded: false,

  setUsersPage: (users, meta) => set({ users, meta }),
  patchUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === user.id ? user : u)),
    })),
  setHouseholdsPage: (households, householdsMeta) => set({ households, householdsMeta }),
  patchHousehold: (household) =>
    set((state) => ({
      households: state.households.map((h) => (h.id === household.id ? household : h)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  setHouseholdsLoading: (householdsLoading) => set({ householdsLoading }),
  setHouseholdsLoaded: (householdsLoaded) => set({ householdsLoaded }),
  setFeatureFlags: (featureFlags) => set({ featureFlags }),
  patchFeatureFlag: (key, value) =>
    set((state) => ({
      featureFlags: state.featureFlags[key]
        ? {
            ...state.featureFlags,
            [key]: { ...state.featureFlags[key], value },
          }
        : state.featureFlags,
    })),
  setFeatureFlagsLoading: (featureFlagsLoading) => set({ featureFlagsLoading }),
  setFeatureFlagsLoaded: (featureFlagsLoaded) => set({ featureFlagsLoaded }),
  setAnnouncements: (announcements) => set({ announcements }),
  applyAnnouncementToggle: (announcement) =>
    set((state) => ({
      announcements: state.announcements.map((item) => {
        if (item.id === announcement.id) return announcement;
        if (announcement.is_active) return { ...item, is_active: false };
        return item;
      }),
    })),
  patchAnnouncement: (announcement) =>
    set((state) => ({
      announcements: state.announcements.map((item) =>
        item.id === announcement.id ? announcement : item,
      ),
    })),
  removeAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.filter((item) => item.id !== id),
    })),
  prependAnnouncement: (announcement) =>
    set((state) => ({ announcements: [announcement, ...state.announcements] })),
  setAnnouncementsLoading: (announcementsLoading) => set({ announcementsLoading }),
  setAnnouncementsLoaded: (announcementsLoaded) => set({ announcementsLoaded }),
  setProductUpdates: (productUpdates) => set({ productUpdates }),
  patchProductUpdate: (update) =>
    set((state) => ({
      productUpdates: state.productUpdates.map((item) => (item.id === update.id ? update : item)),
    })),
  removeProductUpdate: (id) =>
    set((state) => ({
      productUpdates: state.productUpdates.filter((item) => item.id !== id),
    })),
  prependProductUpdate: (update) =>
    set((state) => ({ productUpdates: [update, ...state.productUpdates] })),
  setProductUpdatesLoading: (productUpdatesLoading) => set({ productUpdatesLoading }),
  setProductUpdatesLoaded: (productUpdatesLoaded) => set({ productUpdatesLoaded }),
  reset: () =>
    set({
      users: [],
      meta: null,
      households: [],
      householdsMeta: null,
      isLoading: false,
      isLoaded: false,
      householdsLoading: false,
      householdsLoaded: false,
      featureFlags: {},
      featureFlagsLoading: false,
      featureFlagsLoaded: false,
      announcements: [],
      announcementsLoading: false,
      announcementsLoaded: false,
      productUpdates: [],
      productUpdatesLoading: false,
      productUpdatesLoaded: false,
    }),
}));
