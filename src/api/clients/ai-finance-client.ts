import type { AxiosInstance } from 'axios';

export class AiFinanceClient {
  constructor(protected http: AxiosInstance) {}

  query(prompt: string, includeContext = true) {
    return this.http.post('/ai/query', { prompt, include_context: includeContext });
  }

  autoCategorizeTransaction(data: {
    description: string;
    type?: 'income' | 'expense';
    amount?: number;
    candidate_categories: string[];
  }) {
    return this.http.post('/ai/v1/transactions/auto-categorize', data);
  }

  getOverspendRootCause(year: number, month: number) {
    return this.http.get('/ai/v1/budget/overspend-root-cause', { params: { year, month } });
  }

  getCashflowForecast(year: number, month: number) {
    return this.http.get('/ai/v1/budget/cashflow-forecast', { params: { year, month } });
  }

  getUtilitiesAnomalies(year: number, month: number) {
    return this.http.get('/ai/v1/utilities/anomalies', { params: { year, month } });
  }

  getWeeklyBriefing(weekStart?: string) {
    return this.http.get('/ai/v1/dashboard/weekly-briefing', { params: weekStart ? { week_start: weekStart } : {} });
  }

  getSavingsRecommendations(data: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
  }) {
    return this.http.post('/ai/v1/savings/recommendations', data);
  }

  optimizeDebts(data: { strategy?: 'avalanche' | 'snowball' }) {
    return this.http.post('/ai/v1/debts/optimize', data);
  }
}
