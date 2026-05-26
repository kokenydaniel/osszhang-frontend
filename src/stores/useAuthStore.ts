import { create } from 'zustand';
import { UserProfile, RawApiUser } from '@/types';
import { authClient, getApiErrorMessage, householdClient, walletClient, ApiClientError } from '@/lib/api-client';
import { isTimeoutError } from '@/lib/api-client/abortError';
import { isMaintenanceModeResponse } from '@/lib/api-client/response';
import { getAuthToken, removeAuthToken, setAuthToken as persistAuthToken } from '@/lib/authToken';
import { LoadableStatus } from '@/lib/loadableStatus';
import { resetRouteDataCache } from '@/lib/loadRouteData';
import { syncBudgetCategories } from '@/lib/sessionBootstrap';
import { useNotificationStore } from './useNotificationStore';
import { mapUserFromApi } from '@/lib/mapUser';
import { mapWalletFromApi } from '@/lib/mapWallet';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { useWalletStore } from './useWalletStore';

let fetchUserPromise: Promise<UserProfile | null> | null = null;

interface AuthState {
  status: LoadableStatus;
  loginStatus: LoadableStatus;
  authToken: string | null;
  user: UserProfile | null;
  invitations: { id: number; email: string; permissions: string[]; status: string }[];
  aiDashboardAdvice: string | null;
  lastAiFingerprint: string | null;

  setAuthToken: (token: string | null) => void;
  setStatus: (status: LoadableStatus) => void;
  fetchMe: () => Promise<UserProfile | null> | null;
  refreshSessionQuiet: () => Promise<void>;
  login: (credentials: { username: string; password?: string }) => Promise<UserProfile | null>;
  register: (data: {
    username: string;
    password?: string;
    password_confirmation?: string;
    first_name?: string;
    last_name?: string;
    household_name?: string;
  }) => Promise<UserProfile | null>;
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
  updateWalletManualBalance: (walletId: number, balance: number) => Promise<void>;
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
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: LoadableStatus.Unloaded,
  loginStatus: LoadableStatus.Unloaded,
  authToken: null,
  user: null,
  invitations: [],
  aiDashboardAdvice: null,
  lastAiFingerprint: null,

  setAuthToken: (token) => {
    if (token) {
      persistAuthToken(token);
    } else {
      removeAuthToken();
    }
    set({ authToken: token });
  },

  setStatus: (status) => set({ status }),

  fetchMe: () => {
    if (fetchUserPromise) {
      return fetchUserPromise;
    }

    set({ status: LoadableStatus.Loading });

    const token = get().authToken ?? getAuthToken();
    if (!token) {
      set({ user: null, status: LoadableStatus.Loaded });
      return null;
    }

    fetchUserPromise = authClient
      .me()
      .then((res) => {
        const mappedUser = mapUserFromApi(res.data);
        set({ user: mappedUser, authToken: token, status: LoadableStatus.Loaded });
        useWalletStore.getState().syncFromUser(mappedUser.wallets, mappedUser.household?.id);
        return mappedUser;
      })
      .catch((error) => {
        if (error instanceof ApiClientError && isMaintenanceModeResponse(error.status, error.data)) {
          set({ status: LoadableStatus.Loaded });
          return null;
        }
        removeAuthToken();
        set({ user: null, authToken: null, status: LoadableStatus.Error });
        return null;
      })
      .finally(() => {
        fetchUserPromise = null;
      });

    return fetchUserPromise;
  },

  refreshSessionQuiet: async () => {
    const token = get().authToken ?? getAuthToken();
    if (!token) return;

    try {
      const res = await authClient.me();
      const mappedUser = mapUserFromApi(res.data);
      const prev = get().user;

      const announcementId = mappedUser.systemAnnouncement?.id ?? null;
      const prevAnnouncementId = prev?.systemAnnouncement?.id ?? null;
      const flagsChanged =
        JSON.stringify(mappedUser.platformFeatureFlags ?? null) !==
        JSON.stringify(prev?.platformFeatureFlags ?? null);
      const walletsChanged =
        JSON.stringify(mappedUser.wallets?.map((w) => w.id) ?? []) !==
        JSON.stringify(prev?.wallets?.map((w) => w.id) ?? []);

      if (
        prev &&
        prev.id === mappedUser.id &&
        announcementId === prevAnnouncementId &&
        !flagsChanged &&
        !walletsChanged
      ) {
        return;
      }

      set({ user: mappedUser });
      useWalletStore.getState().syncFromUser(mappedUser.wallets, mappedUser.household?.id);
    } catch (error) {
      if (error instanceof ApiClientError && isMaintenanceModeResponse(error.status, error.data)) {
        return;
      }
      if (isTimeoutError(error)) {
        return;
      }
      console.error('[useAuthStore] refreshSessionQuiet failed', error);
    }
  },

  login: async (credentials) => {
    fetchUserPromise = null;
    set({
      loginStatus: LoadableStatus.Loading,
      user: null,
      authToken: null,
      status: LoadableStatus.Loading,
    });

    try {
      const res = await authClient.login(credentials);
      const token = res.data.access_token;
      get().setAuthToken(token);
      const user = mapUserFromApi(res.data.user);
      set({ user, loginStatus: LoadableStatus.Loaded, status: LoadableStatus.Loaded });
      syncBudgetCategories(user);
      useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
      return user;
    } catch (e) {
      console.error('Login failed', e);
      removeAuthToken();
      set({
        loginStatus: LoadableStatus.Error,
        user: null,
        authToken: null,
        status: LoadableStatus.Loaded,
      });
      throw e;
    }
  },

  register: async (data) => {
    fetchUserPromise = null;
    removeAuthToken();
    set({
      loginStatus: LoadableStatus.Loading,
      user: null,
      authToken: null,
      status: LoadableStatus.Loading,
    });

    try {
      const res = await authClient.register(data);
      const token = res.data.access_token;
      get().setAuthToken(token);
      const user = mapUserFromApi(res.data.user);
      set({ user, loginStatus: LoadableStatus.Loaded, status: LoadableStatus.Loaded });
      syncBudgetCategories(user);
      useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
      return user;
    } catch (e) {
      removeAuthToken();
      set({
        loginStatus: LoadableStatus.Error,
        user: null,
        authToken: null,
        status: LoadableStatus.Loaded,
      });
      throw getApiErrorMessage(e, 'Hiba történt a regisztráció során.');
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

  updateWalletManualBalance: async (walletId, balance) => {
    const res = await walletClient.updateManualBalance(walletId, balance);
    const updated = mapWalletFromApi(res.data);
    const currentUser = get().user;
    if (!currentUser?.wallets?.length) return;

    set({
      user: {
        ...currentUser,
        wallets: currentUser.wallets.map((w) => (w.id === walletId ? updated : w)),
      },
    });
  },

  deleteHousehold: async (confirmName) => {
    await householdClient.destroy(confirmName);
    fetchUserPromise = null;
    removeAuthToken();
    resetRouteDataCache();
    set({ user: null, authToken: null, status: LoadableStatus.Loaded });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  updateHouseholdSettings: async (data) => {
    await householdClient.update(data);
    await get().fetchMe();
  },

  logout: async () => {
    fetchUserPromise = null;
    try {
      await authClient.logout();
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      removeAuthToken();
      resetRouteDataCache();
      set({
        user: null,
        authToken: null,
        status: LoadableStatus.Loaded,
        loginStatus: LoadableStatus.Unloaded,
      });
    }
  },
}));
