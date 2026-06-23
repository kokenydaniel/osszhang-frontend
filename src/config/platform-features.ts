import { AI_FEATURE_LABELS, type AiFeatureId } from '@/config/ai-features';

export type PlatformFeatureCategory = 'system' | 'integration' | 'ai' | 'platform';

export type PlatformFeatureMeta = {
  label: string;
  description: string;

  scope: string;
  category: PlatformFeatureCategory;
  aiFeatureId?: AiFeatureId;
};

export const PLATFORM_FEATURE_META: Record<string, PlatformFeatureMeta> = {
  maintenance_mode: {
    label: 'Karbantartás mód',
    scope: 'Egész app — sima felhasználók nem érik el az appot',
    description:
      'Bekapcsolva: a bejelentkezett felhasználók (lifetime platform admin kivételével) karbantartási oldalt látnak, az API adatlekérések blokkolva. Használd üzemeltetéskor vagy nagy migráció előtt.',
    category: 'system',
  },
  beta_mode: {
    label: 'Béta üzemmód',
    scope: 'Egész app — minden háztartás Premium szintet kap',
    description:
      'Bekapcsolva: minden háztartás ideiglenesen Premium szintű hozzáférést kap (modulok, AI, integrációk), függetlenül az előfizetéstől. Teszteléshez és demó környezethez.',
    category: 'system',
  },
  enable_shopify_import: {
    label: 'Shopify rendelés import',
    scope: 'Vállalkozás modul — Shopify rendelés szinkron',
    description:
      'Platform szintű engedély a Shopify rendelés importra. Ha be van kapcsolva, a háztartás admin a Beállítások → Modulok → Vállalkozás → Shopify import alatt adhatja meg a bolt URL-t és API tokent; a rendelések a Vállalkozás modulba kerülnek.',
    category: 'integration',
  },
  enable_woocommerce_import: {
    label: 'WooCommerce rendelés import',
    scope: 'Vállalkozás modul — WooCommerce rendelés szinkron',
    description:
      'WooCommerce REST API import engedélyezése platform szinten. A bolt adatai: Beállítások → Modulok → Vállalkozás → WooCommerce. Premium csomag + háztartási kapcsoló is kell.',
    category: 'integration',
  },
  enable_unas_import: {
    label: 'UNAS rendelés import',
    scope: 'Vállalkozás modul — UNAS rendelés szinkron',
    description:
      'UNAS webshop import engedélyezése. Bolt azonosító és API kulcs: Beállítások → Modulok → Vállalkozás → UNAS. Premium csomag szükséges.',
    category: 'integration',
  },
  enable_attachments: {
    label: 'Számla és nyugta csatolás',
    scope: 'Felhasználói app — fájl csatolás tételekhez és rendelésekhez',
    description:
      'Fájl csatolás költségvetési tételekhez és vállalkozási rendelésekhez. A felhasználó a tétel / rendelés szerkesztőben tölthet fel bizonylatot (ha a csomagja engedi).',
    category: 'platform',
  },
  enable_webhooks: {
    label: 'Webhook API',
    scope: 'Kimenő webhookok — nem az admin menü láthatóságát szabályozza',
    description:
      'Kimenő webhook végpont regisztrálása és küldés engedélyezése. A webhookok kezelése az Admin → Webhook-ok oldalon van; ez a kapcsoló a szolgáltatás működését kapcsolja.',
    category: 'platform',
  },
  enable_audit_log: {
    label: 'Audit napló rögzítés',
    scope: 'Eseménynapló írása — nem az admin menü láthatóságát szabályozza',
    description:
      'Platform admin műveletek naplózása (pl. feature flag váltás). Az Audit napló oldal mindig elérhető lifetime adminnak; ez a kapcsoló szabályozza, hogy új események kerülnek-e rögzítésre.',
    category: 'platform',
  },
  enable_ai_cfo: {
    label: AI_FEATURE_LABELS.monthly_advisor,
    scope: 'Irányítópult — havi tanácsadó widget',
    description:
      'Havi pénzügyi tanácsadó widget az irányítópulton (Vezérlőpult). A rögzített egyenleg, fizetendő és „Marad” alapján összefoglaló, tippek, figyelmeztetések. Premium + háztartási AI beállítás kell a felhasználónak.',
    category: 'ai',
    aiFeatureId: 'monthly_advisor',
  },
  enable_ai_travel_planner: {
    label: AI_FEATURE_LABELS.travel_planner,
    scope: 'Utazástervező eszköz — külön az „Utazás modul kiadás” kapcsolótól',
    description:
      'Eszközök → Utazás tervező: úti cél, napok és keret alapján költségbecslés és napirend. A modul menüben való megjelenéshez külön kapcsold be az Utazástervező modult a Modul kiadás oldalon is.',
    category: 'ai',
    aiFeatureId: 'travel_planner',
  },
  enable_ai_weekly_briefing: {
    label: AI_FEATURE_LABELS.weekly_report,
    scope: 'Irányítópult — heti pénzügyi jelentés',
    description:
      'Heti pénzügyi jelentés szöveges összefoglalóval az irányítópulton / AI briefing szekcióban. Aktuális hét pénzügyi mozgásairól.',
    category: 'ai',
    aiFeatureId: 'weekly_report',
  },
  enable_ai_overspend: {
    label: AI_FEATURE_LABELS.overspend_analysis,
    scope: 'Költségvetés — túlköltés elemzés',
    description:
      'Költségvetés oldal — „Elemzések és javaslatok” blokk: ha a hónapban több ment el, mint a tervezett, rövid magyarázat és fő okok (kategóriák). Nem talál ki összegeket.',
    category: 'ai',
    aiFeatureId: 'overspend_analysis',
  },
  enable_ai_auto_categorize: {
    label: AI_FEATURE_LABELS.auto_categorize,
    scope: 'Költségvetés — kategória javaslat új tételnél',
    description:
      'Új költségvetési tételnél az „Auto” gomb: a leírás alapján kategória javaslat a háztartás kategórialistájából. A mentés előtt módosítható.',
    category: 'ai',
    aiFeatureId: 'auto_categorize',
  },
  enable_ai_year_analysis: {
    label: AI_FEATURE_LABELS.year_summary,
    scope: 'Költségvetés — éves összefoglaló',
    description:
      'Költségvetés → Éves nézet: AI összefoglaló a kategória- és havi adatokból, tanácsokkal. Csak a már rögzített számokra épül.',
    category: 'ai',
    aiFeatureId: 'year_summary',
  },
  enable_ai_utility_anomaly: {
    label: AI_FEATURE_LABELS.utility_watch,
    scope: 'Rezsi / közműórák — szokatlan fogyasztás',
    description:
      'Rezsi és Közműórák modul: szokatlan fogyasztás / összeg jelzése az előző időszakhoz képest. A mérőóra és rezsi tételek alapján.',
    category: 'ai',
    aiFeatureId: 'utility_watch',
  },
  enable_ai_debt_optimizer: {
    label: AI_FEATURE_LABELS.debt_payoff_plan,
    scope: 'Tartozások — visszafizetési terv',
    description:
      'Tartozások modul: javasolt visszafizetési sorrend (hórép vagy göngyöleg), extra befizetéssel számolt becslés. A hitel adatokból számol.',
    category: 'ai',
    aiFeatureId: 'debt_payoff_plan',
  },
  enable_ai_business_strategy: {
    label: AI_FEATURE_LABELS.business_revenue_analysis,
    scope: 'Vállalkozás — bevétel elemzés',
    description:
      'Vállalkozás modul — éves / stratégiai bevétel elemzés szöveges értelmezéssel. A rögzített rendelés- és csatorna adatokból.',
    category: 'ai',
    aiFeatureId: 'business_revenue_analysis',
  },
  enable_ai_payment_priority: {
    label: AI_FEATURE_LABELS.payment_priority,
    scope: 'Költségvetés — fizetési prioritás',
    description:
      'Költségvetés → Elemzések: nyitott, esedékes tételek rangsorolása pontos összegekkel („mit fizessek előbb”). Nem hoz létre új tételt.',
    category: 'ai',
    aiFeatureId: 'payment_priority',
  },
  enable_ai_vat_estimate: {
    label: AI_FEATURE_LABELS.vat_estimate,
    scope: 'Vállalkozás — ÁFA / AAM kimutatás',
    description:
      'Vállalkozás modul — havi kimutatás: ÁFA bontás áfa-kötelesnél; AAM-nál nettó bevétel és költséghányados jövedelem-becslés. Csak a beállítások szerinti (pl. számlás) rendelések. Beállítások → Vállalkozás → Adózási beállítások.',
    category: 'ai',
    aiFeatureId: 'vat_estimate',
  },
  enable_ai_cost_reduction: {
    label: AI_FEATURE_LABELS.cost_reduction,
    scope: 'Költségvetés — spórolási javaslatok',
    description:
      'Költségvetés → Elemzések: spórolási javaslatok a tényleges kategória-kiadások alapján. Nem generál hamis megtakarítási összegeket.',
    category: 'ai',
    aiFeatureId: 'cost_reduction',
  },
};

export const PLATFORM_FEATURE_CATEGORY_LABELS: Record<PlatformFeatureCategory, string> = {
  system: 'Üzemeltetés',
  integration: 'Webshop import',
  ai: 'AI eszköz',
  platform: 'Platform szolgáltatás',
};

export function platformFeatureScope(key: string): string {
  return PLATFORM_FEATURE_META[key]?.scope ?? '—';
}

export function platformFeatureLabel(key: string): string {
  return PLATFORM_FEATURE_META[key]?.label ?? key.replace(/_/g, ' ');
}

export function platformFeatureCategory(key: string): PlatformFeatureCategory {
  return PLATFORM_FEATURE_META[key]?.category ?? 'platform';
}
