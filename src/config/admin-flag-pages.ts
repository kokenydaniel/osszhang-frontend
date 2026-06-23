
export const ADMIN_FLAG_PAGE_GUIDE = [
  {
    route: '/admin/modules',
    title: 'Modul kiadás',
    summary: 'Egész app modulok (menü, oldal, „Hamarosan”). Nem webshop import, nem AI eszköz.',
    keys: 'enable_module_*',
  },
  {
    route: '/admin/platform-services',
    title: 'Platform szolgáltatások',
    summary: 'Keretrendszer-funkciók: csatolmányok, webhook API, audit napló írás.',
    keys: 'enable_attachments, enable_webhooks, enable_audit_log',
  },
  {
    route: '/admin/integrations',
    title: 'Integrációk',
    summary: 'Webshop rendelés import engedély platform szinten (Shopify, WooCommerce, UNAS).',
    keys: 'enable_*_import',
  },
  {
    route: '/admin/ai-features',
    title: 'AI kapcsolók',
    summary: 'Okos funkciók modulokon belül (tanácsadó, kategória javaslat, stb.).',
    keys: 'enable_ai_*',
  },
  {
    route: '/admin/features',
    title: 'Karbantartás & béta',
    summary: 'Vész / üzemeltetés: karbantartási mód és ideiglenes Premium hozzáférés mindenkinek.',
    keys: 'maintenance_mode, beta_mode',
  },
] as const;

export function adminFlagPageGuideExcept(currentRoute: string) {
  return ADMIN_FLAG_PAGE_GUIDE.filter((page) => page.route !== currentRoute);
}
