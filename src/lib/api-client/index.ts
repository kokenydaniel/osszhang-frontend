export * from './api-client';
export { ApiClientNetworkError } from './api-client';
export * from './clients';
export * from './public-env';
export * from './response';
export { isValidationErrorApiResponse, isGeneralErrorApiResponse } from './type-guards';
export * from './type-guards';
export { apiClient, ApiClientFacade } from './api-client-instance';

import { ApiClientNetworkError } from './api-client';
import { apiClient } from './api-client-instance';

export class ApiClientError extends Error {
  public status?: number;
  public data?: unknown;
  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
export function getApiErrorMessage(error: unknown, fallback: string = 'Hiba történt'): string {
  if (error instanceof ApiClientError) {
    const data = error.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    return error.message;
  }
  if (error instanceof ApiClientNetworkError) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

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
export const attachmentsClient = apiClient.attachments;
export const pocketMoneyClient = apiClient.pocketMoney;
export const insuranceClient = apiClient.insurance;
export const rentalClient = apiClient.rental;
export const feedbackClient = apiClient.feedback;
export const receivablesClient = apiClient.receivables;
export const travelClient = apiClient.travel;
export const helpAssistantClient = apiClient.helpAssistant;
export { getLastInsuranceApiFailure } from './clients/insurance-client';
export { getLastRentalApiFailure } from './clients/rental-client';
