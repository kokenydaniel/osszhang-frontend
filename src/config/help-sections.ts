import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Home,
  LayoutDashboard,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { IconPodTone } from '@/components/design/IconPod';

export type HelpSectionId = 'general' | 'finance' | 'household' | 'business' | 'tools';

export type HelpSectionConfig = {
  id: HelpSectionId;
  slug: string;
  title: string;
  description: string;
  cardTeaser: string;
  icon: LucideIcon;
  tone: IconPodTone;
  gradient: string;
  topicIds: string[];
};

export const HELP_SECTIONS: HelpSectionConfig[] = [
  {
    id: 'general',
    slug: 'altalanos',
    title: 'Általános',
    description: 'Irányítópult, kasszák, beállítások, csomagok és alapvető app-ismeretek.',
    cardTeaser: 'Kezdés, háztartás, modulok, előfizetés, adatimport és kategóriák.',
    icon: LayoutDashboard,
    tone: 'primary',
    gradient: 'from-primary to-violet-500',
    topicIds: ['dashboard', 'wallets', 'settings', 'subscription', 'data_import', 'budget_categories'],
  },
  {
    id: 'finance',
    slug: 'penzugyek',
    title: 'Pénzügyek',
    description: 'Költségvetés, megtakarítás, tartozások és minden pénzügyi modul részletesen.',
    cardTeaser: 'Költségvetés, megtakarítás, hitel, kintlévőség, zsebpénz, biztosítás, bérbeadás.',
    icon: Wallet,
    tone: 'info',
    gradient: 'from-sky-500 to-blue-600',
    topicIds: ['budget', 'savings', 'debts', 'receivables', 'pocket_money', 'insurance', 'rental'],
  },
  {
    id: 'household',
    slug: 'haztartas',
    title: 'Háztartás',
    description: 'Rezsi számlák, partnerrel való elszámolás és közműóra követés.',
    cardTeaser: 'Rezsi rögzítés, megosztás, sablonok, mérőóra leolvasások és AI figyelmeztetések.',
    icon: Home,
    tone: 'success',
    gradient: 'from-emerald-500 to-teal-600',
    topicIds: ['utilities', 'meters'],
  },
  {
    id: 'business',
    slug: 'vallalkozas',
    title: 'Vállalkozás',
    description: 'Rendelések, bevételek, webshop importok és éves vállalkozási kimutatások.',
    cardTeaser: 'Rendelésnapló, csatornák, AAM keret, könyvelési export, Shopify / WooCommerce import.',
    icon: Briefcase,
    tone: 'warning',
    gradient: 'from-amber-500 to-orange-600',
    topicIds: ['business'],
  },
  {
    id: 'tools',
    slug: 'okos-eszkozok',
    title: 'Okos eszközök',
    description: 'AI-alapú tervezők és speciális funkciók a háztartásodhoz.',
    cardTeaser: 'Utazásköltség-tervező, megtakarítási terv, PDF export és „belefér” elemzés.',
    icon: Sparkles,
    tone: 'primary',
    gradient: 'from-violet-500 to-fuchsia-600',
    topicIds: ['travel_planner'],
  },
];

export const HELP_SECTION_BY_SLUG = Object.fromEntries(
  HELP_SECTIONS.map((section) => [section.slug, section]),
) as Record<string, HelpSectionConfig>;

export const HELP_SECTION_BY_ID = Object.fromEntries(
  HELP_SECTIONS.map((section) => [section.id, section]),
) as Record<HelpSectionId, HelpSectionConfig>;

export function helpSectionPath(slug: string): string {
  return `/help/${slug}`;
}

export function getHelpSectionBySlug(slug: string): HelpSectionConfig | undefined {
  return HELP_SECTION_BY_SLUG[slug];
}

export function getHelpSectionForTopic(topicId: string): HelpSectionConfig | undefined {
  return HELP_SECTIONS.find((section) => section.topicIds.includes(topicId));
}
