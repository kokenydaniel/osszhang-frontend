import { create } from 'zustand';
import { UserProfile, RawApiUser } from '@/types';
import { authClient, householdClient } from '@/api';
import { useNotificationStore } from './useNotificationStore';

interface AuthState {
  user: UserProfile | null;
  isInitialized: boolean;
  invitations: { id: number; email: string; permissions: string[]; status: string }[];
  aiDashboardAdvice: string | null;
  lastAiFingerprint: string | null;
  
  fetchMe: () => Promise<UserProfile | null>;
  updateUser: (u: Partial<UserProfile>) => Promise<void>;
  updateHouseholdCode: (code: string) => Promise<void>;
  addMember: (data: Omit<UserProfile, 'id' | 'role' | 'permissions' | 'firstName' | 'lastName'> & { role?: string; permissions?: string[]; password?: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string }) => Promise<void>;
  updateMember: (userId: number, data: { role?: string; permissions?: string[] }) => Promise<void>;
  removeMember: (userId: number) => Promise<void>;
  addInvitation: (inv: Omit<{ id: number; email: string; permissions: string[]; status: string }, 'id'>) => Promise<void>;
  deleteInvitation: (id: number) => Promise<void>;
  setAiDashboardAdvice: (advice: string, fingerprint: string) => void;
  updateManualBalance: (balance: number) => Promise<void>;
  updateHouseholdSettings: (data: {
    name?: string;
    manual_balance?: number;
    business_enabled?: boolean;
    business_name?: string;
    shopify_shop_url?: string;
    shopify_access_token?: string;
    utility_split_enabled?: boolean;
    utility_split_partner_id?: number | null;
    utilitySplitPartnerId?: number | null;
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
      
      const mapUser = (u: RawApiUser): UserProfile => ({
        id: u.id,
        firstName: u.first_name || u.firstName || '',
        lastName: u.last_name || u.lastName || '',
        email: u.email || '',
        role: (u.role === 'admin' || u.role === 'editor' || u.role === 'reader') ? u.role : 'editor',
        permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
        household: u.household ? {
          id: u.household.id,
          name: u.household.name,
          invite_code: u.household.invite_code,
          categories: u.household.categories,
          manual_balance: u.household.manual_balance,
          manualBalance: u.household.manual_balance ?? u.household.manualBalance ?? 0,
          business_enabled: u.household.business_enabled,
          businessEnabled: u.household.business_enabled ?? u.household.businessEnabled ?? true,
          business_name: u.household.business_name,
          businessName: u.household.business_name ?? u.household.businessName ?? 'Little Loom',
          shopify_shop_url: u.household.shopify_shop_url,
          shopifyShopUrl: u.household.shopify_shop_url ?? u.household.shopifyShopUrl ?? '',
          shopify_access_token: u.household.shopify_access_token,
          shopifyAccessToken: u.household.shopify_access_token ?? u.household.shopifyAccessToken ?? '',
          utility_split_enabled: u.household.utility_split_enabled,
          utilitySplitEnabled: u.household.utility_split_enabled ?? u.household.utilitySplitEnabled ?? true,
          utility_split_partner_id: u.household.utility_split_partner_id,
          utilitySplitPartnerId: u.household.utility_split_partner_id ?? u.household.utilitySplitPartnerId ?? null,
          users: u.household.users ? u.household.users.map((hu): UserProfile => ({
            id: hu.id,
            firstName: hu.first_name || hu.firstName || '',
            lastName: hu.last_name || hu.lastName || '',
            email: hu.email || '',
            role: (hu.role === 'admin' || hu.role === 'editor' || hu.role === 'reader') ? hu.role : 'editor',
            permissions: hu.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
          })) : []
        } : undefined,
      });

      const mappedUser = mapUser(dbUser);

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
      if (u.email !== undefined) payload.email = u.email;
      if ((u as any).password !== undefined) {
        payload.password = (u as any).password;
        payload.password_confirmation = (u as any).password_confirmation;
      }

      const res = await authClient.updateProfile(payload);
      set({
        user: {
          ...currentUser,
          firstName: res.data.firstName || res.data.first_name || currentUser.firstName,
          lastName: res.data.lastName || res.data.last_name || currentUser.lastName,
          email: res.data.email || currentUser.email,
        }
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
        const newMember: UserProfile = {
          id: rawUser.id,
          firstName: rawUser.first_name || rawUser.firstName || '',
          lastName: rawUser.last_name || rawUser.lastName || '',
          email: rawUser.email || '',
          role: (rawUser.role === 'admin' || rawUser.role === 'editor' || rawUser.role === 'reader') ? rawUser.role : 'editor',
          permissions: rawUser.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
        };
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

  updateMember: async (userId, data) => {
    const { addNotification } = useNotificationStore.getState();
    try {
      const res = await householdClient.updateMember(userId, data);
      const currentUser = get().user;
      if (currentUser && currentUser.household?.users) {
        const mapUser = (u: RawApiUser): UserProfile => ({
          id: u.id,
          firstName: u.first_name || u.firstName || '',
          lastName: u.last_name || u.lastName || '',
          email: u.email || '',
          role: (u.role === 'admin' || u.role === 'editor' || u.role === 'reader') ? u.role : 'editor',
          permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
        });

        const updatedUsers = currentUser.household.users.map((u) =>
          u.id === userId ? mapUser(res.data as unknown as RawApiUser) : u
        );
        
        set({
          user: {
            ...currentUser,
            household: { ...currentUser.household, users: updatedUsers },
          },
        });
      }
      addNotification('Tag adatai frissítve!', 'success');
    } catch (e) {
      addNotification('Hiba történt a mentés során.', 'error');
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
      addNotification('Tag eltávolítva a háztartásból.', 'success');
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

  updateHouseholdSettings: async (data) => {
    try {
      await householdClient.update(data);
      const currentUser = get().user;
      if (currentUser && currentUser.household) {
        set({
          user: {
            ...currentUser,
            household: {
              ...currentUser.household,
              name: data.name ?? currentUser.household.name,
              manual_balance: data.manual_balance ?? currentUser.household.manual_balance,
              manualBalance: data.manual_balance ?? currentUser.household.manualBalance,
              business_enabled: data.business_enabled ?? currentUser.household.business_enabled,
              businessEnabled: data.business_enabled ?? currentUser.household.businessEnabled,
              business_name: data.business_name ?? currentUser.household.business_name,
              businessName: data.business_name ?? currentUser.household.businessName,
              shopify_shop_url: data.shopify_shop_url ?? currentUser.household.shopify_shop_url,
              shopifyShopUrl: data.shopify_shop_url ?? currentUser.household.shopifyShopUrl,
              shopify_access_token: data.shopify_access_token ?? currentUser.household.shopify_access_token,
              shopifyAccessToken: data.shopify_access_token ?? currentUser.household.shopifyAccessToken,
              utility_split_enabled: data.utility_split_enabled ?? currentUser.household.utility_split_enabled,
              utilitySplitEnabled: data.utility_split_enabled ?? currentUser.household.utilitySplitEnabled,
              utility_split_partner_id: data.utility_split_partner_id !== undefined ? data.utility_split_partner_id : currentUser.household.utility_split_partner_id,
              utilitySplitPartnerId: data.utility_split_partner_id !== undefined ? data.utility_split_partner_id : currentUser.household.utilitySplitPartnerId,
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to update household settings', e);
    }
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
