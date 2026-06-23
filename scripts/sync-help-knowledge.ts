import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELP } from '../src/config/help.ts';
import { HELP_GUIDE_TOPICS, MODULE_PATHS } from '../src/config/help-guide.ts';
import config from '../src/config/config.ts';

// Dynamic import path for FAQ builder — keep in sync with help-page-faqs.ts
async function loadTopicFaqs() {
  const mod = await import('../src/helpers/help-page-faqs.ts');
  return mod.getTopicFaqs;
}

type KnowledgeChunk = {
  id: string;
  area: string;
  title: string;
  keywords: string[];
  body: string;
  path?: string;
  moduleId?: string;
};

const AREA_LABELS: Record<string, string> = {
  auth: 'Bejelentkezés és regisztráció',
  dashboard: 'Irányítópult',
  budget: 'Költségvetés',
  debts: 'Tartozások',
  savings: 'Megtakarítások',
  utilities: 'Rezsi',
  meters: 'Közműórák',
  business: 'Vállalkozás',
  settings: 'Beállítások',
  travel: 'Utazástervező',
  pocket_money: 'Zsebpénz',
  insurance: 'Biztosítások',
  rental: 'Bérbeadás',
  receivables: 'Kintlévőség',
};

const FIELD_LABELS: Record<string, string> = {
  category: 'Költségkategória',
  categoryName: 'Új kategória felvitele',
  cloneMonth: 'Hónap másolása',
  manualBalance: 'Kézi egyenleg',
  payable: 'Fizetendő',
  remaining: 'Marad',
  ledgerAmount: 'Saját keret / ledger',
  expenseLedger: 'Saját keretes kiadás',
  expenseNormal: 'Normál kiadás',
  incomeReserve: 'Tartalék bevétel',
  splitPartner: 'Rezsi partner',
  inviteRole: 'Tag szerepkör',
  invitePermissions: 'Tag jogosultságok',
};

function flattenHelp(obj: Record<string, unknown>, area: string, prefix = ''): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const id = prefix ? `${area}.${prefix}${key}` : `${area}.${key}`;
    if (typeof value === 'string') {
      const label = FIELD_LABELS[key] ?? key;
      chunks.push({
        id,
        area,
        title: `${AREA_LABELS[area] ?? area} — ${label}`,
        keywords: [area, key, label, value],
        body: value,
      });
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      chunks.push(...flattenHelp(value as Record<string, unknown>, area, prefix ? `${prefix}${key}.` : `${key}.`));
    }
  }

  return chunks;
}

function guideChunks(getTopicFaqs: (topic: (typeof HELP_GUIDE_TOPICS)[number]) => { id: string; question: string; answer: string }[]): KnowledgeChunk[] {
  return HELP_GUIDE_TOPICS.flatMap((topic) => {
    const moduleId = topic.moduleId;
    const routePath = topic.path ?? (moduleId ? MODULE_PATHS[moduleId] : undefined);
    const features = topic.features.map((feature) => `- ${feature.title}: ${feature.description}`).join('\n');
    const steps = topic.howToStart.map((step, index) => `${index + 1}. ${step}`).join('\n');
    const tips = topic.tips?.length ? `Tippek:\n${topic.tips.map((tip) => `- ${tip}`).join('\n')}` : '';
    const faqs = getTopicFaqs(topic)
      .map((faq) => `K: ${faq.question}\nV: ${faq.answer}`)
      .join('\n\n');

    const overviewChunk: KnowledgeChunk = {
      id: `guide.${topic.id}`,
      area: moduleId ?? topic.id,
      title: topic.title,
      keywords: [...topic.keywords, topic.title, topic.summary, topic.overview],
      path: routePath,
      moduleId,
      body: [topic.summary, topic.overview, steps ? `Első lépések:\n${steps}` : '', features ? `Funkciók:\n${features}` : '', tips, faqs ? `Részletes súgó:\n${faqs}` : '']
        .filter(Boolean)
        .join('\n\n'),
    };

    return [overviewChunk];
  });
}

function coreRulesChunk(): KnowledgeChunk {
  return {
    id: 'core.rules',
    area: 'core',
    title: 'Kritikus app-szabályok',
    keywords: [
      'kategória',
      'kategoriak',
      'excel',
      'import',
      'beállítás',
      'modul',
      'admin',
      'költségvetés',
      'útmutató',
    ],
    body: [
      'Új költségkategória CSAK itt: Beállítások → Modulok → Költségvetés kártya → Kategóriák szekció (admin).',
      'A Költségvetés → + Új tétel NEM hoz létre új kategóriát — csak meglévőből választ.',
      'Költségvetés tömeges Excel/CSV import JELENLEG NINCS az appban.',
      'Hónap másolása: Költségvetés menüben az előző hónap tételeit másolja.',
      'Modulok bekapcsolása: Beállítások → Modulok (admin).',
      'Tag jogosultság: Beállítások → Háztartás.',
      'Webshop import (Shopify, WooCommerce, UNAS): Premium + vállalkozás modul + Beállítások integrációk.',
      'AI pénzügyi funkciók: Premium csomag.',
      'Súgó asszisztens minden bejelentkezett felhasználónak elérhető, nem kell Premium.',
    ].join('\n'),
  };
}

function navigationChunk(): KnowledgeChunk {
  const moduleLines = Object.entries(config.modules.labels).map(([id, label]) => {
    const route = MODULE_PATHS[id as keyof typeof MODULE_PATHS];
    return route ? `- ${label}: ${route} (modul: ${id})` : `- ${label} (modul: ${id})`;
  });

  return {
    id: 'core.navigation',
    area: 'core',
    title: 'Navigáció és útvonalak',
    keywords: ['hol', 'útvonal', 'menü', 'beállítás', 'modul', 'navigáció'],
    body: [
      'Fő útvonalak:',
      '- Irányítópult: /',
      '- Súgó oldal: /help',
      '- Csomagok: /pricing',
      '- Beállítások: /settings',
      '- Beállítások → Profil: /settings?tab=profile',
      '- Beállítások → Háztartás (tagok): /settings?tab=household',
      '- Beállítások → Modulok (kategóriák, modul kapcsolók): /settings?tab=modules',
      '- Beállítások → Előfizetés: /settings?tab=billing',
      '- Visszajelzés: /feedback',
      '',
      'Modulok:',
      ...moduleLines,
    ].join('\n'),
  };
}

function tierChunk(): KnowledgeChunk {
  return {
    id: 'core.tiers',
    area: 'core',
    title: 'Csomagok',
    keywords: ['pro', 'premium', 'ingyenes', 'csomag', 'előfizetés', 'ár'],
    body: [
      'Ingyenes: költségvetés + 1 közös kassza.',
      'Pro: megtakarítás, tartozás, rezsi, közműórák, zsebpénz, biztosítás, bérbeadás, kintlévőség, privát kasszák, rezsimegosztás.',
      'Premium: minden Pro + vállalkozás, webshop importok, AI funkciók, utazástervező, csatolások, SumUp import.',
    ].join('\n'),
  };
}

const helpChunks = Object.entries(HELP as Record<string, Record<string, string>>).flatMap(([area, fields]) =>
  flattenHelp(fields, area),
);

async function main() {
  const getTopicFaqs = await loadTopicFaqs();

  const chunks: KnowledgeChunk[] = [
    coreRulesChunk(),
    navigationChunk(),
    tierChunk(),
    ...guideChunks(getTopicFaqs),
    ...helpChunks,
  ];

  const output = {
    version: 1,
    generated_at: new Date().toISOString(),
    app_name: config.branding.appName,
    chunk_count: chunks.length,
    chunks,
  };

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.resolve(__dirname, '../../backend/config/help_knowledge.json');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${chunks.length} knowledge chunks to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
