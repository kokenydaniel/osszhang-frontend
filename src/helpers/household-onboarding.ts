import type { UserProfile } from '@/types';
import type { ModuleId } from '@/helpers/module-access';

export function needsHouseholdOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user || user.role !== 'admin' || !user.household) return false;
  const completed = user.household.onboarding_completed ?? user.household.onboarding_completed ?? false;
  return !completed;
}

export type OnboardingModuleId = ModuleId;

export const ONBOARDING_MODULE_TIERS: Partial<Record<OnboardingModuleId, 'pro' | 'premium'>> = {
  savings: 'pro',
  debts: 'pro',
  utilities: 'pro',
  meters: 'pro',
  business: 'premium',
};

export const ONBOARDING_MODULE_OPTIONS: {
  id: OnboardingModuleId;
  label: string;
  description: string;
  tier?: 'pro' | 'premium';
}[] = [
  {
    id: 'budget',
    label: 'Költségvetés',
    description: 'Havi bevételek és kiadások — ez az alap, ajánlott mindenkinek.',
  },
  {
    id: 'savings',
    label: 'Megtakarítás',
    description: 'Bankszámlák, készpénz, állampapírok külön nyilvántartása.',
    tier: 'pro',
  },
  {
    id: 'debts',
    label: 'Tartozások',
    description: 'Hitelek, kölcsönök és törlesztési tervek.',
    tier: 'pro',
  },
  {
    id: 'utilities',
    label: 'Rezsi',
    description: 'Közüzemi számlák, sablonok és opcionális megosztás.',
    tier: 'pro',
  },
  {
    id: 'meters',
    label: 'Közműórák',
    description: 'Villany, gáz, víz fogyasztás és mérőállások.',
    tier: 'pro',
  },
  {
    id: 'business',
    label: 'Vállalkozás',
    description: 'Rendelések és bevételek nyilvántartása — webshop import opcionális.',
    tier: 'premium',
  },
];

export const ONBOARDING_CATEGORY_PRESETS = [
  'Fizetés',
  'Élelmiszer',
  'Rezsi',
  'Tankolás',
  'Szórakozás',
  'Gyerek',
  'Vállalkozás',
];

export function tierForOnboardingFeature(feature: 'private_wallets' | 'utility_split' | 'shopify'): 'pro' | 'premium' {
  if (feature === 'shopify') return 'premium';
  return 'pro';
}

export type FinancialModelId = 'shared' | 'separate' | 'hybrid';

export const ONBOARDING_FINANCIAL_MODEL_OPTIONS: {
  id: FinancialModelId;
  label: string;
  description: string;
  tier?: 'pro';
}[] = [
  {
    id: 'shared',
    label: 'Mindent közösen',
    description:
      'Egy nagy közös kalapba kerül a fizetésünk, és abból fizetünk mindent. Nincs szükségünk privát kasszákra.',
  },
  {
    id: 'separate',
    label: 'Teljesen külön kassza',
    description:
      'A fizetésünk a saját, privát számlánkra érkezik. Csak a közös költségeket dobjuk össze vagy felezzük el.',
    tier: 'pro',
  },
  {
    id: 'hybrid',
    label: 'Részben közös, részben saját',
    description:
      'Van egy közös számlánk a rezsire és a bevásárlásra, de a maradék pénzünket mindenki maga kezeli privátban.',
    tier: 'pro',
  },
];

export function financialModelNeedsPrivateWallet(model: FinancialModelId): boolean {
  return model === 'separate' || model === 'hybrid';
}

export function financialModelLabel(model: FinancialModelId): string {
  return ONBOARDING_FINANCIAL_MODEL_OPTIONS.find((o) => o.id === model)?.label ?? model;
}
