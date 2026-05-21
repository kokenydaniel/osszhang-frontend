import { create } from 'zustand';
import { UserProfile, RawApiUser } from '@/types';
import { authClient, householdClient } from '@/api';
import { useNotificationStore } from './useNotificationStore';
import { mapHouseholdFromApi } from '@/lib/mapHousehold';
import { mapUserFromApi } from '@/lib/mapUser';

interface AuthState {
  user: UserProfile | null;
  isInitialized: boolean;
  invitations: { id: number; email: string; permissions: string[]; status: string }[];
  aiDashboardAdvice: string | null;
  lastAiFingerprint: string | null;
  
  fetchMe: () => Promise<UserProfile | null>;
  updateUser: (u: Partial<UserProfile>) => Promise<void>;
  updateHouseholdCode: (code: string) => Promise<void>;
  addMember: (data: {
    username: string;
    password: string;
    role?: string;
    permissions?: string[];
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  patchMemberLocally: (userId: number, data: { role?: string; permissions?: string[] }) => void;
  updateMember: (
    userId: number,
    data: { role?: string; permissions?: string[] },
    options?: { silent?: boolean },
  ) => Promise<void>;
  removeMember: (userId: number) => Promise<void>;
  addInvitation: (inv: Omit<{ id: number; email: string; permissions: string[]; status: string }, 'id'>) => Promise<void>;
  deleteInvitation: (id: number) => Promise<void>;
  setAiDashboardAdvice: (advice: string, fingerprint: string) => void;
  updateManualBalance: (balance: number) => Promise<void>;
  deleteHousehold: (confirmName: string) => Promise<void>;
  updateHouseholdSettings: (data: {
    name?: string;
    manual_balance?: number;
    business_enabled?: boolean;
    business_name?: string;
    shopify_shop_url?: string;
    shopify_access_token?: string;
    has_shopify_token?: boolean;
    utility_split_enabled?: boolean;
    utility_split_partner_id?: number | null;
    utilitySplitPartnerId?: number | null;
    business_settings?: import('@/lib/businessSettings').BusinessSettings;
    utility_templates?: import('@/lib/utilityTemplates').UtilityTemplate[];
  }) => Promise<void>;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitialized: false,
  invitations: [],
  aiDashboardAdvice: null,
  lastAiFingerprint: null,

  fetchMe: async () => {
    try {
      const res = await authClient.me();
      const dbUser = res.data;
      
      const mappedUser = mapUserFromApi(dbUser);

      set({ user: mappedUser });
      return mappedUser;
    } catch (e) {
      console.error('Failed to fetch profile', e);
      return null;
    }
  },

  updateUser: async (u) => {
    const currentUser = get().user;
    if (currentUser) {
      const payload: any = {};
      if (u.firstName !== undefined) payload.firstName = u.firstName;
      if (u.lastName !== undefined) payload.lastName = u.lastName;
      const pw = u as { password?: string; password_confirmation?: string };
      if (pw.password !== undefined) {
        payload.password = pw.password;
        payload.password_confirmation = pw.password_confirmation;
      }

      const res = await authClient.updateProfile(payload);
      set({
        user: {
          ...currentUser,
          firstName: res.data.firstName || res.data.first_name || currentUser.firstName,
          lastName: res.data.lastName || res.data.last_name || currentUser.lastName,
          mustChangePassword:
            res.data.must_change_password !== undefined
              ? Boolean(res.data.must_change_password)
              : pw.password !== undefined
                ? false
                : currentUser.mustChangePassword,
        },
      });
    }
  },

  updateHouseholdCode: async (code) => {
    const { addNotification } = useNotificationStore.getState();
    try {
      await householdClient.updateCode(code);
      const currentUser = get().user;
      if (currentUser && currentUser.household) {
        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, invite_code: code },
          },
        });
      }
      addNotification('Meghívó kód sikeresen módosítva!', 'success');
    } catch (e) {
      addNotification('Hiba történt a kód módosítása során.', 'error');
    }
  },

  addMember: async (data) => {
    const { addNotification } = useNotificationStore.getState();
    try {
      const res = await householdClient.createMember(data);
      const rawUser = res.data as unknown as RawApiUser;
      const currentUser = get().user;
      if (currentUser && currentUser.household?.users) {
        const newMember = mapUserFromApi(rawUser);
        const updatedUsers = [...currentUser.household.users, newMember];
        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, users: updatedUsers },
          },
        });
      }
      addNotification('Új családtag sikeresen regisztrálva!', 'success');
    } catch (e) {
      addNotification('Hiba történt a regisztráció során.', 'error');
    }
  },

  patchMemberLocally: (userId, data) => {
    const currentUser = get().user;
    if (!currentUser?.household?.users) return;
    set({
      user: {
        ...currentUser,
        household: {
          ...currentUser.household,
          users: currentUser.household.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  ...(data.role !== undefined ? { role: data.role as UserProfile['role'] } : {}),
                  ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
                }
              : u,
          ),
        },
      },
    });
  },

  updateMember: async (userId, data, options) => {
    const { addNotification } = useNotificationStore.getState();
    const silent = options?.silent ?? false;
    try {
      const res = await householdClient.updateMember(userId, data);
      const currentUser = get().user;
      if (currentUser && currentUser.household?.users) {
        const updatedUsers = currentUser.household.users.map((u) =>
          u.id === userId ? mapUserFromApi(res.data as unknown as RawApiUser) : u,
        );

        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, users: updatedUsers },
          },
        });
      }
      if (!silent) addNotification('Tag adatai frissítve!', 'success');
    } catch {
      await get().fetchMe();
      if (!silent) addNotification('Hiba történt a mentés során.', 'error');
    }
  },

  removeMember: async (userId) => {
    const { addNotification } = useNotificationStore.getState();
    try {
      await householdClient.deleteMember(userId);
      const currentUser = get().user;
      if (currentUser && currentUser.household?.users) {
        const updatedUsers = currentUser.household.users.filter((u) => u.id !== userId);
        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, users: updatedUsers },
          },
        });
      }
      addNotification('Tag fiókja törölve.', 'success');
    } catch (e) {
      addNotification('Hiba történt az eltávolítás során.', 'error');
    }
  },

  addInvitation: async (inv) => {
    set({ invitations: [...get().invitations, { ...inv, id: Date.now() }] });
  },

  deleteInvitation: async (id) => {
    set({ invitations: get().invitations.filter((i) => i.id !== id) });
  },

  setAiDashboardAdvice: (advice, fingerprint) =>
    set({ aiDashboardAdvice: advice, lastAiFingerprint: fingerprint }),

  updateManualBalance: async (balance) => {
    await get().updateHouseholdSettings({ manual_balance: balance });
  },

  deleteHousehold: async (confirmName) => {
    await householdClient.destroy(confirmName);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    set({ user: null });
  },

  updateHouseholdSettings: async (data) => {
    await householdClient.update(data);
    await get().fetchMe();
  },

  initializeAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
      set({ isInitialized: true });
      return;
    }
    
    await get().fetchMe();
    set({ isInitialized: true });
  },

  logout: async () => {
    try {
      await authClient.logout();
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      set({ user: null });
    }
  },
}));
