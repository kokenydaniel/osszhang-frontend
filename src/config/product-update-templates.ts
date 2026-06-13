import config from '@/config/config';
import { ONBOARDING_MODULE_OPTIONS, ONBOARDING_MODULE_TIERS } from '@/helpers/household-onboarding';
import type { ModuleId } from '@/helpers/module-access';
import type { ProductUpdateKind, ProductUpdatePayload } from '@/types/admin';

export type ProductUpdateTemplateCategory = 'module' | 'feature' | 'integration' | 'tip';

export type ProductUpdateTemplate = {
  id: string;
  category: ProductUpdateTemplateCategory;
  label: string;
  description: string;
  heroIcon: string;
  payload: ProductUpdatePayload;
};

const MODULE_BULLETS: Partial<Record<ModuleId, string[]>> = {
  budget: [
    'Havi bevételek és kiadások áttekintése',
    'Kategóriák és célok követése',
    'Gyors rögzítés és ismétlődő tételek',
  ],
  savings: [
    'Külön nyilvántartás bankszámláknak és készpénznek',
    'Célok és egyenlegek egy pillantásra',
    'Állampapír és megtakarítási célok',
  ],
  debts: [
    'Hitelek, kölcsönök és törlesztési terv',
    'Befizetések dátummal és státusszal',
    'Kifizetett tartozások külön szekcióban',
  ],
  utilities: [
    'Rezsi számlák és sablonok',
    'Fizetendő és lejárt tételek jelzése',
    'Opcionális megosztás háztartáson belül',
  ],
  meters: [
    'Villany, gáz, víz mérőállások',
    'Fogyasztás és költség becslés',
    'Gyors sablonok új mérőhöz',
  ],
  business: [
    'Rendelések és bevételek nyilvántartása',
    'Webshop import (Shopify, WooCommerce, UNAS)',
    'Dokumentumok és SumUp kapcsolat',
  ],
  pocket_money: [
    'Családtagok zsebpénze külön',
    'Költések és egyenlegek',
    'Opcionális kamat / megtakarítás',
  ],
  insurance: [
    'Szerződések és éves díjak egy helyen',
    'Megújítási és lejárati emlékeztetők',
    'Kötvény csatolmányok',
  ],
  rental: [
    'Bérbe adott ingatlanok nyilvántartása',
    'Bevételek és költségek tételesen',
    'Dokumentumok ingatlanonként',
  ],
  receivables: [
    'Kinek adtál pénzt, mennyi van még nála',
    'Visszafizetések követése',
    'Nyitott és lezárt tételek',
  ],
  travel_planner: [
    'Úti cél és napok alapján költségbecslés',
    'Napi költségkeret javaslat',
    'Külön eszköz — nem írja felül a költségvetést',
  ],
};

const MODULE_SIDEBAR: Partial<Record<ModuleId, string>> = {
  budget: 'Költségvetés',
  savings: 'Megtakarítások',
  debts: 'Tartozások',
  utilities: 'Rezsi',
  meters: 'Közműórák',
  business: 'Vállalkozás',
  pocket_money: 'Zsebpénz',
  insurance: 'Biztosítások',
  rental: 'Bérbeadás',
  receivables: 'Kintlévőség',
  travel_planner: 'Utazástervező',
};

function moduleLocationHint(moduleId: ModuleId, label: string): string {
  const sidebar = MODULE_SIDEBAR[moduleId] ?? label;
  return `Oldalsáv → ${sidebar} · Bekapcsolás: Beállítások → Modulok → ${label}`;
}

function buildModuleTemplate(moduleId: ModuleId): ProductUpdateTemplate {
  const fromCatalog = ONBOARDING_MODULE_OPTIONS.find((m) => m.id === moduleId);
  const label = fromCatalog?.label ?? config.modules.labels[moduleId] ?? moduleId;
  const tier = ONBOARDING_MODULE_TIERS[moduleId] ?? fromCatalog?.tier ?? null;

  const tierNote =
    tier === 'premium'
      ? ' Premium csomag szükséges a modulhoz.'
      : tier === 'pro'
        ? ' Pro csomag szükséges a modulhoz.'
        : '';

  return {
    id: `module:${moduleId}`,
    category: 'module',
    label,
    description: fromCatalog?.description ?? `${label} modul bejelentése.`,
    heroIcon: moduleHeroIcon(moduleId),
    payload: {
      title: `Mostantól elérhető: ${label}`,
      subtitle: `Új modul az Összhangban — kapcsold be a háztartásodban.${tierNote}`,
      body: `${fromCatalog?.description ?? `${label} modul`} A modul csak akkor jelenik meg az oldalsávban, ha a háztartás adminja bekapcsolja — és a csomagod engedi.`,
      bullets: MODULE_BULLETS[moduleId] ?? [
        'Egységes felület a család pénzügyeihez',
        'Beállítások → Modulok alatt kapcsolható',
        'Jogosultságok tagonként állíthatók',
      ],
      location_hint: moduleLocationHint(moduleId, label),
      kind: 'new' satisfies ProductUpdateKind,
      module_id: moduleId,
      required_tier: tier ? tier : 'all',
      audience_role: 'admin',
      priority: 10,
    },
  };
}

function moduleHeroIcon(moduleId: ModuleId): string {
  const map: Partial<Record<ModuleId, string>> = {
    budget: 'Wallet',
    savings: 'PiggyBank',
    debts: 'TrendingDown',
    utilities: 'Droplets',
    meters: 'Gauge',
    business: 'ShoppingBag',
    pocket_money: 'Coins',
    insurance: 'Shield',
    rental: 'Building2',
    receivables: 'HandCoins',
    travel_planner: 'MapPinned',
  };
  return map[moduleId] ?? 'Sparkles';
}

const FEATURE_TEMPLATES: ProductUpdateTemplate[] = [
  {
    id: 'feature:ai-weekly-briefing',
    category: 'feature',
    label: 'AI heti jelentés',
    description: 'Heti pénzügyi összefoglaló az irányítópulton.',
    heroIcon: 'Bot',
    payload: {
      title: 'Új: AI heti pénzügyi jelentés',
      subtitle: 'Rövid, érthető összefoglaló a hét pénzügyeiről.',
      body: 'Az irányítópulton megjelenő AI szekció mostantól heti szintű jelentést készít a legfontosabb mozgásokról — kiadások, bevételek, figyelmeztetések egy helyen.',
      bullets: [
        'Automatikus heti összefoglaló szöveg',
        'Aktuális hét tranzakciói alapján',
        'Premium csomag + AI bekapcsolás kell',
      ],
      location_hint: 'Irányítópult → AI / heti jelentés szekció',
      kind: 'update',
      required_tier: 'premium',
      audience_role: 'all',
      priority: 8,
    },
  },
  {
    id: 'feature:ai-travel',
    category: 'feature',
    label: 'AI utazástervező',
    description: 'Költségbecslés úti cél és napok alapján.',
    heroIcon: 'MapPinned',
    payload: {
      title: 'Új eszköz: AI utazástervező',
      subtitle: 'Tervezd meg az utazás költségkeretét intelligensen.',
      body: 'Az Utazástervező segít becsülni a napi és teljes költségeket — külön eszköz, nem módosítja automatikusan a költségvetésed.',
      bullets: [
        'Úti cél, napok és keret megadása',
        'Napi költségjavaslat',
        'Premium csomag szükséges',
      ],
      location_hint: 'Oldalsáv → Okos eszközök → Utazástervező',
      kind: 'new',
      module_id: 'travel_planner',
      required_tier: 'premium',
      audience_role: 'all',
      priority: 8,
    },
  },
  {
    id: 'feature:attachments',
    category: 'feature',
    label: 'Számla csatolás',
    description: 'Bizonylatok költségvetéshez és rendelésekhez.',
    heroIcon: 'Paperclip',
    payload: {
      title: 'Mostantól csatolhatsz bizonylatot',
      subtitle: 'Számlák és nyugták a tételek mellett.',
      body: 'Költségvetési tételekhez és vállalkozási rendelésekhez fájl csatolható — így minden egy helyen marad, amikor kell.',
      bullets: [
        'PDF és kép feltöltés',
        'Költségvetés és vállalkozás modulban',
        'Premium csomag szükséges',
      ],
      location_hint: 'Tétel szerkesztése → Csatolmányok · Vagy Vállalkozás → rendelés részletei',
      kind: 'update',
      required_tier: 'premium',
      audience_role: 'all',
      priority: 7,
    },
  },
  {
    id: 'integration:shopify',
    category: 'integration',
    label: 'Shopify import',
    description: 'Rendelések automatikus importja.',
    heroIcon: 'ShoppingBag',
    payload: {
      title: 'Shopify rendelés import',
      subtitle: 'A webshop rendelései a Vállalkozás modulba érkeznek.',
      body: 'Ha Premium csomagod van és bekapcsoltad a Vállalkozás modult, a bolt URL-jét és API tokent megadva importálhatod a rendeléseket.',
      bullets: [
        'Automatikus rendelés szinkron',
        'Bevételek a vállalkozás modulban',
        'Beállítások → Modulok → Vállalkozás → Shopify',
      ],
      location_hint: 'Beállítások → Modulok → Vállalkozás → Shopify import',
      kind: 'new',
      module_id: 'business',
      required_tier: 'premium',
      audience_role: 'admin',
      priority: 6,
    },
  },
  {
    id: 'tip:modules-settings',
    category: 'tip',
    label: 'Modulok bekapcsolása',
    description: 'Emlékeztető a modulok helyére.',
    heroIcon: 'LayoutGrid',
    payload: {
      title: 'Tudtad? Modulokat te kapcsolsz be',
      subtitle: 'Nem minden funkció látszik alapból — szándékosan.',
      body: 'Az Összhang modulokra bontva működik. Amit használni szeretnél, azt a háztartás adminja bekapcsolhatja — így nem zsúfoljuk tele felesleges menüpontokkal az appot.',
      bullets: [
        'Beállítások → Modulok',
        'Csak a csomagod által engedélyezettek aktiválhatók',
        'Tagoknak külön jogosultság adható',
      ],
      location_hint: 'Beállítások → Modulok',
      kind: 'tip',
      audience_role: 'admin',
      priority: 3,
    },
  },
];

export const PRODUCT_UPDATE_MODULE_TEMPLATES: ProductUpdateTemplate[] = config.modules.ids.map((id) =>
  buildModuleTemplate(id),
);

export const PRODUCT_UPDATE_TEMPLATES: ProductUpdateTemplate[] = [
  ...PRODUCT_UPDATE_MODULE_TEMPLATES,
  ...FEATURE_TEMPLATES,
];

export function getProductUpdateTemplate(id: string): ProductUpdateTemplate | undefined {
  return PRODUCT_UPDATE_TEMPLATES.find((t) => t.id === id);
}

export function productUpdateTemplatesByCategory(category: ProductUpdateTemplateCategory): ProductUpdateTemplate[] {
  return PRODUCT_UPDATE_TEMPLATES.filter((t) => t.category === category);
}

export const PRODUCT_UPDATE_CATEGORY_LABELS: Record<ProductUpdateTemplateCategory, string> = {
  module: 'Új modul',
  feature: 'Új funkció',
  integration: 'Integráció',
  tip: 'Tipp / emlékeztető',
};

/** Sablon payload + opcionális felülírások → mentéshez */
export function mergeProductUpdatePayload(
  template: ProductUpdateTemplate,
  overrides?: Partial<ProductUpdatePayload>,
): ProductUpdatePayload {
  return {
    title: overrides?.title ?? template.payload.title,
    body: overrides?.body ?? template.payload.body,
    kind: overrides?.kind ?? template.payload.kind ?? 'new',
    bullets: overrides?.bullets ?? template.payload.bullets ?? [],
    subtitle: overrides?.subtitle ?? template.payload.subtitle ?? null,
    module_id: overrides?.module_id ?? template.payload.module_id ?? null,
    location_hint: overrides?.location_hint ?? template.payload.location_hint ?? null,
    hero_icon: overrides?.hero_icon ?? template.heroIcon ?? null,
    required_tier: overrides?.required_tier ?? template.payload.required_tier ?? 'all',
    audience_role: overrides?.audience_role ?? template.payload.audience_role ?? 'all',
    cta_label: overrides?.cta_label ?? template.payload.cta_label ?? null,
    cta_href: overrides?.cta_href ?? template.payload.cta_href ?? null,
    priority: overrides?.priority ?? template.payload.priority ?? 0,
    is_active: overrides?.is_active,
    published_at: overrides?.published_at ?? null,
    expires_at: overrides?.expires_at ?? null,
  };
}
