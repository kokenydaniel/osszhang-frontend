import { create } from 'zustand';
import type { AdminUser, AdminUsersMeta, FeatureFlag, SystemAnnouncement } from '@/types/admin';

interface AdminState {
  users: AdminUser[];
  meta: AdminUsersMeta | null;
  isLoading: boolean;
  isLoaded: boolean;
  featureFlags: Record<string, FeatureFlag>;
  featureFlagsLoading: boolean;
  featureFlagsLoaded: boolean;
  announcements: SystemAnnouncement[];
  announcementsLoading: boolean;
  announcementsLoaded: boolean;
  setUsersPage: (users: AdminUser[], meta: AdminUsersMeta) => void;
  patchUser: (user: AdminUser) => void;
  setLoading: (loading: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  setFeatureFlags: (flags: Record<string, FeatureFlag>) => void;
  patchFeatureFlag: (key: string, value: boolean) => void;
  setFeatureFlagsLoading: (loading: boolean) => void;
  setFeatureFlagsLoaded: (loaded: boolean) => void;
  setAnnouncements: (announcements: SystemAnnouncement[]) => void;
  applyAnnouncementToggle: (announcement: SystemAnnouncement) => void;
  prependAnnouncement: (announcement: SystemAnnouncement) => void;
  setAnnouncementsLoading: (loading: boolean) => void;
  setAnnouncementsLoaded: (loaded: boolean) => void;
  reset: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  users: [],
  meta: null,
  isLoading: false,
  isLoaded: false,
  featureFlags: {},
  featureFlagsLoading: false,
  featureFlagsLoaded: false,
  announcements: [],
  announcementsLoading: false,
  announcementsLoaded: false,

  setUsersPage: (users, meta) => set({ users, meta }),
  patchUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === user.id ? user : u)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setLoaded: (isLoaded) => set({ isLoaded }),
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
        if (announcement.isActive) return { ...item, isActive: false };
        return item;
      }),
    })),
  prependAnnouncement: (announcement) =>
    set((state) => ({ announcements: [announcement, ...state.announcements] })),
  setAnnouncementsLoading: (announcementsLoading) => set({ announcementsLoading }),
  setAnnouncementsLoaded: (announcementsLoaded) => set({ announcementsLoaded }),
  reset: () =>
    set({
      users: [],
      meta: null,
      isLoading: false,
      isLoaded: false,
      featureFlags: {},
      featureFlagsLoading: false,
      featureFlagsLoaded: false,
      announcements: [],
      announcementsLoading: false,
      announcementsLoaded: false,
    }),
}));
