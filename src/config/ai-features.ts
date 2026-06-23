

export type AiFeatureId =
  | 'monthly_advisor'
  | 'weekly_report'
  | 'overspend_analysis'
  | 'cashflow_forecast'
  | 'auto_categorize'
  | 'year_summary'
  | 'utility_watch'
  | 'consumption_estimate'
  | 'debt_payoff_plan'
  | 'business_revenue_analysis'
  | 'travel_planner'
  | 'payment_priority'
  | 'vat_estimate'
  | 'cost_reduction';

export const AI_FEATURE_LABELS: Record<AiFeatureId, string> = {
  monthly_advisor: 'Havi pénzügyi tanácsadó',
  weekly_report: 'Heti pénzügyi jelentés',
  overspend_analysis: 'Miért ment el a pénz?',
  cashflow_forecast: 'Következő hónap becslése',
  auto_categorize: 'Kategória javaslat',
  year_summary: 'Éves költség-összefoglaló',
  utility_watch: 'Rezsi figyelő',
  consumption_estimate: 'Fogyasztás becslés',
  debt_payoff_plan: 'Hitel visszafizetési terv',
  business_revenue_analysis: 'Éves bevétel elemzés',
  travel_planner: 'Utazás költségtervező',
  payment_priority: 'Mit fizessek előbb?',
  vat_estimate: 'ÁFA kimutatás',
  cost_reduction: 'Spórolási javaslatok',
};

export const AI_FEATURE_DESCRIPTIONS: Partial<Record<AiFeatureId, string>> = {
  monthly_advisor:
    'A rögzített egyenleg, fizetendő és „Marad” összeg alapján készít havi összefoglalót, tanácsokat és figyelmeztetéseket.',
  payment_priority:
    'A nyitott tételek pontos összege és határideje alapján rangsorolja, mit érdemes előbb kifizetni.',
  vat_estimate:
    'A rögzített rendelésösszegekből és az ÁFA beállításból számít — nem becsl, csak a megadott adatokból dolgozik.',
  cost_reduction:
    'A tényleges kategória-összegek alapján javasol spórlási lehetőségeket; nem talál ki számokat.',
};

export const LEGACY_AI_FEATURE_LABELS: Record<string, string> = {
  'AI CFO': AI_FEATURE_LABELS.monthly_advisor,
  'Heti AI tájékoztató': AI_FEATURE_LABELS.weekly_report,
  'AI túlköltés figyelő': AI_FEATURE_LABELS.overspend_analysis,
  'AI túlköltés ellenőrzés': AI_FEATURE_LABELS.overspend_analysis,
  'Automatikus kategorizálás': AI_FEATURE_LABELS.auto_categorize,
  'Éves AI elemzés': AI_FEATURE_LABELS.year_summary,
  'AI anomáliafigyelés': AI_FEATURE_LABELS.utility_watch,
  'AI fogyasztás-becslés': AI_FEATURE_LABELS.consumption_estimate,
  'Tartozás-visszafizetési sorrend': AI_FEATURE_LABELS.debt_payoff_plan,
  'AI stratéga': AI_FEATURE_LABELS.business_revenue_analysis,
  'AI Utazástervező': AI_FEATURE_LABELS.travel_planner,
};

export function aiFeatureLabel(id: AiFeatureId): string {
  return AI_FEATURE_LABELS[id];
}
