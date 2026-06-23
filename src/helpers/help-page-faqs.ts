import { HELP } from '@/config/help';
import type { HelpGuideTopic } from '@/config/help-guide';

export type HelpPageFaq = {
  id: string;
  question: string;
  answer: string;
};

const FIELD_QUESTIONS: Record<string, string> = {
  balance: 'Mi az „Egyenleg” az irányítópulton?',
  payable: 'Mit jelent a „Fizetendő”?',
  remaining: 'Mit jelent a „Marad” / szabad keret?',
  'debts.remaining': 'Mit jelent a tartozások hátralék összesítő?',
  'utilities.balance': 'Mit jelent a rezsi egyenleg / mérleg?',
  'utilities.paid': 'Mit jelent a kifizetett rezsi összeg?',
  'business.paid': 'Mit jelent a beérkezett vállalkozási bevétel?',
  overdue: 'Mit jelent a „Lejárt” figyelmeztetés?',
  wealth: 'Mit mutat a „Vagyon” / megtakarítás összesítő?',
  business: 'Mit mutat a vállalkozás kártya az irányítópulton?',
  utilities: 'Mit mutat a rezsi mérleg az irányítópulton?',
  debts: 'Mit mutat a tartozások összesítő?',
  aiBriefing: 'Mi az AI heti összefoglaló?',
  aiUtilities: 'Mi az AI rezsi / fogyasztás figyelmeztetés?',
  pocketMoneyInterest: 'Mikor jelenik meg a zsebpénz kamat figyelmeztetés?',
  insuranceUpcoming: 'Mit mutat a biztosítás emlékeztető?',
  businessTax: 'Mit mutat az AAM / adó keret becslés?',
  rentalExpected: 'Mit jelent a várható bérleti díj?',
  rentalReceived: 'Mit jelent a befolyt bérleti díj?',
  rentalOutstanding: 'Mit jelent a hátralékos bérleti díj?',
  rentalOverdue: 'Mit jelent a lejárt bérleti díj?',
  receivablesOutstanding: 'Mit mutat a kintlévőség összesítő?',
  expectedInflows: 'Mit jelent a „Várható bevétel” összesítő?',
  manualBalance: 'Mi a kézi egyenleg a költségvetésben?',
  missedIncome: 'Mit jelent az „Elmaradt bevétel”?',
  plannedExpense: 'Mit jelent a „Tervezett kiadás”?',
  plannedIncome: 'Mit jelent a „Tervezett bevétel”?',
  paidThisMonth: 'Mit számít „Kifizetve ebben a hónapban”?',
  plannedMonthBalance: 'Mit jelent a tervezett havi egyenleg?',
  incomeReceived: 'Mit jelent a „Befolyt bevétel”?',
  aiOverspend: 'Hogyan működik az AI túlköltés elemzés?',
  categorySummary: 'Mit mutat a kategória összesítő?',
  yearExpense: 'Mit mutat az éves kifizetett kiadás?',
  yearIncome: 'Mit mutat az éves befolyt bevétel?',
  yearNet: 'Mit jelent az éves nettó?',
  yearComparison: 'Mit mutat az éves összehasonlítás?',
  yearCategory: 'Mit mutat az éves kategória bontás?',
  yearTopCategory: 'Mi a legnagyobb kiadási kategória az évben?',
  yearInsights: 'Mit mutatnak az éves automatikus mutatók?',
  yearAi: 'Mi az AI éves összefoglaló?',
  yearIncomeSources: 'Mit mutatnak a bevételi források éves nézetben?',
  yearMissedIncome: 'Mit mutat az éves elmaradt bevétel?',
  yearDebts: 'Mit mutat az éves törlesztés összesítő?',
  yearSavings: 'Mit mutat az éves megtakarítás mozgás?',
  yearLedger: 'Mit mutat az éves saját keret (ledger) bontás?',
  description: 'Mi a tétel megnevezése?',
  category: 'Mi a költségkategória mező?',
  amount: 'Hogyan adjak meg összeget?',
  currency: 'Hogyan működik a deviza (EUR/USD) rögzítés?',
  date: 'Mit jelent az esedékesség dátuma?',
  paidDate: 'Mit jelent a kifizetés dátuma?',
  statusToggle: 'Hogyan jelölök kiadást kifizetettnek?',
  cloneMonth: 'Hogyan működik a hónap másolása?',
  ledgerAmount: 'Mi a ledger / saját keret felhasználás?',
  ledgerNote: 'Mi a ledger megjegyzés mező?',
  txTypeIntro: 'Milyen tételtípusok vannak?',
  expenseNormal: 'Mi a normál kiadás típus?',
  expenseLedger: 'Mi a saját keretes kiadás?',
  incomeNormal: 'Mi a normál bevétel típus?',
  incomeReserve: 'Mi a tartalék bevétel típus?',
  reserveWarning: 'Mi a különbség a tartalék és a megtakarítás között?',
  ledgerModalIntro: 'Hogyan rögzítek ledger bejegyzést?',
  categoryName: 'Hogyan adok hozzá új költségkategóriát?',
  remaining_debt: 'Mit jelent a hátralék a tartozásoknál?',
  monthlyMin: 'Mi a havi minimum törlesztés összesítő?',
  payoffEstimate: 'Mit jelent a lejárat becslés?',
  monthlyInterest: 'Mit jelent a havi kamat becslés?',
  progress: 'Mit mutat a törlesztési haladás?',
  strategy: 'Mi a különbség az avalanche és snowball stratégia között?',
  strategyOrder: 'Mit jelent a javasolt törlesztési sorrend?',
  extraPayment: 'Mi az extra befizetés mező a stratégiánál?',
  name: 'Mit írjak a tartozás nevéhez?',
  targetAmount: 'Mi az eredeti összeg mező?',
  paidAmount: 'Mi az „eddig törlesztve” mező?',
  interestRate: 'Miért kell kamatláb?',
  minimumPayment: 'Mi a minimum havi törlesztés?',
  dueDay: 'Mi az esedékesség napja?',
  payAmount: 'Hogyan rögzítek törlesztést?',
  payDate: 'Mi a törlesztés dátuma?',
  payNote: 'Mi a törlesztés megjegyzése?',
  payBudget: 'Hogyan szinkronizálom a törlesztést a költségvetésbe?',
  payCategory: 'Melyik kategóriába kerüljön a törlesztés?',
  personal: 'Mit mutat a személyes megtakarítás összesítő?',
  wife: 'Mit mutat a vállalkozási / feleség számla összesítő?',
  totalWealth: 'Mit jelent a teljes vagyon?',
  investRatio: 'Mit jelent a befektetési arány?',
  accountName: 'Hogyan nevezzek el számlát?',
  owner: 'Mi a számla tulajdonos mező?',
  invName: 'Hogyan nevezzek el állampapírt?',
  invType: 'Mi az állampapír típus?',
  principal: 'Mi a befektetett tőke?',
  maturityAmount: 'Mi a lejárati névérték?',
  invRate: 'Mi a hozam / kamat mező?',
  purchaseDate: 'Mi a vásárlás dátuma?',
  maturityDate: 'Mi a lejárat dátuma?',
  payoutAmount: 'Mi a következő kamatkifizetés összege?',
  payoutDate: 'Mi a kamat dátuma?',
  historyAmount: 'Hogyan rögzítek befizetést vagy kivétet?',
  historyNote: 'Mi a mozgás megjegyzése?',
  historyEdit: 'Hogyan szerkesztek korábbi mozgást?',
  settlementRecord: 'Mi a rezsi elszámolás rögzítése?',
  wePaid: 'Mit jelent a „Mi fizettünk”?',
  partnerPaid: 'Mit jelent a „Partner fizetett”?',
  totalBills: 'Mit jelent az összes rezsi tétel?',
  paid_util: 'Mit jelent a kifizetett rezsi?',
  waiting: 'Mit jelent a várakozó rezsi?',
  readiness: 'Mit jelent a rezsi készültség?',
  utilityTemplates: 'Mik a rezsi sablonok?',
  payerSelect: 'Ki fizette a számlát?',
  billType: 'Mi a rezsi típus mező?',
  billAmount: 'Hogyan adjak meg rezsi összeget?',
  billDue: 'Mi a rezsi fizetési határidő?',
  settlement: 'Mi a rezsi megosztás / elszámolás típus?',
  settlementIntro: 'Hogyan működik a rezsi megosztás?',
  settlementShared: 'Mit jelent a közös (50-50) megosztás?',
  settlementMine: 'Mit jelent, ha én fizetem a teljes számlát?',
  settlementPartner: 'Mit jelent, ha a partner fizeti a teljes számlát?',
  chart: 'Mit mutat a fogyasztás grafikon?',
  meterSelect: 'Hogyan választok mérőórát?',
  readingDate: 'Mi a leolvasás dátuma?',
  readingValue: 'Mi az óraállás mező?',
  estimateYear: 'Mi a fogyasztás becslés éve?',
  estimateMonth: 'Mi a fogyasztás becslés hónapja?',
  newMeterName: 'Hogyan nevezzek el új mérőórát?',
  newMeterUnit: 'Mi a mértékegység mező?',
  newMeterLocation: 'Mi a mérőóra helyszín mező?',
  monthlyRevenue: 'Mit mutat a havi árbevétel?',
  paid_biz: 'Mit jelent a beérkezett összeg?',
  pending: 'Mit jelent a függőben lévő bevétel?',
  margin: 'Mit jelent a haszonkulcs?',
  aiStrategist: 'Mi az AI vállalkozás stratégia?',
  orderDate: 'Mi a rendelés dátuma?',
  customer: 'Ki a vevő mező?',
  orderAmount: 'Hogyan adjak meg rendelés összeget?',
  channel: 'Mi az értékesítési csatorna?',
  paymentMethod: 'Mi a fizetési mód?',
  provider: 'Mi a fizetési szolgáltató?',
  destination: 'Mi a pénz célhelye?',
  paidDateBiz: 'Mi a tényleges befizetés napja?',
  invoiceNumber: 'Mi a számla sorszáma?',
  paymentSection: 'Mit jelent a fizetés szekció?',
  conversion: 'Mit jelent a konverziós arány?',
  ytd: 'Mit jelent a YTD forgalom?',
  aov: 'Mit jelent az átlagos rendelési érték (AOV)?',
  topChannel: 'Mi a legjobb csatorna?',
  channelCount: 'Mit jelent a csatornaszám?',
  firstName: 'Mi a keresztnév mező?',
  lastName: 'Mi a vezetéknév mező?',
  username: 'Mi a felhasználónév?',
  password: 'Milyen jelszót adjak meg?',
  passwordConfirm: 'Miért kell jelszó megerősítés?',
  householdName: 'Mi a háztartás neve?',
  businessName: 'Mi a vállalkozás neve?',
  shopifyUrl: 'Hol találom a Shopify URL-t?',
  shopifyToken: 'Hol találom a Shopify API tokent?',
  sumupMerchantCode: 'Hol találom a SumUp merchant kódot?',
  sumupApiKey: 'Hol találom a SumUp API kulcsot?',
  splitPartner: 'Ki a rezsi partner?',
  inviteUsername: 'Milyen felhasználónevet adjak az új tagnak?',
  invitePassword: 'Mi az ideiglenes jelszó?',
  inviteRole: 'Milyen szerepkörök vannak?',
  invitePermissions: 'Hogyan állítok be modul jogosultságot?',
  pocketMoneyEntryType: 'Milyen zsebpénz mozgástípusok vannak?',
  pocketMoneyBalance: 'Hogyan számolódik a zsebpénz egyenleg?',
  'settings.pocketMoneyInterest': 'Hogyan működik a zsebpénz kamatozás beállítása?',
  insuranceReminder: 'Hogyan működik a biztosítás emlékeztető?',
  insurancePolicy: 'Mit kell megadni egy biztosítási szerződésnél?',
  insuranceAttachment: 'Hogyan csatolok biztosítási dokumentumot?',
  insuranceDelete: 'Mi történik biztosítás törlésekor?',
  deleteHousehold: 'Mit jelent a háztartás törlése?',
  rentalProperty: 'Mit kell megadni egy bérbe adott ingatlannál?',
  rentalIncome: 'Hogyan rögzítek bérleti bevételt?',
  rentalExpense: 'Mi a tulajdonosi költség a bérbeadásnál?',
  rentalExport: 'Hogyan exportálok bérbeadás adatot?',
  destination_travel: 'Mi az úti cél mező?',
  origin: 'Mi az indulási hely?',
  duration: 'Hány napot adjak meg?',
  'travel.budget': 'Mi a teljes utazási keret?',
  targetDate: 'Mi a tervezett indulás dátuma?',
  travelers: 'Mi az utazók száma?',
  tripStyle: 'Mi az utazás stílusa?',
  accommodation: 'Mi a szállás preferencia?',
  transportMode: 'Milyen közlekedési módok vannak?',
  transportBooked: 'Mit jelent, ha a közlekedés már megvan?',
  accommodationBooked: 'Mit jelent, ha a szállás már megvan?',
  carConsumption: 'Mi az autó fogyasztás mező?',
  saveGoal: 'Hogyan mentek megtakarítási célként?',
  financialFit: 'Mit jelent a „Belefér az utazás?”',
  financialFitDisposable: 'Mi a szabad keret az utazástervezőben?',
  financialFitTravelSavings: 'Mi számít utazásra fordítható megtakarításnak?',
  financialFitAvailable: 'Mi a rendelkezésre álló összeg?',
  financialFitTripCost: 'Honnan jön a teljes utazási költség?',
  financialFitMonthlyCapacity: 'Mi a havi megtakarítási kapacitás?',
  financialFitMonthlyRequired: 'Mennyi kell havonta félretenni?',
  comparison: 'Mit mutat az összehasonlító táblázat?',
  costAdjustments: 'Hogyan módosíthatom a költségeket?',
  costSplit: 'Hogyan működik a költségmegosztás?',
};

type HelpArea = keyof typeof HELP;

const TOPIC_FAQ_SOURCES: Record<
  string,
  | { area: HelpArea }
  | { area: HelpArea; keys?: string[] }
  | { settingsPrefix: string }
> = {
  dashboard: { area: 'dashboard' },
  budget: { area: 'budget' },
  budget_categories: { settingsPrefix: 'category' },
  savings: { area: 'savings' },
  debts: { area: 'debts' },
  utilities: { area: 'utilities' },
  meters: { area: 'meters' },
  business: { area: 'business' },
  pocket_money: { settingsPrefix: 'pocketMoney' },
  insurance: { settingsPrefix: 'insurance' },
  rental: { settingsPrefix: 'rental' },
  receivables: { area: 'dashboard', keys: ['receivablesOutstanding'] },
  travel_planner: { area: 'travel' },
  settings: {
    area: 'settings',
    keys: [
      'firstName',
      'lastName',
      'username',
      'password',
      'passwordConfirm',
      'householdName',
      'businessName',
      'splitPartner',
      'inviteUsername',
      'invitePassword',
      'inviteRole',
      'invitePermissions',
      'categoryName',
      'deleteHousehold',
      'shopifyUrl',
      'shopifyToken',
      'sumupMerchantCode',
      'sumupApiKey',
    ],
  },
};

function questionForKey(key: string, area?: string): string {
  if (area) {
    const composite = `${area}.${key}`;
    if (FIELD_QUESTIONS[composite]) return FIELD_QUESTIONS[composite];
  }
  return FIELD_QUESTIONS[key] ?? `Mit jelent a „${key}” mező?`;
}

function faqsFromRecord(area: string, record: Record<string, string>, keys?: string[]): HelpPageFaq[] {
  const entries = keys ?? Object.keys(record);
  return entries
    .filter((key) => typeof record[key] === 'string')
    .map((key) => ({
      id: `${area}.${key}`,
      question: questionForKey(key, area),
      answer: record[key],
    }));
}

function faqsFromSettingsPrefix(prefix: string): HelpPageFaq[] {
  const record = HELP.settings as Record<string, string>;
  const keys = Object.keys(record).filter((key) => key.startsWith(prefix));
  return keys.map((key) => ({
    id: `settings.${key}`,
    question: questionForKey(key, 'settings'),
    answer: record[key],
  }));
}

const EXTRA_TOPIC_FAQS: Record<string, HelpPageFaq[]> = {
  wallets: [
    {
      id: 'wallets.shared',
      question: 'Mi a közös kassza?',
      answer:
        'A közös kassza a háztartás alap pénztárcája — ingyenes csomagban egy közös kassza érhető el. A fejlécben válthatsz kasszát; minden modul a kiválasztott kassza adatait mutatja.',
    },
    {
      id: 'wallets.private',
      question: 'Mi a privát kassza?',
      answer:
        'Pro csomagban korlátlan személyes kasszát hozhatsz létre. A privát kassza saját költségvetést jelent — a közös háztartási adatoktól elkülönül.',
    },
    {
      id: 'wallets.switch',
      question: 'Hogyan váltok kasszát?',
      answer: 'A fejlécben, a kassza választó gombra kattintva láthatod a közös és privát kasszákat, és átválthatsz közöttük.',
    },
  ],
  subscription: [
    {
      id: 'subscription.free',
      question: 'Mit tartalmaz az ingyenes csomag?',
      answer: 'Költségvetés modul és egy közös kassza — minden háztartás alapja.',
    },
    {
      id: 'subscription.pro',
      question: 'Mit ad a Pro csomag?',
      answer:
        'Privát kasszák, megtakarítás, tartozás, rezsi, közműórák, zsebpénz, biztosítás, bérbeadás, kintlévőség, rezsimegosztás.',
    },
    {
      id: 'subscription.premium',
      question: 'Mit ad a Premium csomag?',
      answer:
        'Minden Pro funkció + vállalkozás modul, webshop importok (Shopify, WooCommerce, UNAS), AI elemzések, utazástervező, dokumentum csatolások, SumUp import.',
    },
    {
      id: 'subscription.billing',
      question: 'Hol kezelem az előfizetést?',
      answer: 'Beállítások → Előfizetés fül, vagy az Árazás oldal (/pricing). A fizetés Stripe-on keresztül történik.',
    },
  ],
  data_import: [
    {
      id: 'data_import.excel',
      question: 'Lehet Excelből importálni a költségvetést?',
      answer:
        'Jelenleg nincs tömeges Excel/CSV import a költségvetéshez. A tételeket egyenként kell felvinni, vagy az előző hónapot másolhatod.',
    },
    {
      id: 'data_import.clone',
      question: 'Hogyan másolok hónapot költségvetésben?',
      answer:
        'A Költségvetés oldalon a „Hónap másolása” funkció az előző hónap tételeit viszi át — esedékesség napja megmarad, minden másolat függőben marad.',
    },
    {
      id: 'data_import.webshop',
      question: 'Hol érhető el webshop import?',
      answer:
        'Csak a Vállalkozás modulban, Premium csomaggal: Beállítások → Integrációk (Shopify, WooCommerce, UNAS).',
    },
  ],
  receivables: [
    {
      id: 'receivables.overview',
      question: 'Mire való a kintlévőség modul?',
      answer:
        'Magán kölcsönök, előlegek és visszafizetendő összegek nyilvántartása — ki mennyivel tartozik neked, mennyi a hátralék.',
    },
    {
      id: 'receivables.start',
      question: 'Hogyan rögzítek új kintlévőséget?',
      answer: 'Kintlévőség menü → Új kapcsolat vagy tétel → kölcsön vagy előleg összeg → visszafizetések rögzítése.',
    },
    {
      id: 'receivables.dashboard',
      question: 'Hol látom az összesítést?',
      answer: 'Az irányítópulton megjelenik a nyitott kintlévőség összege, ha a modul be van kapcsolva.',
    },
  ],
  budget_categories: [
    {
      id: 'budget_categories.where',
      question: 'Hol hozok létre új kategóriát?',
      answer:
        'Beállítások → Modulok → Költségvetés kártya → Kategóriák szekció. Csak a háztartás adminisztrátora szerkesztheti.',
    },
    {
      id: 'budget_categories.not_here',
      question: 'Miért nem tudok kategóriát létrehozni az „Új tétel” űrlapon?',
      answer:
        'Az „Új tétel” csak a meglévő kategóriák közül választ — új kategória mindig a Beállításokban jön létre.',
    },
  ],
};

export function getTopicFaqs(topic: HelpGuideTopic): HelpPageFaq[] {
  const fromFeatures: HelpPageFaq[] = topic.features.map((feature) => ({
    id: `feature.${topic.id}.${feature.title}`,
    question: feature.title,
    answer: feature.description,
  }));

  const fromTips: HelpPageFaq[] =
    topic.tips?.map((tip, index) => ({
      id: `tip.${topic.id}.${index}`,
      question: 'Tipp',
      answer: tip,
    })) ?? [];

  const fromCustom = topic.faqs ?? [];
  const fromExtra = EXTRA_TOPIC_FAQS[topic.id] ?? [];

  const source = TOPIC_FAQ_SOURCES[topic.id];
  let fromHelp: HelpPageFaq[] = [];

  if (source && 'settingsPrefix' in source) {
    fromHelp = faqsFromSettingsPrefix(source.settingsPrefix);
  } else if (source && 'area' in source) {
    const record = HELP[source.area] as Record<string, string>;
    const keys = 'keys' in source ? source.keys : undefined;
    fromHelp = faqsFromRecord(source.area, record, keys);
  }

  const merged = new Map<string, HelpPageFaq>();
  for (const faq of [...fromCustom, ...fromExtra, ...fromFeatures, ...fromHelp, ...fromTips]) {
    if (!merged.has(faq.id)) {
      merged.set(faq.id, faq);
    }
  }

  return Array.from(merged.values());
}

export function faqSearchHaystack(faq: HelpPageFaq): string {
  return `${faq.question} ${faq.answer}`;
}
