import { create } from 'zustand';
import { UserProfile, RawApiUser } from '@/types';
import { authClient, householdClient } from '@/api';
import { resetRouteDataCache } from '@/lib/loadRouteData';
import { useNotificationStore } from './useNotificationStore';
import { mapHouseholdFromApi } from '@/lib/mapHousehold';
import { mapUserFromApi } from '@/lib/mapUser';
import { unwrapApiData } from '@/lib/unwrapApiData';

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
    options?: { successMessage?: string; errorMessage?: string },
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
    budget_enabled?: boolean;
    savings_enabled?: boolean;
    debts_enabled?: boolean;
    utilities_enabled?: boolean;
    meters_enabled?: boolean;
    savings_settings?: import('@/lib/savingsSettings').SavingsSettings;
    debts_settings?: import('@/lib/debtsSettings').DebtsSettings;
    meters_settings?: import('@/lib/metersSettings').MetersSettings;
    onboarding_completed?: boolean;
    business_enabled?: boolean;
    business_name?: string;
    shopify_import_enabled?: boolean;
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
      const rawUser = unwrapApiData<RawApiUser>(res.data);
      const newMember = mapUserFromApi({
        ...rawUser,
        first_name: rawUser.first_name || data.first_name || data.firstName,
        last_name: rawUser.last_name || data.last_name || data.lastName,
        username: rawUser.username || data.username,
      });
      const currentUser = get().user;
      if (currentUser?.household) {
        const users = currentUser.household.users ?? [];
        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, users: [...users, newMember] },
          },
        });
      }
      addNotification('Új családtag sikeresen létrehozva!', 'success');
    } catch {
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
    const successMessage =
      options?.successMessage ??
      (data.role !== undefined ? 'Szerepkör mentve.' : 'Jogosultság mentve.');
    const errorMessage = options?.errorMessage ?? 'A mentés nem sikerült.';
    const previousUsers = get().user?.household?.users;
    try {
      await householdClient.updateMember(userId, data);
      addNotification(successMessage, 'success');
    } catch {
      const currentUser = get().user;
      if (currentUser?.household && previousUsers) {
        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, users: previousUsers },
          },
        });
      }
      await get().fetchMe();
      addNotification(errorMessage, 'error');
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
      resetRouteDataCache();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      set({ user: null });
    }
  },
}));
