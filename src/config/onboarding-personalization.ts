import type { OnboardingModuleId } from '@/helpers/household-onboarding';

export type PersonalizationQuestionId =
  | 'pet'
  | 'car'
  | 'children'
  | 'rent'
  | 'subscriptions'
  | 'telecom'
  | 'travel'
  | 'fitness'
  | 'business'
  | 'debts';

export type PersonalizationAnswer = {
  yes: boolean | null;
  detail?: string;
  selected?: string[];
};

export type PersonalizationAnswers = Record<PersonalizationQuestionId, PersonalizationAnswer>;

export type QuestionInteraction = 'yesno' | 'yesno_text' | 'yesno_providers';

export type PersonalizationQuestion = {
  id: PersonalizationQuestionId;
  interaction: QuestionInteraction;
  title: string;
  subtitle: string;
  yesLabel?: string;
  noLabel?: string;
  yesReaction?: string;
  noReaction?: string;
  infoNote?: string;
  followUp?: {
    label: string;
    placeholder: string;
    fallbackCategory?: string;
  };
  categoriesOnYes?: string[];
  providerOptions?: string[];
  suggestModule?: OnboardingModuleId;
};

export const DEFAULT_PERSONALIZATION_ANSWERS: PersonalizationAnswers = {
  pet: { yes: null },
  car: { yes: null },
  children: { yes: null },
  rent: { yes: null },
  subscriptions: { yes: null },
  telecom: { yes: null, selected: [] },
  travel: { yes: null },
  fitness: { yes: null },
  business: { yes: null },
  debts: { yes: null },
};

export const ONBOARDING_BASE_CATEGORIES = ['Fizetés', 'Élelmiszer', 'Rezsi'];

export const HOUSEHOLD_VIBE_PRESETS = [
  {
    id: 'family',
    label: 'Család',
    description: 'Gyerek is van — szülők, testvérek, több generáció.',
    nameHint: 'Pl. Kovács család',
  },
  {
    id: 'couple',
    label: 'Pár',
    description: 'Ketten éltek együtt, gyerek nélkül.',
    nameHint: 'Pl. Anna & Péter',
  },
  {
    id: 'solo',
    label: 'Egyedül',
    description: 'Egy személy, saját kiadások és megtakarítások.',
    nameHint: 'Pl. Dávid háztartása',
  },
  {
    id: 'roommates',
    label: 'Lakótársak',
    description: 'Többen osztoztok a lakáson és a közös számlákon.',
    nameHint: 'Pl. Béke utca 12.',
  },
] as const;

export const ONBOARDING_PERSONALIZATION_QUESTIONS: PersonalizationQuestion[] = [
  {
    id: 'pet',
    interaction: 'yesno_text',
    title: 'Van háziállatotok?',
    subtitle: 'A neve külön költségvetési kategóriaként jelenik meg — eledel, orvos, felszerelés külön számolható.',
    yesLabel: 'Igen, van',
    noLabel: 'Nincs',
    yesReaction: 'Jó fej — felvesszük a családba a költségvetésben is!',
    noReaction: 'Rendben, tovább!',
    followUp: {
      label: 'Mi a neve?',
      placeholder: 'Pl. Bodri',
      fallbackCategory: 'Háziállat',
    },
  },
  {
    id: 'car',
    interaction: 'yesno',
    title: 'Használtok autót?',
    subtitle: 'Tankolás, parkolás, szerviz — külön címkékkel átláthatóbb.',
    yesLabel: 'Igen',
    noLabel: 'Nem',
    yesReaction: 'Beállítjuk a Tankolás és Autó kategóriákat.',
    categoriesOnYes: ['Tankolás', 'Autó'],
  },
  {
    id: 'children',
    interaction: 'yesno',
    title: 'Van gyerek a háztartásban?',
    subtitle: 'Óvoda, ruházat, játék, készpénz zsebpénz — érdemes külön követni.',
    yesLabel: 'Igen',
    noLabel: 'Nem',
    yesReaction: 'Gyerek kategória hozzáadva!',
    categoriesOnYes: ['Gyerek'],
  },
  {
    id: 'rent',
    interaction: 'yesno',
    title: 'Albérletben laktok?',
    subtitle: 'Lakbér és közös költség külön sorban — a Rezsi modult is ajánljuk.',
    yesLabel: 'Igen, bérlünk',
    noLabel: 'Saját ingatlan',
    yesReaction: 'Albérlet kategória + Rezsi modul ajánlva.',
    categoriesOnYes: ['Albérlet'],
    suggestModule: 'utilities',
  },
  {
    id: 'subscriptions',
    interaction: 'yesno',
    title: 'Van előfizetésetek?',
    subtitle: 'Streaming, zene, edzőterem — fix havi díjak, nem szolgáltatói számla.',
    yesLabel: 'Igen, van',
    noLabel: 'Nincs',
    yesReaction: 'Előfizetések kategória hozzáadva.',
    categoriesOnYes: ['Előfizetések'],
  },
  {
    id: 'telecom',
    interaction: 'yesno_providers',
    title: 'Van mobil, otthoni net vagy TV szolgáltató számlátok?',
    subtitle:
      'A havi számla és a rajta lévő készülékrészlet is ide tartozik — pl. Telekom kategóriába, nem a Tartozások modulba.',
    yesLabel: 'Igen, van',
    noLabel: 'Nincs ilyen',
    noReaction: 'Rendben, tovább!',
    providerOptions: ['Telekom', 'One', 'Yettel', 'Digi', 'Vodafone'],
    followUp: {
      label: 'Más szolgáltató is van? (opcionális)',
      placeholder: 'Pl. Netfone',
      fallbackCategory: 'Szolgáltató',
    },
  },
  {
    id: 'travel',
    interaction: 'yesno',
    title: 'Szerettek utazni?',
    subtitle: 'Repülő, szállás, programok — külön kategóriában könnyebb tervezni.',
    yesLabel: 'Igen, gyakran',
    noLabel: 'Ritkán',
    yesReaction: 'Utazás kategória beállítva!',
    categoriesOnYes: ['Utazás'],
    suggestModule: 'savings',
  },
  {
    id: 'fitness',
    interaction: 'yesno',
    title: 'Sportoltok vagy van hobbitok?',
    subtitle: 'Edzőterem, felszerelés, klubdíj — külön címke segít.',
    yesLabel: 'Igen',
    noLabel: 'Nem igazán',
    yesReaction: 'Sport / hobbi kategória hozzáadva.',
    categoriesOnYes: ['Sport / hobbi'],
  },
  {
    id: 'business',
    interaction: 'yesno',
    title: 'Van mellékállásotok vagy vállalkozásotok?',
    subtitle: 'Webshop, freelancing, alkalmi munka — külön modulban is követhető.',
    yesLabel: 'Igen, van',
    noLabel: 'Nincs',
    yesReaction: 'Vállalkozás modul ajánlva!',
    categoriesOnYes: ['Vállalkozás'],
    suggestModule: 'business',
  },
  {
    id: 'debts',
    interaction: 'yesno',
    title: 'Van banki hiteletek vagy hivatalos tartozásotok?',
    subtitle:
      'Lakáshitel, személyi kölcsön, hitelkártya, autóhitel — amit külön törlesztési tervben érdemes követni.',
    infoNote:
      'A szolgáltatói számlák (Telekom, One…) és a telefonon lévő készülékrészlet nem ide tartoznak — azokat a költségvetésben, szolgáltatónként érdemes vezetni.',
    yesLabel: 'Igen, van ilyen',
    noLabel: 'Nincs ilyen',
    yesReaction: 'Tartozások modul bekapcsolva — a hiteleket külön modulban követheted.',
    noReaction: 'Rendben — a szolgáltatói számlákat ettől függetlenül könyvelheted.',
    suggestModule: 'debts',
  },
];

export function mergeCategoryList(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const raw of list) {
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

export function isQuestionAnswered(question: PersonalizationQuestion, answer: PersonalizationAnswer): boolean {
  if (question.interaction === 'yesno_providers') {
    if (answer.yes === false) return true;
    if (answer.yes === true) {
      return (answer.selected?.length ?? 0) > 0 || Boolean(answer.detail?.trim());
    }
    return false;
  }
  return answer.yes !== null;
}

export function categoriesForQuestion(
  question: PersonalizationQuestion,
  answer: PersonalizationAnswer,
): string[] {
  if (question.interaction === 'yesno_providers') {
    if (answer.yes !== true) return [];
    const categories = [...(answer.selected ?? [])];
    const custom = answer.detail?.trim();
    if (custom) categories.push(custom);
    return categories;
  }

  if (answer.yes !== true) return [];

  if (question.followUp) {
    const name = answer.detail?.trim();
    return [name || question.followUp.fallbackCategory || question.title];
  }

  return question.categoriesOnYes ?? [];
}

export function buildCategoriesFromAnswers(answers: PersonalizationAnswers): string[] {
  const generated: string[] = [];
  for (const question of ONBOARDING_PERSONALIZATION_QUESTIONS) {
    generated.push(...categoriesForQuestion(question, answers[question.id]));
  }
  return generated;
}

export function suggestedModulesFromAnswers(answers: PersonalizationAnswers): OnboardingModuleId[] {
  const modules = new Set<OnboardingModuleId>();
  for (const question of ONBOARDING_PERSONALIZATION_QUESTIONS) {
    const answer = answers[question.id];
    if (answer?.yes === true && question.suggestModule) {
      modules.add(question.suggestModule);
    }
  }
  return [...modules];
}

export function countAnsweredQuestions(answers: PersonalizationAnswers): number {
  return ONBOARDING_PERSONALIZATION_QUESTIONS.filter((q) =>
    isQuestionAnswered(q, answers[q.id]),
  ).length;
}

export function reactionForAnswer(
  question: PersonalizationQuestion,
  answer: PersonalizationAnswer,
): string | null {
  if (question.interaction === 'yesno_providers') {
    if (answer.yes === false) return question.noReaction ?? null;
    const categories = categoriesForQuestion(question, answer);
    if (categories.length > 0) {
      return `Kategóriák: ${categories.join(', ')} — ide könyveld a számlákat és a készülékrészletet is.`;
    }
    return null;
  }
  if (answer.yes === true) return question.yesReaction ?? null;
  if (answer.yes === false) return question.noReaction ?? null;
  return null;
}

export function recommendedModuleIds(answers: PersonalizationAnswers): OnboardingModuleId[] {
  return suggestedModulesFromAnswers(answers);
}
