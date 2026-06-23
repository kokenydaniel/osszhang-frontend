import config, { type ModuleId } from '@/config/config';
import { isModuleComingSoon } from '@/config/platform-modules';
import {
  type HelpGuideTopic,
  HELP_GUIDE_TOPICS,
  MODULE_PATHS,
  getHelpTopicById,
} from '@/config/help-guide';
import { getTopicFaqs, faqSearchHaystack } from '@/helpers/help-page-faqs';
import {
  canAccessModuleByTier,
  effectiveTier,
  requiredTierForModule,
} from '@/helpers/check-access';
import { canAccessModule, canUseModuleWithTier } from '@/helpers/module-access';
import { helpAssistantClient } from '@/lib/api-client';
import type { HelpAssistantLink } from '@/lib/api-client/clients/help-assistant-client';
import type { SubscriptionTier, UserProfile } from '@/types';

export type HelpAccessKind =
  | 'available'
  | 'enable_module'
  | 'no_permission'
  | 'tier_locked'
  | 'coming_soon';

export type HelpAccessInfo = {
  kind: HelpAccessKind;
  requiredTier: SubscriptionTier | null;
  tierLabel: string | null;
  path: string | null;
  settingsPath: string;
};

export type HelpSearchResult = {
  topic: HelpGuideTopic;
  score: number;
  matchedFaqIds?: string[];
};

export function isHelpTopicVisible(topic: HelpGuideTopic, user: UserProfile | null | undefined): boolean {
  if (!topic.moduleId) return true;
  return !isModuleComingSoon(user, topic.moduleId);
}

export type HelpAssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  topicId?: string;
  access?: HelpAccessInfo;
  pricingHref?: string;
  links?: HelpAssistantLink[];
  rejected?: boolean;
};

const PRICING_PATH = '/pricing';
const SETTINGS_MODULES_PATH = '/settings?tab=modules';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Ingyenes',
  pro: 'Pro',
  premium: 'Premium',
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function scoreTopic(topic: HelpGuideTopic, tokens: string[]): { score: number; matchedFaqIds: string[] } {
  if (tokens.length === 0) return { score: 0, matchedFaqIds: [] };

  const faqs = getTopicFaqs(topic);
  const haystack = normalizeText(
    [
      topic.title,
      topic.summary,
      topic.overview,
      ...topic.keywords,
      ...topic.features.map((f) => `${f.title} ${f.description}`),
      ...faqs.map((faq) => faqSearchHaystack(faq)),
    ].join(' '),
  );

  let score = 0;
  const matchedFaqIds: string[] = [];

  for (const token of tokens) {
    if (normalizeText(topic.title).includes(token)) score += 8;
    if (topic.keywords.some((keyword) => normalizeText(keyword).includes(token))) score += 6;
    if (haystack.includes(token)) score += 2;

    for (const faq of faqs) {
      if (normalizeText(faqSearchHaystack(faq)).includes(token)) {
        score += 4;
        if (!matchedFaqIds.includes(faq.id)) matchedFaqIds.push(faq.id);
      }
    }
  }

  if (normalizeText(topic.title) === normalizeText(tokens.join(' '))) score += 20;

  return { score, matchedFaqIds };
}

export function searchHelpTopics(query: string, limit = 5, user?: UserProfile | null): HelpSearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return HELP_GUIDE_TOPICS.filter((topic) => isHelpTopicVisible(topic, user))
    .map((topic) => {
      const { score, matchedFaqIds } = scoreTopic(topic, tokens);
      return {
        topic,
        score,
        matchedFaqIds: matchedFaqIds.length > 0 ? matchedFaqIds : undefined,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function resolveTopicAccess(topic: HelpGuideTopic, user: UserProfile | null | undefined): HelpAccessInfo {
  if (!topic.moduleId) {
    return {
      kind: 'available',
      requiredTier: null,
      tierLabel: null,
      path: topic.path ?? null,
      settingsPath: SETTINGS_MODULES_PATH,
    };
  }

  const moduleId = topic.moduleId;
  const requiredTier = requiredTierForModule(moduleId);
  const tierLabel = requiredTier ? TIER_LABELS[requiredTier] : null;
  const path = topic.path ?? MODULE_PATHS[moduleId] ?? null;

  if (isModuleComingSoon(user, moduleId)) {
    return {
      kind: 'coming_soon',
      requiredTier,
      tierLabel,
      path,
      settingsPath: SETTINGS_MODULES_PATH,
    };
  }

  if (!user) {
    return {
      kind: 'tier_locked',
      requiredTier,
      tierLabel,
      path,
      settingsPath: SETTINGS_MODULES_PATH,
    };
  }

  if (!canAccessModuleByTier(user, moduleId)) {
    return {
      kind: 'tier_locked',
      requiredTier,
      tierLabel,
      path,
      settingsPath: SETTINGS_MODULES_PATH,
    };
  }

  if (!canAccessModule(user, moduleId)) {
    return {
      kind: 'no_permission',
      requiredTier,
      tierLabel,
      path,
      settingsPath: SETTINGS_MODULES_PATH,
    };
  }

  if (!canUseModuleWithTier(user, moduleId)) {
    return {
      kind: 'enable_module',
      requiredTier,
      tierLabel,
      path,
      settingsPath: SETTINGS_MODULES_PATH,
    };
  }

  return {
    kind: 'available',
    requiredTier,
    tierLabel,
    path,
    settingsPath: SETTINGS_MODULES_PATH,
  };
}

function tierSentence(requiredTier: SubscriptionTier | null): string {
  if (!requiredTier) return 'Az ingyenes csomagban is elérhető.';
  if (requiredTier === config.subscription.tiers.pro) return 'A Pro csomag része.';
  return 'A Premium csomag része.';
}

function accessParagraph(access: HelpAccessInfo, user: UserProfile | null | undefined): string {
  const userTier = user ? TIER_LABELS[effectiveTier(user)] : 'ismeretlen';

  switch (access.kind) {
    case 'available':
      return `Elérhető a csomagodban (${userTier}). Nyisd meg: ${access.path ?? 'a menüben'}.`;
    case 'enable_module':
      return `A csomagod tartalmazza (${userTier}), de a modult még be kell kapcsolni a Beállítások → Modulok menüben.`;
    case 'no_permission':
      return 'A háztartásban van jogosultságod a csomaghoz, de ehhez a modulhoz nincs hozzáférésed. Kérd az adminisztrátortól a jogot.';
    case 'tier_locked':
      return `Nem része a jelenlegi csomagodnak (${userTier}). Szükséges: ${access.tierLabel ?? 'magasabb csomag'}.`;
    case 'coming_soon':
      return 'Ez a modul hamarosan érkezik — még nem használható.';
    default:
      return '';
  }
}

export function buildTopicAnswer(topic: HelpGuideTopic, user: UserProfile | null | undefined): HelpAssistantMessage {
  const access = resolveTopicAccess(topic, user);
  const lines: string[] = [
    topic.summary,
    '',
    tierSentence(access.requiredTier),
    accessParagraph(access, user),
  ];

  if (access.kind === 'available' || access.kind === 'enable_module') {
    lines.push('', '**Első lépések:**');
    topic.howToStart.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
  }

  if (topic.tips?.length) {
    lines.push('', `Tipp: ${topic.tips[0]}`);
  }

  const pricingHref = access.kind === 'tier_locked' ? PRICING_PATH : undefined;

  return {
    id: `assistant-${topic.id}-${Date.now()}`,
    role: 'assistant',
    text: lines.join('\n'),
    topicId: topic.id,
    access,
    pricingHref,
  };
}

export type HelpChatHistoryEntry = {
  role: 'user' | 'assistant';
  content: string;
};

export async function askHelpAssistant(
  message: string,
  history: HelpChatHistoryEntry[] = [],
): Promise<HelpAssistantMessage> {
  const result = await helpAssistantClient.chat(message, history);
  if (!result.ok) {
    return {
      id: `assistant-error-${Date.now()}`,
      role: 'assistant',
      text: result.message,
      links: [{ label: 'Súgó oldal', path: '/help', kind: 'help' }],
    };
  }

  const body = result.data;
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    text: body.message,
    links: body.links,
    rejected: body.status === 'rejected',
    pricingHref: body.links.find((link) => link.kind === 'pricing')?.path,
  };
}

export const SUGGESTED_HELP_QUESTIONS: string[] = [
  'Hol találom a költségvetést?',
  'Mi kell a megtakarítás modulhoz?',
  'Hogyan kapcsolok be modult?',
  'Elérhető az utazástervező?',
  'Mi a különbség a Pro és Premium között?',
];

export function topicModuleLabel(topic: HelpGuideTopic): string | null {
  if (!topic.moduleId) return null;
  return config.modules.labels[topic.moduleId];
}

export { getHelpTopicById, HELP_GUIDE_TOPICS, PRICING_PATH, SETTINGS_MODULES_PATH, TIER_LABELS };
