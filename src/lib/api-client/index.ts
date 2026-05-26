export { ApiClient, ApiClientError, getApiErrorMessage } from './api-client';
export { apiClient, ApiClientFacade } from './api-client-instance';
export { API_URL } from './public-env';
export type { ApiResponse, RequestOptions } from './response';
export * from './clients';

import { apiClient } from './api-client-instance';

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
export const walletClient = apiClient.wallets;
export const subscriptionClient = apiClient.subscription;
export const adminClient = apiClient.admin;
