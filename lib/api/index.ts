import apiClient from './apiClient';

/**
 * AUTHENTICATION MODULE
 */
export const authApi = {
  login: (credentials: any) => apiClient.post('/login', credentials),
  register: (data: any) => apiClient.post('/register', data),
  logout: () => apiClient.post('/logout'),
  me: () => apiClient.get('/me'),
};

/**
 * HOUSEHOLD MANAGEMENT
 */
export const householdApi = {
  get: () => apiClient.get('/household'),
  updateCategories: (categories: string[]) => apiClient.put('/household/categories', { categories }),
  updateCode: (code: string) => apiClient.put('/household/code', { invite_code: code }),
  createMember: (data: any) => apiClient.post('/household/members', data),
  updateMember: (userId: number, data: { role?: string, permissions?: string[] }) => 
    apiClient.put(`/household/members/${userId}`, data),
  deleteMember: (userId: number) => apiClient.delete(`/household/members/${userId}`),
};

/**
 * AI MODULE
 */
export const aiApi = {
  query: (prompt: string, includeContext = true) => 
    apiClient.post('/ai/query', { prompt, include_context: includeContext }),
};

export const aiFinanceApi = {
  autoCategorizeTransaction: (data: {
    description: string;
    type?: 'income' | 'expense';
    amount?: number;
    candidate_categories: string[];
  }) => apiClient.post('/ai/v1/transactions/auto-categorize', data),
  getOverspendRootCause: (year: number, month: number) =>
    apiClient.get('/ai/v1/budget/overspend-root-cause', { params: { year, month } }),
  getCashflowForecast: (year: number, month: number) =>
    apiClient.get('/ai/v1/budget/cashflow-forecast', { params: { year, month } }),
  getUtilitiesAnomalies: (year: number, month: number) =>
    apiClient.get('/ai/v1/utilities/anomalies', { params: { year, month } }),
  getWeeklyBriefing: (weekStart?: string) =>
    apiClient.get('/ai/v1/dashboard/weekly-briefing', { params: weekStart ? { week_start: weekStart } : {} }),
  getSavingsRecommendations: (data: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
  }) => apiClient.post('/ai/v1/savings/recommendations', data),
  optimizeDebts: (data: { strategy?: 'avalanche' | 'snowball' }) =>
    apiClient.post('/ai/v1/debts/optimize', data),
};

/**
 * BUDGET / TRANSACTIONS MODULE
 */
export const budgetApi = {
  getAll: () => apiClient.get('/transactions'),
  create: (data: any) => apiClient.post('/transactions', data),
  update: (id: number, data: any) => apiClient.put(`/transactions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/transactions/${id}`),
};

/**
 * UTILITIES MODULE
 */
export const utilitiesApi = {
  getAll: () => apiClient.get('/utilities'),
  create: (data: any) => apiClient.post('/utilities', data),
  update: (id: number, data: any) => apiClient.put(`/utilities/${id}`, data),
  delete: (id: number) => apiClient.delete(`/utilities/${id}`),
};

/**
 * METERS MODULE
 */
export const metersApi = {
  getAll: () => apiClient.get('/meters'),
  create: (data: any) => apiClient.post('/meters', data),
  delete: (id: number) => apiClient.delete(`/meters/${id}`),
  addReading: (meterId: number, data: any) => apiClient.post(`/meters/${meterId}/readings`, data),
  updateReading: (meterId: number, readingId: number, data: any) => apiClient.put(`/meters/${meterId}/readings/${readingId}`, data),
  deleteReading: (meterId: number, readingId: number) => apiClient.delete(`/meters/${meterId}/readings/${readingId}`),
};

/**
 * BUSINESS (LITTLE LOOM) MODULE
 */
export const businessApi = {
  getAll: () => apiClient.get('/business-orders'),
  create: (data: any) => apiClient.post('/business-orders', data),
  update: (id: number, data: any) => apiClient.put(`/business-orders/${id}`, data),
  delete: (id: number) => apiClient.delete(`/business-orders/${id}`),
  shopifyImport: () => apiClient.post('/business-orders/shopify-import'),
};

/**
 * DEBTS MODULE
 */
export const debtsApi = {
  getAll: () => apiClient.get('/debts'),
  create: (data: any) => apiClient.post('/debts', data),
  update: (id: number, data: any) => apiClient.put(`/debts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/debts/${id}`),
};

/**
 * SAVINGS MODULE
 */
export const savingsApi = {
  getAll: () => apiClient.get('/savings'),
  create: (data: any) => apiClient.post('/savings', data),
  update: (id: number, data: any) => apiClient.put(`/savings/${id}`, data),
  delete: (id: number) => apiClient.delete(`/savings/${id}`),
  addEntry: (savingsId: number, data: any) => apiClient.post(`/savings/${savingsId}/entries`, data),
  deleteEntry: (savingsId: number, entryId: number) => apiClient.delete(`/savings/${savingsId}/entries/${entryId}`),
};
