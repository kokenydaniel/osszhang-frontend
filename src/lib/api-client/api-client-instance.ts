import { ApiClient } from './api-client';
import {
  AiFinanceClient,
  AuthClient,
  BudgetClient,
  BusinessClient,
  DebtsClient,
  HouseholdClient,
  InvestmentsClient,
  MetersClient,
  SavingsClient,
  UtilitiesClient,
  WalletClient,
  SubscriptionClient,
  AdminClient,
  AttachmentsClient,
  PocketMoneyClient,
  InsuranceClient,
  RentalClient,
  FeedbackClient,
  ReceivablesClient,
} from './clients';
import { API_URL } from './public-env';

export class ApiClientFacade extends ApiClient {
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
  readonly wallets: WalletClient;
  readonly subscription: SubscriptionClient;
  readonly admin: AdminClient;
  readonly attachments: AttachmentsClient;
  readonly pocketMoney: PocketMoneyClient;
  readonly insurance: InsuranceClient;
  readonly rental: RentalClient;
  readonly feedback: FeedbackClient;
  readonly receivables: ReceivablesClient;

  constructor(baseUrl: string = API_URL) {
    super(baseUrl);
    this.auth = new AuthClient(this);
    this.household = new HouseholdClient(this);
    this.budget = new BudgetClient(this);
    this.utilities = new UtilitiesClient(this);
    this.meters = new MetersClient(this);
    this.business = new BusinessClient(this);
    this.debts = new DebtsClient(this);
    this.savings = new SavingsClient(this);
    this.investments = new InvestmentsClient(this);
    this.aiFinance = new AiFinanceClient(this);
    this.wallets = new WalletClient(this);
    this.subscription = new SubscriptionClient(this);
    this.admin = new AdminClient(this);
    this.attachments = new AttachmentsClient(this);
    this.pocketMoney = new PocketMoneyClient(this);
    this.insurance = new InsuranceClient(this);
    this.rental = new RentalClient(this);
    this.feedback = new FeedbackClient(this);
    this.receivables = new ReceivablesClient(this);
  }
}

export const apiClient = new ApiClientFacade();
