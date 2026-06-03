import { AI_FEATURE_LABELS, type AiFeatureId } from '@/config/ai-features';

export type PlatformFeatureCategory = 'system' | 'integration' | 'ai' | 'platform';

export type PlatformFeatureMeta = {
  label: string;
  description: string;
  category: PlatformFeatureCategory;
  aiFeatureId?: AiFeatureId;
};

/** Globális platform kapcsolók metaadatai (admin + auth payload). */
export const PLATFORM_FEATURE_META: Record<string, PlatformFeatureMeta> = {
  maintenance_mode: {
    label: 'Karbantartás mód',
    description:
      'Bekapcsolva: a bejelentkezett felhasználók (lifetime platform admin kivételével) karbantartási oldalt látnak, az API adatlekérések blokkolva. Használd üzemeltetéskor vagy nagy migráció előtt.',
    category: 'system',
  },
  beta_mode: {
    label: 'Béta üzemmód',
    description:
      'Bekapcsolva: minden háztartás ideiglenesen Premium szintű hozzáférést kap (modulok, AI, integrációk), függetlenül az előfizetéstől. Teszteléshez és demó környezethez.',
    category: 'system',
  },
  enable_shopify_import: {
    label: 'Shopify rendelés import',
    description:
      'Platform szintű engedély a Shopify rendelés importra. Ha be van kapcsolva, a háztartás admin a Beállítások → Modulok → Vállalkozás → Shopify import alatt adhatja meg a bolt URL-t és API tokent; a rendelések a Vállalkozás modulba kerülnek.',
    category: 'integration',
  },
  enable_woocommerce_import: {
    label: 'WooCommerce rendelés import',
    description:
      'WooCommerce REST API import engedélyezése platform szinten. A bolt adatai: Beállítások → Modulok → Vállalkozás → WooCommerce. Premium csomag + háztartási kapcsoló is kell.',
    category: 'integration',
  },
  enable_unas_import: {
    label: 'UNAS rendelés import',
    description:
      'UNAS webshop import engedélyezése. Bolt azonosító és API kulcs: Beállítások → Modulok → Vállalkozás → UNAS. Premium csomag szükséges.',
    category: 'integration',
  },
  enable_attachments: {
    label: 'Számla és nyugta csatolás',
    description:
      'Fájl csatolás költségvetési tételekhez és vállalkozási rendelésekhez. A felhasználó a tétel / rendelés szerkesztőben tölthet fel bizonylatot (ha a csomagja engedi).',
    category: 'platform',
  },
  enable_webhooks: {
    label: 'Webhook-ok',
    description:
      'Kimenő webhook végpont regisztrálása admin felületen. A cél URL tárolódik; az automatikus eseményküldés (pl. új tranzakció) fokozatosan bővül — jelenleg elsősorban infrastruktúra.',
    category: 'platform',
  },
  enable_audit_log: {
    label: 'Audit napló',
    description:
      'Platform admin → Audit napló: rendszer- és admin műveletek listája (pl. feature flag váltás). A háztartási tagok költségvetési szerkesztései jelenleg nem mind kerülnek ide.',
    category: 'platform',
  },
  enable_ai_cfo: {
    label: AI_FEATURE_LABELS.monthly_advisor,
    description:
      'Havi pénzügyi tanácsadó widget az irányítópulton (Vezérlőpult). A rögzített egyenleg, fizetendő és „Marad” alapján összefoglaló, tippek, figyelmeztetések. Premium + háztartási AI beállítás kell a felhasználónak.',
    category: 'ai',
    aiFeatureId: 'monthly_advisor',
  },
  enable_ai_travel_planner: {
    label: AI_FEATURE_LABELS.travel_planner,
    description:
      'Eszközök → Utazás tervező: úti cél, napok és keret alapján költségbecslés és napirend. Nem módosítja automatikusan a költségvetést — külön eszköz.',
    category: 'ai',
    aiFeatureId: 'travel_planner',
  },
  enable_ai_weekly_briefing: {
    label: AI_FEATURE_LABELS.weekly_report,
    description:
      'Heti pénzügyi jelentés szöveges összefoglalóval az irányítópulton / AI briefing szekcióban. Aktuális hét pénzügyi mozgásairól.',
    category: 'ai',
    aiFeatureId: 'weekly_report',
  },
  enable_ai_overspend: {
    label: AI_FEATURE_LABELS.overspend_analysis,
    description:
      'Költségvetés oldal — „Elemzések és javaslatok” blokk: ha a hónapban több ment el, mint a tervezett, rövid magyarázat és fő okok (kategóriák). Nem talál ki összegeket.',
    category: 'ai',
    aiFeatureId: 'overspend_analysis',
  },
  enable_ai_auto_categorize: {
    label: AI_FEATURE_LABELS.auto_categorize,
    description:
      'Új költségvetési tételnél az „Auto” gomb: a leírás alapján kategória javaslat a háztartás kategórialistájából. A mentés előtt módosítható.',
    category: 'ai',
    aiFeatureId: 'auto_categorize',
  },
  enable_ai_year_analysis: {
    label: AI_FEATURE_LABELS.year_summary,
    description:
      'Költségvetés → Éves nézet: AI összefoglaló a kategória- és havi adatokból, tanácsokkal. Csak a már rögzített számokra épül.',
    category: 'ai',
    aiFeatureId: 'year_summary',
  },
  enable_ai_utility_anomaly: {
    label: AI_FEATURE_LABELS.utility_watch,
    description:
      'Rezsi és Közműórák modul: szokatlan fogyasztás / összeg jelzése az előző időszakhoz képest. A mérőóra és rezsi tételek alapján.',
    category: 'ai',
    aiFeatureId: 'utility_watch',
  },
  enable_ai_debt_optimizer: {
    label: AI_FEATURE_LABELS.debt_payoff_plan,
    description:
      'Tartozások modul: javasolt visszafizetési sorrend (hórép vagy göngyöleg), extra befizetéssel számolt becslés. A hitel adatokból számol.',
    category: 'ai',
    aiFeatureId: 'debt_payoff_plan',
  },
  enable_ai_business_strategy: {
    label: AI_FEATURE_LABELS.business_revenue_analysis,
    description:
      'Vállalkozás modul — éves / stratégiai bevétel elemzés szöveges értelmezéssel. A rögzített rendelés- és csatorna adatokból.',
    category: 'ai',
    aiFeatureId: 'business_revenue_analysis',
  },
  enable_ai_payment_priority: {
    label: AI_FEATURE_LABELS.payment_priority,
    description:
      'Költségvetés → Elemzések: nyitott, esedékes tételek rangsorolása pontos összegekkel („mit fizessek előbb”). Nem hoz létre új tételt.',
    category: 'ai',
    aiFeatureId: 'payment_priority',
  },
  enable_ai_vat_estimate: {
    label: AI_FEATURE_LABELS.vat_estimate,
    description:
      'Vállalkozás modul — havi kimutatás: ÁFA bontás áfa-kötelesnél; AAM-nál nettó bevétel és költséghányados jövedelem-becslés. Csak a beállítások szerinti (pl. számlás) rendelések. Beállítások → Vállalkozás → Adózási beállítások.',
    category: 'ai',
    aiFeatureId: 'vat_estimate',
  },
  enable_ai_cost_reduction: {
    label: AI_FEATURE_LABELS.cost_reduction,
    description:
      'Költségvetés → Elemzések: spórolási javaslatok a tényleges kategória-kiadások alapján. Nem generál hamis megtakarítási összegeket.',
    category: 'ai',
    aiFeatureId: 'cost_reduction',
  },
};

export const PLATFORM_FEATURE_CATEGORY_LABELS: Record<PlatformFeatureCategory, string> = {
  system: 'Rendszer',
  integration: 'Integrációk',
  ai: 'AI funkciók',
  platform: 'Platform',
};

export function platformFeatureLabel(key: string): string {
  return PLATFORM_FEATURE_META[key]?.label ?? key.replace(/_/g, ' ');
}

export function platformFeatureCategory(key: string): PlatformFeatureCategory {
  return PLATFORM_FEATURE_META[key]?.category ?? 'platform';
}
