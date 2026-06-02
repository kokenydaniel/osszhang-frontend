import { create } from 'zustand';
import { StatusCodes } from '@/types/api';
import { UserProfile, RawApiUser, type HouseholdProfile } from '@/types';
import { authClient, getApiErrorMessage, householdClient, walletClient, ApiClientError } from '@/lib/api-client';
import { isTimeoutError } from '@/lib/api-client/abortError';
import { isMaintenanceBlockedForUser } from '@/config/platform-feature-flags';
import { isMaintenanceModeResponse, redirectToMaintenanceIfNeeded } from '@/lib/api-client/response';
import { getAuthToken, removeAuthToken, setAuthToken as persistAuthToken } from '@/helpers/auth-token';
import { LoadableStatus } from '@/utils/loadable-status';
import { resetSessionData } from '@/helpers/reset-session-data';
import { syncBudgetCategories } from '@/helpers/session-bootstrap';
import { useNotificationStore } from './useNotificationStore';
import { unwrapApiData } from '@/utils/unwrap-api-data';

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
  patchHousehold: (household: Partial<HouseholdProfile>) => void;
  setAiDashboardAdvice: (advice: string, fingerprint: string) => void;
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

    const hadUser = !!get().user;
    if (!hadUser) {
      set({ status: LoadableStatus.Loading });
    }

    const token = get().authToken ?? getAuthToken();
    if (!token) {
      set({ user: null, status: LoadableStatus.Loaded });
      return null;
    }

    fetchUserPromise = authClient
      .me()
      .then((res) => {
        if (res && isMaintenanceModeResponse(res[0], res[1])) {
          set({ status: LoadableStatus.Loaded });
          redirectToMaintenanceIfNeeded(res[0], res[1]);
          return get().user;
        }
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        const user = res[1] as UserProfile;
        set({ user, authToken: token, status: LoadableStatus.Loaded });
        useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
        return user;
      })
      .catch((error: unknown) => {
        if (error instanceof ApiClientError && isMaintenanceModeResponse(error.status as number, error.data)) {
          set({ status: LoadableStatus.Loaded });
          redirectToMaintenanceIfNeeded(error.status as number, error.data);
          return get().user;
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
    if (isMaintenanceBlockedForUser(get().user)) return;

    const token = get().authToken ?? getAuthToken();
    if (!token) return;

    try {
      const res = await authClient.me();
      if (res && isMaintenanceModeResponse(res[0], res[1])) {
        redirectToMaintenanceIfNeeded(res[0], res[1]);
        return;
      }
      if (!res || res[0] !== StatusCodes.Http200) return;
      const user = res[1] as UserProfile;
      const prev = get().user;

      const announcementId = user.system_announcement?.id ?? null;
      const prevAnnouncementId = prev?.system_announcement?.id ?? null;
      const flagsChanged =
        JSON.stringify(user.platform_feature_flags ?? null) !==
        JSON.stringify(prev?.platform_feature_flags ?? null);
      const walletsChanged =
        JSON.stringify(user.wallets?.map((w) => w.id) ?? []) !==
        JSON.stringify(prev?.wallets?.map((w) => w.id) ?? []);

      if (
        prev &&
        prev.id === user.id &&
        announcementId === prevAnnouncementId &&
        !flagsChanged &&
        !walletsChanged
      ) {
        return;
      }

      set({ user });
      useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && isMaintenanceModeResponse(error.status as number, error.data)) {
        redirectToMaintenanceIfNeeded(error.status as number, error.data);
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
    resetSessionData();
    set({
      loginStatus: LoadableStatus.Loading,
      user: null,
      authToken: null,
      status: LoadableStatus.Loading,
    });

    try {
      const res = await authClient.login(credentials);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        throw new Error('API Error');
      }
      const token = res[1].access_token;
      get().setAuthToken(token);
      const user = res[1].user as UserProfile;
      set({ user, loginStatus: LoadableStatus.Loaded, status: LoadableStatus.Loaded });
      if (!isMaintenanceBlockedForUser(user)) {
        syncBudgetCategories(user);
        useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
      }
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
    resetSessionData();
    set({
      loginStatus: LoadableStatus.Loading,
      user: null,
      authToken: null,
      status: LoadableStatus.Loading,
    });

    try {
      const res = await authClient.register(data);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        throw new Error('API Error');
      }
      const token = res[1].access_token;
      get().setAuthToken(token);
      const user = res[1].user as UserProfile;
      set({ user, loginStatus: LoadableStatus.Loaded, status: LoadableStatus.Loaded });
      if (!isMaintenanceBlockedForUser(user)) {
        syncBudgetCategories(user);
        useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
      }
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

  patchHousehold: (household) => {
    const user = get().user;
    if (!user?.household) return;
    set({
      user: {
        ...user,
        household: { ...user.household, ...household },
      },
    });
  },

  updateUser: async (u) => {
    const currentUser = get().user;
    if (currentUser) {
      const payload: Record<string, string | undefined> = {};
      if (u.first_name !== undefined) payload.first_name = u.first_name;
      if (u.last_name !== undefined) payload.last_name = u.last_name;
      const pw = u as { password?: string; password_confirmation?: string };
      if (pw.password !== undefined) {
        payload.password = pw.password;
        payload.password_confirmation = pw.password_confirmation;
      }

      const res = await authClient.updateProfile(payload);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      const profile = res[1] as UserProfile;
      set({
        user: {
          ...currentUser,
          first_name: profile.first_name ?? currentUser.first_name,
          last_name: profile.last_name ?? currentUser.last_name,
          must_change_password:
            profile.must_change_password !== undefined
              ? Boolean(profile.must_change_password)
              : pw.password !== undefined
                ? false
                : currentUser.must_change_password,
        },
      });
    }
  },

  setAiDashboardAdvice: (advice, fingerprint) =>
    set({ aiDashboardAdvice: advice, lastAiFingerprint: fingerprint }),

  logout: async () => {
    fetchUserPromise = null;
    try {
      await authClient.logout();
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      removeAuthToken();
      resetSessionData();
      set({
        user: null,
        authToken: null,
        status: LoadableStatus.Loaded,
        loginStatus: LoadableStatus.Unloaded,
        aiDashboardAdvice: null,
        lastAiFingerprint: null,
      });
    }
  },
}));
