import { moduleDefaults } from '@/config/moduleDefaults';
import { subscriptionConfig } from '@/config/subscription';

const config = {
  branding: {
    appName: 'Összhang',
    tagline: 'Pénzügyek, összhangban.',
    description:
      'Bevételek, kiadások, rezsi, megtakarítások és tartozások — egyetlen letisztult, modern felületen.',
    legacyAppNames: ['Aura', 'PénzPilot', 'PenzPilot'] as const,
  },

  dates: {
    api: 'YYYY-MM-DD',
    display: 'YYYY.MM.DD',
    displayLong: 'YYYY. MM. DD.',
  },

  modules: {
    ids: ['budget', 'savings', 'debts', 'utilities', 'meters', 'business'] as const,
    labels: {
      budget: 'Költségvetés',
      savings: 'Megtakarítás',
      debts: 'Tartozások',
      utilities: 'Rezsi',
      meters: 'Közműórák',
      business: 'Vállalkozás',
    },
    householdFlags: {
      budget: ['budget_enabled', 'budgetEnabled'] as const,
      savings: ['savings_enabled', 'savingsEnabled'] as const,
      debts: ['debts_enabled', 'debtsEnabled'] as const,
      utilities: ['utilities_enabled', 'utilitiesEnabled'] as const,
      meters: ['meters_enabled', 'metersEnabled'] as const,
      business: ['business_enabled', 'businessEnabled'] as const,
    },
  },

  exchangeRates: {
    fallback: {
      USD: 365,
      EUR: 395,
      BTC: 24000000,
      ETH: 1200000,
      HUF: 1,
    },
  },

  pagination: {
    adminUsersPerPage: 25,
  },

  storage: {
    /** Legacy zustand persist key — safe to drop after migration */
    legacyPreferencesKey: 'osszhang-preferences',
  },

  moduleDefaults,
  subscription: subscriptionConfig,
} as const;

export default config;

export type AppConfig = typeof config;
export type ModuleId = (typeof config.modules.ids)[number];
