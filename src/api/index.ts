import { ApiClient, apiClient } from './api-client';

export { ApiClient, apiClient } from './api-client';
export { createHttpClient } from './http-client';

export const authClient = apiClient.auth;
export const householdClient = apiClient.household;
export const budgetClient = apiClient.budget;
export const utilitiesClient = apiClient.utilities;
export const metersClient = apiClient.meters;
export const businessClient = apiClient.business;
export const debtsClient = apiClient.debts;
export const savingsClient = apiClient.savings;
export const investmentsClient = apiClient.investments;
export const aiFinanceClient = apiClient.aiFinance;

export default apiClient.http;
