export const FEEDBACK_CATEGORIES = ['bug', 'feature', 'improvement', 'question', 'other'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = ['new', 'read', 'replied', 'resolved'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Hiba — valami nem működik vagy hibás adatot látok',
  feature: 'Új funkció — olyan nincs még, amire szükségem lenne',
  improvement: 'Javítási ötlet — megvan a funkció, de jobban szeretném',
  question: 'Kérdés — nem értem valamit, segítségre van szükségem',
  other: 'Egyéb',
};

export const FEEDBACK_CATEGORY_HINTS: Record<FeedbackCategory, string> = {
  bug: 'Pl. összeomlás, rossz szám, gomb nem reagál, mentés sikertelen.',
  feature: 'Pl. export PDF-be, értesítés emailben, új modul ötlet.',
  improvement: 'Pl. gyorsabb lenne így, más elrendezés, hiányzó mező egy meglévő űrlapon.',
  question: 'Pl. hol találom, hogyan állítsak be valamit, mit jelent egy mező.',
  other: 'Ha egyik kategória sem illik.',
};

/** Régi bejelentések megjelenítéséhez */
export const FEEDBACK_LEGACY_CATEGORY_LABELS: Record<string, string> = {
  suggestion: 'Javítási ötlet (régi)',
  wish: 'Új funkció (régi)',
  missing: 'Új funkció (régi)',
};

export function feedbackCategoryLabel(category: string): string {
  if (category in FEEDBACK_CATEGORY_LABELS) {
    return FEEDBACK_CATEGORY_LABELS[category as FeedbackCategory];
  }
  return FEEDBACK_LEGACY_CATEGORY_LABELS[category] ?? category;
}

export const FEEDBACK_MAX_FILES = 5;

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Új',
  read: 'Feldolgozás alatt',
  replied: 'Válasz elküldve',
  resolved: 'Lezárva',
};

export const FEEDBACK_USER_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Beküldve — válaszra vár',
  read: 'Megtekintve',
  replied: 'Válasz érkezett',
  resolved: 'Lezárva',
};

export function feedbackUserStatusLabel(
  status: FeedbackStatus,
  hasUnreadReply?: boolean,
): string {
  if (hasUnreadReply) return 'Új válasz a csapatunktól';
  return FEEDBACK_USER_STATUS_LABELS[status] ?? status;
}
