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
        role: (u.role === 'admin' || u.role === 'member') ? u.role : 'member',
        permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
        household: u.household ? {
          id: u.household.id,
          name: u.household.name,
          invite_code: u.household.invite_code,
          categories: u.household.categories,
          users: u.household.users ? u.household.users.map((hu): UserProfile => ({
            id: hu.id,
            firstName: hu.first_name || hu.firstName || '',
            lastName: hu.last_name || hu.lastName || '',
            email: hu.email || '',
            role: (hu.role === 'admin' || hu.role === 'member') ? hu.role : 'member',
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
      set({ user: { ...currentUser, ...u } });
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
          role: (rawUser.role === 'admin' || rawUser.role === 'member') ? rawUser.role : 'member',
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
          role: (u.role === 'admin' || u.role === 'member') ? u.role : 'member',
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
