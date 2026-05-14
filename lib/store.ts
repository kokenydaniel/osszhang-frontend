import { create } from 'zustand';
import { 
  authApi, 
  budgetApi, 
  aiApi, 
  aiFinanceApi,
  utilitiesApi, 
  metersApi, 
  businessApi, 
  debtsApi, 
  savingsApi,
  householdApi
} from './api';
import apiClient from './api/apiClient';

export type PaymentStatus = 'Várható' | 'Teljesítve' | 'Késik';

export interface LedgerEntry {
  id: number;
  date: string;
  amount: number; 
  reason: string;
}

export interface CashTransaction {
  id: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;      
  dueDate: string;       
  paidDate: string | null; 
  isBudget?: boolean;      
  isReserve?: boolean;
  subItems?: LedgerEntry[]; 
}

export interface SavingsAccount {
  id: number;
  institution: string; 
  currency: string;
  owner: string;
  count_in_savings: boolean;
  ledger: LedgerEntry[];
}

export type UtilitySplitRule = 'shared' | 'dani-private' | 'ildi-private';

export interface UtilityBill {
  id: number;
  type: string; 
  total: number;
  dueDate: string;
  paidDate: string | null;
  paidBy: 'Mi' | 'Ildi' | null;
  splitRule: UtilitySplitRule;
}

export interface MeterReading {
  id: number;
  date: string; 
  month: number;
  year: number;
  value: number; 
  isReset: boolean; 
  consumption: number; 
  isEstimated?: boolean;
}

export interface Meter {
  id: number;
  name: string;
  icon: string;
  unit: string;
  location: string;
  readings: MeterReading[];
}

export interface BusinessOrder {
  id: number;
  date: string;
  customerName: string;
  channel: string;
  paymentMethod: string;
  provider: string;
  destination: string;
  amount: number;
  paidDate: string | null;
  hasInvoice?: boolean;
  invoiceId?: string;
  shopifyOrderId?: string;
  shopifyOrderNumber?: string;
  state: 'RENDBEN' | 'KINT' | 'KINT_PARKOL';
}

export interface Debt {
  id: number;
  name: string;
  targetAmount: number;
  paidAmount: number;
  annualInterestRate?: number | null;
  minimumPayment?: number | null;
  dueDay?: number | null;
  status: 'Még fizetendő' | 'Van még' | 'Maradt' | 'Lejárt';
}

export interface AiMeta {
  mode: string;
  provider: string;
  fallback_used: boolean;
  failure_reason?: string | null;
  generated_at: string;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'member';
  permissions?: string[];
  household?: {
    id: number;
    name: string;
    invite_code: string;
    users?: UserProfile[];
    categories?: string[];
  };
}

interface AppState {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;

  transactions: CashTransaction[];
  addTransaction: (tx: Omit<CashTransaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, tx: Partial<CashTransaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  addSubItem: (txId: number, item: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteSubItem: (txId: number, itemId: number) => Promise<void>;

  savings: SavingsAccount[];
  addSavingsAccount: (s: Omit<SavingsAccount, 'id' | 'ledger'>) => Promise<void>;
  updateSavingsAccount: (id: number, s: Partial<SavingsAccount>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;
  addLedgerEntry: (savingsId: number, entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteLedgerEntry: (savingsId: number, entryId: number) => Promise<void>;

  bills: UtilityBill[];
  addBill: (b: Omit<UtilityBill, 'id'>) => Promise<void>;
  updateBill: (id: number, b: Partial<UtilityBill>) => Promise<void>;
  deleteBill: (id: number) => Promise<void>;

  meters: Meter[];
  addMeter: (m: Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>) => Promise<void>;
  deleteMeter: (id: number) => Promise<void>;
  addMeterReading: (meterId: number, reading: Omit<MeterReading, 'id' | 'consumption'>) => Promise<void>;
  updateMeterReading: (meterId: number, readingId: number, reading: Partial<MeterReading>) => Promise<void>;
  deleteMeterReading: (meterId: number, readingId: number) => Promise<void>;

  orders: BusinessOrder[];
  addOrder: (o: Omit<BusinessOrder, 'id'>) => Promise<void>;
  updateOrder: (id: number, o: Partial<BusinessOrder>) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  shopifyImport: () => Promise<void>;

  debts: Debt[];
  addDebt: (d: Omit<Debt, 'id'>) => Promise<void>;
  updateDebt: (id: number, d: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;

  categories: string[];
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;

  userPreferences: {
    currency: string;
    notificationsEnabled: boolean;
  };
  updatePreferences: (p: Partial<AppState['userPreferences']>) => Promise<void>;

  invitations: { id: number, email: string, permissions: string[], status: string }[];
  addInvitation: (inv: Omit<{ id: number, email: string, permissions: string[], status: string }, 'id'>) => Promise<void>;
  deleteInvitation: (id: number) => Promise<void>;

  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => Promise<void>;
  updateHouseholdCode: (code: string) => Promise<void>;
  addMember: (data: any) => Promise<void>;
  updateMember: (userId: number, data: { role?: string, permissions?: string[] }) => Promise<void>;
  removeMember: (userId: number) => Promise<void>;

  aiDashboardAdvice: string | null;
  lastAiFingerprint: string | null;
  setAiDashboardAdvice: (advice: string, fingerprint: string) => void;

  notifications: Notification[];
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: number) => void;

  exchangeRates: Record<string, number>;
  refreshRates: () => Promise<void>;
  clonePreviousMonth: (targetMonth: number, targetYear: number) => Promise<void>;

  aiOverspend: any | null;
  aiCashflowForecast: any | null;
  aiUtilityAnomalies: any | null;
  aiSavingsPlan: any | null;
  aiDebtPlan: any | null;
  aiWeeklyBriefing: any | null;
  aiMeta: Record<string, AiMeta | null>;
  fetchAiOverspend: (year: number, month: number) => Promise<void>;
  fetchAiCashflowForecast: (year: number, month: number) => Promise<void>;
  fetchAiUtilityAnomalies: (year: number, month: number) => Promise<void>;
  fetchAiSavingsPlan: (payload: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
  }) => Promise<void>;
  fetchAiDebtPlan: (strategy?: 'avalanche' | 'snowball') => Promise<void>;
  fetchAiWeeklyBriefing: (weekStart?: string) => Promise<void>;

  isInitialized: boolean;
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  isInitialized: false,
  setSelectedMonth: (m) => set({ selectedMonth: m }),
  setSelectedYear: (y) => set({ selectedYear: y }),

  transactions: [],
  savings: [],
  bills: [],
  meters: [],
  orders: [],
  debts: [],
  categories: [],
  userPreferences: { currency: 'HUF', notificationsEnabled: true },
  invitations: [],
  user: { id: 0, firstName: '', lastName: '', email: '', role: 'member' },
  aiDashboardAdvice: null,
  lastAiFingerprint: null,
  notifications: [],
  exchangeRates: {},
  aiOverspend: null,
  aiCashflowForecast: null,
  aiUtilityAnomalies: null,
  aiSavingsPlan: null,
  aiDebtPlan: null,
  aiWeeklyBriefing: null,
  aiMeta: {},

  addTransaction: async (tx) => {
    const res = await budgetApi.create(tx);
    set({ transactions: [...get().transactions, res.data] });
  },
  updateTransaction: async (id, tx) => {
    const res = await budgetApi.update(id, tx);
    set({ transactions: get().transactions.map(t => t.id === id ? res.data : t) });
  },
  deleteTransaction: async (id) => {
    await budgetApi.delete(id);
    set({ transactions: get().transactions.filter(t => t.id !== id) });
  },
  addSubItem: async (txId, item) => {
    const res = await budgetApi.create({...item, transaction_id: txId});
    const updated = get().transactions.map(t => t.id === txId ? { ...t, subItems: [...(t.subItems || []), res.data] } : t);
    set({ transactions: updated });
  },
  deleteSubItem: async (txId, itemId) => {
     const updated = get().transactions.map(t => t.id === txId ? { ...t, subItems: (t.subItems || []).filter(i => i.id !== itemId) } : t);
     set({ transactions: updated });
  },

  addSavingsAccount: async (s) => {
    const res = await savingsApi.create(s);
    set({ savings: [...get().savings, res.data] });
  },
  updateSavingsAccount: async (id, s) => {
    const res = await savingsApi.update(id, s);
    set({ savings: get().savings.map(acc => acc.id === id ? res.data : acc) });
  },
  deleteSavingsAccount: async (id) => {
    await savingsApi.delete(id);
    set({ savings: get().savings.filter(s => s.id !== id) });
  },
  addLedgerEntry: async (savingsId, entry) => {
    const res = await savingsApi.addEntry(savingsId, entry);
    set({ savings: get().savings.map(s => s.id === savingsId ? { ...s, ledger: [...(s.ledger || []), res.data] } : s) });
  },
  deleteLedgerEntry: async (savingsId, entryId) => {
    await savingsApi.deleteEntry(savingsId, entryId);
    set({ savings: get().savings.map(s => s.id === savingsId ? { ...s, ledger: (s.ledger || []).filter(e => e.id !== entryId) } : s) });
  },

  addBill: async (b) => {
    const res = await utilitiesApi.create(b);
    set({ bills: [...get().bills, res.data] });
  },
  updateBill: async (id, b) => {
    const res = await utilitiesApi.update(id, b);
    set({ bills: get().bills.map(bill => bill.id === id ? res.data : bill) });
  },
  deleteBill: async (id) => {
    await utilitiesApi.delete(id);
    set({ bills: get().bills.filter(b => b.id !== id) });
  },

  addMeter: async (m) => {
    const res = await metersApi.create(m);
    set({ meters: [...get().meters, res.data] });
  },
  deleteMeter: async (id) => {
    await metersApi.delete(id);
    set({ meters: get().meters.filter(m => m.id !== id) });
  },
  addMeterReading: async (meterId, reading) => {
    const res = await metersApi.addReading(meterId, reading);
    set({ meters: get().meters.map(m => m.id === meterId ? { ...m, readings: [...(m.readings || []), res.data] } : m) });
  },
  updateMeterReading: async (meterId, readingId, reading) => {
     // Implement
  },
  deleteMeterReading: async (meterId, readingId) => {
    await metersApi.deleteReading(meterId, readingId);
    set({ meters: get().meters.map(m => m.id === meterId ? { ...m, readings: (m.readings || []).filter(r => r.id !== readingId) } : m) });
  },

  addOrder: async (o) => {
    const res = await businessApi.create(o);
    set({ orders: [...get().orders, res.data] });
  },
  updateOrder: async (id, o) => {
    const res = await businessApi.update(id, o);
    set({ orders: get().orders.map(order => order.id === id ? res.data : order) });
  },
  deleteOrder: async (id) => {
    await businessApi.delete(id);
    set({ orders: get().orders.filter(o => o.id !== id) });
  },
  shopifyImport: async () => {
    await businessApi.shopifyImport();
    const res = await businessApi.getAll();
    set({ orders: res.data });
  },

  addDebt: async (d) => {
    const res = await debtsApi.create(d);
    set({ debts: [...get().debts, res.data] });
  },
  updateDebt: async (id, d) => {
    const res = await debtsApi.update(id, d);
    set({ debts: get().debts.map(debt => debt.id === id ? res.data : debt) });
  },
  deleteDebt: async (id) => {
    await debtsApi.delete(id);
    set({ debts: get().debts.filter(d => d.id !== id) });
  },

  addCategory: async (name) => {
    const updated = [...get().categories, name];
    await householdApi.updateCategories(updated);
    set({ categories: updated });
  },
  deleteCategory: async (name) => {
    const updated = get().categories.filter(c => c !== name);
    await householdApi.updateCategories(updated);
    set({ categories: updated });
  },

  updatePreferences: async (p) => {
    set({ userPreferences: { ...get().userPreferences, ...p } });
  },

  addInvitation: async (inv) => {
    set({ invitations: [...get().invitations, { ...inv, id: Date.now() }] });
  },
  deleteInvitation: async (id) => {
    set({ invitations: get().invitations.filter(i => i.id !== id) });
  },

  updateUser: async (u) => {
     set({ user: { ...get().user, ...u } as any });
  },

  updateHouseholdCode: async (code) => {
    try {
      await householdApi.updateCode(code);
      const user = get().user;
      if (user.household) {
        set({ user: { ...user, household: { ...user.household, invite_code: code } } });
      }
      get().addNotification('Meghívó kód sikeresen módosítva!', 'success');
    } catch (e) {
      get().addNotification('Hiba történt a kód módosítása során.', 'error');
    }
  },

  addMember: async (data: any) => {
    try {
      const res = await householdApi.createMember(data);
      const user = get().user;
      if (user.household?.users) {
        const newMember: UserProfile = {
          ...res.data,
          firstName: res.data.first_name,
          lastName: res.data.last_name,
          permissions: res.data.permissions // Ensure permissions are preserved
        };
        const updatedUsers = [...user.household.users, newMember];
        set({ user: { ...user, household: { ...user.household, users: updatedUsers } } });
      }
      get().addNotification('Új családtag sikeresen regisztrálva!', 'success');
    } catch (e) {
      get().addNotification('Hiba történt a regisztráció során.', 'error');
    }
  },

  updateMember: async (userId, data) => {
    try {
      const res = await householdApi.updateMember(userId, data);
      const user = get().user;
      if (user.household?.users) {
        // Reuse the mapUser logic for consistency
        const mapUser = (u: any): UserProfile => ({
          ...u,
          firstName: u.first_name || u.firstName,
          lastName: u.last_name || u.lastName,
          permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings']
        });

        const updatedUsers = user.household.users.map(u => 
          u.id === userId ? mapUser(res.data) : u
        );
        
        set({ user: { ...user, household: { ...user.household, users: updatedUsers } } });
      }
      get().addNotification('Tag adatai frissítve!', 'success');
    } catch (e) {
      get().addNotification('Hiba történt a mentés során.', 'error');
    }
  },

  removeMember: async (userId) => {
    try {
      await householdApi.deleteMember(userId);
      const user = get().user;
      if (user.household?.users) {
        const updatedUsers = user.household.users.filter(u => u.id !== userId);
        set({ user: { ...user, household: { ...user.household, users: updatedUsers } } });
      }
      get().addNotification('Tag eltávolítva a háztartásból.', 'success');
    } catch (e) {
      get().addNotification('Hiba történt az eltávolítás során.', 'error');
    }
  },

  setAiDashboardAdvice: (advice, fingerprint) => set({ aiDashboardAdvice: advice, lastAiFingerprint: fingerprint }),

  addNotification: (message, type = 'info') => {
    const id = Date.now();
    set({ notifications: [...get().notifications, { id, message, type }] });
    setTimeout(() => get().removeNotification(id), 5000);
  },
  removeNotification: (id) => set({ notifications: get().notifications.filter(n => n.id !== id) }),

  refreshRates: async () => {
     // Implement
  },

  clonePreviousMonth: async (m, y) => {
    await budgetApi.create({ type: 'clone', month: m, year: y });
    const res = await budgetApi.getAll();
    set({ transactions: res.data });
  },

  fetchAiOverspend: async (y, m) => {
    const res = await aiFinanceApi.getOverspendRootCause(y, m);
    set({ aiOverspend: res.data });
  },
  fetchAiCashflowForecast: async (y, m) => {
    const res = await aiFinanceApi.getCashflowForecast(y, m);
    set({ aiCashflowForecast: res.data });
  },
  fetchAiUtilityAnomalies: async (y, m) => {
    const res = await aiFinanceApi.getUtilitiesAnomalies(y, m);
    set({ aiUtilityAnomalies: res.data });
  },
  fetchAiSavingsPlan: async (payload) => {
    const res = await aiFinanceApi.getSavingsRecommendations(payload);
    set({ aiSavingsPlan: res.data });
  },
  fetchAiDebtPlan: async (strategy) => {
    const res = await aiFinanceApi.optimizeDebts({ strategy });
    set({ aiDebtPlan: res.data });
  },
  fetchAiWeeklyBriefing: async (weekStart) => {
    const res = await aiFinanceApi.getWeeklyBriefing(weekStart);
    set({ aiWeeklyBriefing: res.data });
  },

  initialize: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      set({ isInitialized: true });
      return;
    }

    try {
      const [userRes, budgetRes, utilsRes, metersRes, businessRes, debtsRes, savingsRes] = await Promise.all([
        authApi.me(),
        budgetApi.getAll(),
        utilitiesApi.getAll(),
        metersApi.getAll(),
        businessApi.getAll(),
        debtsApi.getAll(),
        savingsApi.getAll()
      ]);

      const dbUser = userRes.data;
      
      const mapUser = (u: any): UserProfile => ({
        ...u,
        firstName: u.first_name || u.firstName,
        lastName: u.last_name || u.lastName,
        permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings']
      });

      const mappedUser = mapUser(dbUser);
      if (mappedUser.household?.users) {
        mappedUser.household.users = mappedUser.household.users.map(mapUser);
      }

      const defaultCats = ['Fizetés', 'Kaja', 'Tankolás', 'Rezsi', 'Kevin', 'Hitel', 'Autó', 'Streaming, Subscriptions', 'Little Loom'];
      const householdCats = mappedUser.household?.categories || defaultCats;

      set({ 
        user: mappedUser,
        transactions: budgetRes.data,
        bills: utilsRes.data,
        meters: metersRes.data,
        orders: businessRes.data,
        debts: debtsRes.data,
        savings: savingsRes.data,
        categories: householdCats,
        isInitialized: true 
      });
    } catch (e) {
      console.error("Initialization failed", e);
      set({ isInitialized: true });
    }
  }
}));
