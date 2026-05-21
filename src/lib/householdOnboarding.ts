import type { UserProfile } from '@/types';
import type { ModuleId } from '@/lib/moduleAccess';

export function needsHouseholdOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user || user.role !== 'admin' || !user.household) return false;
  const completed = user.household.onboardingCompleted ?? user.household.onboarding_completed ?? false;
  return !completed;
}

export type OnboardingModuleId = ModuleId;

export const ONBOARDING_MODULE_OPTIONS: {
  id: OnboardingModuleId;
  label: string;
  description: string;
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
  },
  {
    id: 'debts',
    label: 'Tartozások',
    description: 'Hitelek, kölcsönök és törlesztési tervek.',
  },
  {
    id: 'utilities',
    label: 'Rezsi',
    description: 'Közüzemi számlák, sablonok és opcionális megosztás.',
  },
  {
    id: 'meters',
    label: 'Közműórák',
    description: 'Villany, gáz, víz fogyasztás és mérőállások.',
  },
  {
    id: 'business',
    label: 'Vállalkozás',
    description: 'Rendelések és bevételek nyilvántartása — webshop import opcionális.',
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
