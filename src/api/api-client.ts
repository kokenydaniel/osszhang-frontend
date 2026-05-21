import type { AxiosInstance } from 'axios';
import { createHttpClient } from './http-client';
import { AiFinanceClient } from './clients/ai-finance-client';
import { AuthClient } from './clients/auth-client';
import { BudgetClient } from './clients/budget-client';
import { BusinessClient } from './clients/business-client';
import { DebtsClient } from './clients/debts-client';
import { HouseholdClient } from './clients/household-client';
import { InvestmentsClient } from './clients/investments-client';
import { MetersClient } from './clients/meters-client';
import { SavingsClient } from './clients/savings-client';
import { UtilitiesClient } from './clients/utilities-client';

export class ApiClient {
  readonly http: AxiosInstance;
  readonly auth: AuthClient;
  readonly household: HouseholdClient;
  readonly budget: BudgetClient;
  readonly utilities: UtilitiesClient;
  readonly meters: MetersClient;
  readonly business: BusinessClient;
  readonly debts: DebtsClient;
  readonly savings: SavingsClient;
  readonly investments: InvestmentsClient;
  readonly aiFinance: AiFinanceClient;

  constructor(http: AxiosInstance = createHttpClient()) {
    this.http = http;
    this.auth = new AuthClient(http);
    this.household = new HouseholdClient(http);
    this.budget = new BudgetClient(http);
    this.utilities = new UtilitiesClient(http);
    this.meters = new MetersClient(http);
    this.business = new BusinessClient(http);
    this.debts = new DebtsClient(http);
    this.savings = new SavingsClient(http);
    this.investments = new InvestmentsClient(http);
    this.aiFinance = new AiFinanceClient(http);
  }
}

export const apiClient = new ApiClient();
