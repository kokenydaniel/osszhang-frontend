import config, { type ModuleId } from '@/config/config';

export type HelpTopicId = string;

export type HelpGuideFeature = {
  title: string;
  description: string;
};

export type HelpGuideFaq = {
  id: string;
  question: string;
  answer: string;
};

export type HelpGuideTopic = {
  id: HelpTopicId;
  title: string;
  moduleId?: ModuleId;
  path?: string;
  keywords: string[];
  summary: string;
  overview: string;
  howToStart: string[];
  features: HelpGuideFeature[];
  faqs?: HelpGuideFaq[];
  tips: string[];
};

export const MODULE_PATHS: Record<ModuleId, string> = {
  budget: '/budget',
  savings: '/savings',
  debts: '/debts',
  utilities: '/utilities',
  meters: '/meters',
  business: '/business',
  pocket_money: '/pocket-money',
  insurance: '/insurance',
  rental: '/rental',
  receivables: '/receivables',
  travel_planner: '/tools/travel',
};

const labels = config.modules.labels;

export const HELP_GUIDE_TOPICS: HelpGuideTopic[] = [
  {
    id: 'dashboard',
    title: 'Irányítópult',
    path: '/',
    keywords: ['irányítópult', 'dashboard', 'főoldal', 'áttekintés', 'összefoglaló', 'kezdőlap'],
    summary: 'A háztartás pénzügyi pillanatképe egy helyen.',
    overview:
      'Az irányítópult mutatja az aktuális egyenleget, fizetendő összegeket, megtakarításokat és a bekapcsolt modulok figyelmeztetéseit. A kártyák a kiválasztott kasszához és hónaphoz igazodnak.',
    howToStart: [
      'Válaszd ki a kasszát és a hónapot a fejlécben.',
      'A widget sorrend a Beállítások → Irányítópult menüben állítható.',
      'A színes sávokra kattintva ugorhatsz a részletes modulokhoz.',
    ],
    features: [
      { title: 'Egyenleg és fizetendő', description: 'A költségvetés aktuális pénze és a még nem kifizetett tételek.' },
      { title: 'Figyelmeztetések', description: 'Lejárt számlák, elmaradt bevétel, biztosítás, bérleti díj és AI jelzések.' },
      { title: 'Modul összefoglalók', description: 'Rezsi mérleg, tartozások, vállalkozás bevétel — ha a modul be van kapcsolva.' },
    ],
    tips: [
      'A fejlécben választott kassza és hónap határozza meg, mit látsz — minden kártya ehhez igazodik.',
      'Ha valami hiányzik, ellenőrizd: be van-e kapcsolva a modul, és van-e jogosultságod hozzá.',
      'A figyelmeztetésekre kattintva közvetlenül a részletes modulhoz ugorhatsz.',
    ],
  },
  {
    id: 'budget',
    title: labels.budget,
    moduleId: 'budget',
    path: MODULE_PATHS.budget,
    keywords: ['költségvetés', 'budget', 'bevétel', 'kiadás', 'tranzakció', 'kategória', 'kategóriák', 'címke', 'egyenleg', 'fizetendő', 'marad'],
    summary: 'Bevételek és kiadások havi követése — minden háztartás alapmodulja.',
    overview:
      'A költségvetés modulban rögzíted a havi bevételeket és kiadásokat, kategóriákba sorolod őket, és látod mennyi pénz marad. Ingyenes csomagban is elérhető.',
    howToStart: [
      'Menj a Költségvetés menüpontra a bal oldali sávból.',
      'Adj hozzá bevételt vagy kiadást a „+ Új tétel” gombbal — a kategóriát a listából választod.',
      'Új kategória: Beállítások → Modulok → Költségvetés → Kategóriák (admin).',
      'Jelöld kifizetettnek, ha már rendezted — így frissül az egyenleg.',
    ],
    features: [
      { title: 'Havi és éves nézet', description: 'Hónapról hónapra vagy éves összesítővel dolgozhatsz.' },
      { title: 'Kategóriák', description: 'Saját költségcsoportok a Beállításokban — pl. Élelmiszer, Rezsi, Fizetés.' },
      { title: 'Saját keret', description: 'Előre lefoglalt összeg egy témára (pl. ajándék), ledgerrel követve.' },
      { title: 'AI elemzések', description: 'Premium csomagban: túlköltés okai, fizetési sorrend, spórolási javaslatok.' },
    ],
    tips: ['A „Marad” = egyenleg mínusz fizetendő. Negatív érték túlköltést jelez.', 'Új kategóriát a Beállítások → Modulok menüben veszel fel, nem az új tételnél.'],
  },
  {
    id: 'budget_categories',
    title: 'Költségvetés kategóriák',
    path: '/settings?tab=modules',
    keywords: ['kategória', 'kategóriák', 'címke', 'új kategória', 'költségvetés kategória', 'category'],
    summary: 'Új kategória a Beállításokban — a + Új tétel csak választ a listából.',
    overview:
      'A költségkategóriák a háztartás szintjén, a Beállítások → Modulok → Költségvetés → Kategóriák szekcióban kezelhetők. Új tétel rögzítésekor nem hozol létre kategóriát, csak a meglévők közül választasz.',
    howToStart: [
      'Beállítások → Modulok fül.',
      'Költségvetés kártya → Kategóriák szekció.',
      '„Új kategória” mező — név megadása és hozzáadás.',
      'Költségvetés → + Új tétel → kategória kiválasztása a legördülőből.',
    ],
    features: [
      { title: 'Admin szerkesztés', description: 'Csak a háztartás adminisztrátora adhat hozzá vagy törölhet kategóriát.' },
      { title: 'Színkód', description: 'Kategóriánként állítható szín a költségvetésben.' },
      { title: 'Törlés', description: 'Kategória törlésekor a meglévő tételek megmaradnak.' },
    ],
    tips: [
      'Új kategóriát csak admin hozhat létre — a + Új tétel űrlapon nem lehet.',
      'Érdemes előre gondolkodni a kategóriákon: később is átnevezhető, de a tételek megmaradnak.',
      'Színkóddal gyorsabban felismered a kiadásokat a havi listában.',
    ],
  },
  {
    id: 'savings',
    title: labels.savings,
    moduleId: 'savings',
    path: MODULE_PATHS.savings,
    keywords: ['megtakarítás', 'savings', 'széf', 'cél', 'állampapír', 'bankszámla', 'befektetés'],
    summary: 'Megtakarítási célok, bankszámlák és állampapírok egy helyen.',
    overview:
      'A Megtakarítás modulban nyilvántartod a számláidat, céljaidat és portfóliódat. A Pro csomag része; a háztartásban külön be kell kapcsolni.',
    howToStart: [
      'Beállítások → Modulok: kapcsold be a Megtakarítást.',
      'Menj a Megtakarítások menüpontra.',
      'Hozz létre számlát vagy célt, majd rögzíts befizetést vagy egyenleget.',
    ],
    features: [
      { title: 'Számlák és célok', description: 'Bankszámla, készpénz, megtakarítási cél összeggel és határidővel.' },
      { title: 'Állampapír / befektetés', description: 'Külön portfólió tételek árfolyammal.' },
      { title: 'Havi befizetés', description: 'Tervezett havi összeg a célokhoz.' },
      { title: 'Utazás kapcsolat', description: 'Utazástervezőből menthető megtakarítási célként (Premium).' },
    ],
    tips: [
      'A megtakarítás számlák nem számítanak bele a költségvetés „Marad” összegébe — külön modul.',
      'Állampapírnál add meg a lejáratot, hogy időben emlékeztessen a következő kamatra.',
      'Mozgásokat (befizetés/kivét) mindig rögzítsd — így marad pontos az egyenleg.',
    ],
  },
  {
    id: 'debts',
    title: labels.debts,
    moduleId: 'debts',
    path: MODULE_PATHS.debts,
    keywords: ['tartozás', 'debt', 'hitel', 'kölcsön', 'törlesztés', 'részlet', 'kamatláb'],
    summary: 'Hitelek, kölcsönök és törlesztési ütemezés.',
    overview:
      'A Tartozások modulban követed a hiteleidet, a minimum törlesztéseket és a hátralékot. Pro csomag szükséges.',
    howToStart: [
      'Kapcsold be a modult a Beállítások → Modulok menüben.',
      'Tartozások menü → Új hitel/kölcsön.',
      'Add meg az eredeti összeget, kamatot és törlesztési tervet.',
      'A törlesztéseket a költségvetésbe is szinkronizálhatod.',
    ],
    features: [
      { title: 'Törlesztési terv', description: 'Havi részletek és hátralévő összeg.' },
      { title: 'Dokumentumok', description: 'Szerződés csatolása a hitelhez.' },
      { title: 'AI stratégia', description: 'Premium: hórép vagy göngyöleg javaslat extra befizetéssel.' },
    ],
    tips: [
      'A kamatláb és minimum törlesztés pontossága döntő — így reális a lejárat becslés.',
      'Extra befizetést a stratégia szekcióban modellezheted, mielőtt ténylegesen fizetsz.',
      'Költségvetés-szinkronnal a törlesztés automatikusan megjelenik a havi kiadások között.',
    ],
  },
  {
    id: 'utilities',
    title: labels.utilities,
    moduleId: 'utilities',
    path: MODULE_PATHS.utilities,
    keywords: ['rezsi', 'utilities', 'számla', 'villany', 'gáz', 'víz', 'internet', 'közös költség', 'megosztás'],
    summary: 'Közüzemi számlák, határidők és partnerrel való elszámolás.',
    overview:
      'A Rezsi modulban rögzíted a havi számlákat, követed mi van kifizetve, és opcionálisan megoszthatod a költséget a partnereddel. Pro csomag.',
    howToStart: [
      'Rezsi menüpont → új számla vagy sablon alapján.',
      'Add meg az összeget, határidőt és kifizetőt.',
      'Megosztáshoz: Beállítások → Rezsi partner beállítása.',
    ],
    features: [
      { title: 'Sablonok', description: 'Ismétlődő számlák gyors rögzítése.' },
      { title: 'Rezsi megosztás', description: 'Pro funkció: ki fizette, ki mennyivel tartozik.' },
      { title: 'Költségvetés szinkron', description: 'Kifizetéskor megjelenik a költségvetésben is.' },
    ],
    tips: [
      'Hónap elején másold az előző hónap rezsijét — gyorsabb, mint mindent újra begépelni.',
      'Megosztásnál minden számlánál jelöld, ki fizette — ettől lesz pontos a mérleg.',
      'A „Tartozás rendezése” nem új számla, hanem elszámolás a partnerrel.',
    ],
  },
  {
    id: 'meters',
    title: labels.meters,
    moduleId: 'meters',
    path: MODULE_PATHS.meters,
    keywords: ['közműóra', 'meters', 'mérőóra', 'fogyasztás', 'óraállás', 'leolvasás', 'anomália'],
    summary: 'Mérőóra állások és fogyasztás trendek.',
    overview:
      'A Közműórák modulban hónapról hónapra rögzíted az óraállásokat, látod a fogyasztást és az AI szokatlan értékeket jelezhet. Pro csomag.',
    howToStart: [
      'Közműórák menü → Új mérőóra (név, egység, helyszín).',
      'Minden hónapban rögzíts új leolvasást.',
      'A grafikon mutatja az előző hónapok és év összehasonlítását.',
    ],
    features: [
      { title: 'Fogyasztás számítás', description: 'Automatikus különbség az előző leolvasáshoz képest.' },
      { title: 'AI anomália', description: 'Premium: szokatlan fogyasztás jelzése az átlaghoz képest.' },
    ],
    tips: [
      'Minden hónapban ugyanazon a napon olvasd le az órákat — így összehasonlítható a trend.',
      'Ha az óra visszafelé mutat, ellenőrizd a beírt értéket — gyakori elírás.',
      'Új mérőnél az első leolvasás alapállás — a másodiktól számít a fogyasztás.',
    ],
  },
  {
    id: 'business',
    title: labels.business,
    moduleId: 'business',
    path: MODULE_PATHS.business,
    keywords: ['vállalkozás', 'business', 'webshop', 'shopify', 'rendelés', 'bevétel', 'aam', 'áfa', 'könyvelés'],
    summary: 'Vállalkozás bevételek, rendelések és importok.',
    overview:
      'A Vállalkozás modul webshop rendeléseket, bevételeket és éves kimutatásokat kezel. Premium csomag szükséges.',
    howToStart: [
      'Beállítások → Modulok: Vállalkozás bekapcsolása és név megadása.',
      'Vállalkozás menü → rendelés rögzítése vagy import beállítása.',
      'Shopify / WooCommerce / UNAS: Beállítások → Integrációk (Premium).',
    ],
    features: [
      { title: 'Rendelésnapló', description: 'Manuális és importált rendelések.' },
      { title: 'Éves elemzés', description: 'AAM keret, csatornák, AI éves összefoglaló.' },
      { title: 'Könyvelési ZIP', description: 'Premium: havi dokumentumcsomag letöltése.' },
    ],
    tips: [
      'A rendelés csak akkor számít bevételnek, ha megadod a tényleges befizetés napját.',
      'Webshop import előtt állítsd be az integrációt a Beállításokban — Premium kell hozzá.',
      'Éves nézetben követheted az AAM keretet — ne csak havi forgalmat nézz.',
    ],
  },
  {
    id: 'pocket_money',
    title: labels.pocket_money,
    moduleId: 'pocket_money',
    path: MODULE_PATHS.pocket_money,
    keywords: ['zsebpénz', 'pocket', 'gyerek', 'kamat', 'kiosztás', 'költés'],
    summary: 'Családtagok zsebpénze és kamatozás.',
    overview:
      'A Zsebpénz modulban gyerekek (vagy bármely tag) egyenlegét és mozgásait követed. Pro csomag.',
    howToStart: [
      'Beállítások → Modulok: Zsebpénz be.',
      'Zsebpénz menü → tag hozzáadása, majd kiosztás vagy költés rögzítése.',
      'Kamatozás: a hónap végén jelenik meg a figyelmeztetés.',
    ],
    features: [
      { title: 'Kiosztás / költés / korrekció', description: 'Mozgástípusok külön kezelve.' },
      { title: 'Kamat', description: 'Beállítható százalék és szabályok.' },
    ],
    tips: [
      'Az egyenleg hónap végéig összesít — nem nullázódik minden hónap elején.',
      'Korrekcióval állíthatod a kezdő egyenleget, ha a számított és valós összeg eltér.',
      'Kamatozást a hónap utolsó napjain érdemes rögzíteni — addig változhatnak a költések.',
    ],
  },
  {
    id: 'insurance',
    title: labels.insurance,
    moduleId: 'insurance',
    path: MODULE_PATHS.insurance,
    keywords: ['biztosítás', 'insurance', 'kötvény', 'díj', 'megújítás', 'fedezet'],
    summary: 'Biztosítási szerződések és díjak nyilvántartása.',
    overview:
      'A Biztosítások modulban tárolod a szerződéseket, díjakat és megújítási dátumokat. Pro csomag.',
    howToStart: [
      'Biztosítások menü → Új szerződés.',
      'Add meg a típust, díjat, gyakoriságot és dátumokat.',
      'Opcionálisan kapcsold a költségvetés szinkronhoz.',
    ],
    features: [
      { title: 'Emlékeztető', description: 'Közelgő megújítás az irányítópulton is.' },
      { title: 'Dokumentum', description: 'PDF csatolás Premium csomaggal.' },
    ],
    tips: [
      'Add meg a megújítás és fedezet dátumát — az irányítópulton is megjelenik az emlékeztető.',
      'Költségvetés-szinkronnal a díjak automatikusan bekerülnek a havi kiadások közé.',
      'Díjmentesített szerződésnél ne adj meg fizetendő díjat — felesleges figyelmeztetést kapsz.',
    ],
  },
  {
    id: 'rental',
    title: labels.rental,
    moduleId: 'rental',
    path: MODULE_PATHS.rental,
    keywords: ['bérbeadás', 'rental', 'bérleti', 'ingatlan', 'bérlő', 'kaució'],
    summary: 'Bérbe adott ingatlanok és bevételek.',
    overview:
      'A Bérbeadás modulban ingatlanonként követed a bérleti díjat, közös költséget és befizetéseket. Pro csomag.',
    howToStart: [
      'Bérbeadás menü → Új ingatlan.',
      'Állítsd be a havi díjat és esedékességet.',
      'Befizetéskor rögzítsd a dátumot — szinkronizálható a költségvetésbe.',
    ],
    features: [
      { title: 'Havi tételek', description: 'Bérleti díj és áthárított költség külön.' },
      { title: 'Lejárt figyelmeztetés', description: 'Esedékesség után is nyitott tétel jelzése.' },
    ],
    tips: [
      'A bérleti díj és áthárított közös költség külön tétel — ne keverd a tulajdonosi költséggel.',
      'Befizetés napját mindig rögzítsd — üres mező = még nem érkezett meg a pénz.',
      'Költségvetés-szinkronnal a befizetés bevételként jelenik meg a cashflow-ban.',
    ],
  },
  {
    id: 'receivables',
    title: labels.receivables,
    moduleId: 'receivables',
    path: MODULE_PATHS.receivables,
    keywords: ['kintlévőség', 'receivable', 'kölcsön', 'tartozik', 'visszafizetés', 'előleg'],
    summary: 'Ki mennyivel tartozik neked — magán kölcsönök és előlegek.',
    overview:
      'A Kintlévőség modulban nyilvántartod, kinek adtál pénzt és mennyi a hátralék. Pro csomag.',
    howToStart: [
      'Kintlévőség menü → Új kapcsolat vagy tétel.',
      'Rögzíts kölcsönt vagy előleget, majd a visszafizetéseket.',
    ],
    features: [
      { title: 'Nyitott összeg', description: 'Összesítő az irányítópulton is megjelenik.' },
    ],
    tips: [
      'Minden visszafizetést külön rögzíts — így látszik a hátralék csökkenése.',
      'Előleg és kölcsön külön tételként kezelhető ugyanannál a személynél.',
      'Az irányítópulton összesítve látod, mennyi pénz van még nálad másoknál.',
    ],
  },
  {
    id: 'travel_planner',
    title: labels.travel_planner,
    moduleId: 'travel_planner',
    path: MODULE_PATHS.travel_planner,
    keywords: ['utazás', 'travel', 'útitervező', 'nyaralás', 'költség', 'útvonal', 'pdf'],
    summary: 'AI utazásköltség-tervező és megtakarítási terv.',
    overview:
      'Az Utazástervező AI-val becsüli az utazás költségét, összeveti a pénzügyeiddel, és PDF-et is készíthetsz. Premium csomag.',
    howToStart: [
      'Okos eszközök → Utazástervező menü.',
      'Töltsd ki az űrlapot (úti cél, napok, keret, közlekedés).',
      'Generálás után szerkesztheted a költségeket és letöltheted a PDF-et.',
    ],
    features: [
      { title: 'Költségbontás', description: 'Szállás, étel, közlekedés, programok külön.' },
      { title: 'Belefér elemzés', description: 'Összevetés a megtakarításoddal és havi kapacitással.' },
      { title: 'Megosztás', description: 'Tételenként megosztható költség (pl. két pár).' },
    ],
    tips: [
      'Ha a szállás vagy jegy már megvan, jelöld „megvan” — nem számolja újra a költséget.',
      'A „Belefér” elemzés a Marad + utazásra szánt megtakarítás alapján számol — pillanatkép.',
      'PDF exporttal elmentheted a tervet — hasznos megosztani a társaddal is.',
    ],
  },
  {
    id: 'settings',
    title: 'Beállítások',
    path: '/settings',
    keywords: ['beállítás', 'settings', 'háztartás', 'tag', 'modul', 'előfizetés', 'kategória', 'meghívó'],
    summary: 'Háztartás, tagok, modulok és előfizetés kezelése.',
    overview:
      'A Beállításokban módosítod a háztartás nevét, új tagot adsz hozzá, modulokat kapcsolsz be, és kezeled az előfizetést.',
    howToStart: [
      'Beállítások menü a bal oldali sávból.',
      'Háztartás fül: név, tagok, új fiók létrehozása.',
      'Modulok fül: mely modulok legyenek aktívak.',
      'Előfizetés fül: csomag, számlázás, Stripe portál.',
    ],
    features: [
      { title: 'Tag felvétel', description: 'Admin hozhat létre felhasználónevet és ideiglenes jelszót.' },
      { title: 'Modul kapcsolók', description: 'Pro/Premium modulok csak megfelelő csomaggal használhatók.' },
      { title: 'Integrációk', description: 'Shopify, SumUp stb. — Premium.' },
    ],
    tips: [
      'Modult csak akkor kapcsolj be, ha tényleg használni is fogod — így áttekinthetőbb a menü.',
      'Olvasó szerepkörrel a tag csak megtekinthet — szerkesztéshez admin vagy egyéni jog kell.',
      'Kategóriákat a Modulok fülön, a Költségvetés kártyán belül kezeled.',
    ],
  },
  {
    id: 'subscription',
    title: 'Csomagok és előfizetés',
    path: '/pricing',
    keywords: ['csomag', 'előfizetés', 'pro', 'premium', 'ingyenes', 'ár', 'fizetés', 'stripe', 'upgrade'],
    summary: 'Ingyenes, Pro és Premium csomagok összehasonlítása.',
    overview:
      'Az ingyenes csomagban a költségvetés és egy közös kassza érhető el. A Pro bővíti megtakarítással, tartozással, rezsi modulokkal. A Premium vállalkozást, AI funkciókat és utazástervezőt ad.',
    howToStart: [
      'Menj az Árazás oldalra (/pricing) vagy Beállítások → Előfizetés.',
      'Válaszd ki a havi vagy éves számlázást.',
      'A fizetés Stripe-on keresztül történik.',
    ],
    features: [
      { title: 'Pro', description: 'Privát kasszák, megtakarítás, tartozás, rezsi, órák, zsebpénz, biztosítás, bérbeadás.' },
      { title: 'Premium', description: 'Minden Pro + vállalkozás, importok, AI, utazástervező, csatolások.' },
    ],
    tips: [
      'Pro modul bekapcsolása önmagában nem elég — a csomagodnak is tartalmaznia kell.',
      'Éves előfizetésnél általában kedvezőbb a havi ár — a Beállítások → Előfizetésben választható.',
      'Váltás után az adataid megmaradnak — csak a funkciók érhetők el a csomag szerint.',
    ],
  },
  {
    id: 'wallets',
    title: 'Kasszák (pénztárcák)',
    keywords: ['kassza', 'wallet', 'pénztárca', 'közös', 'privát', 'váltás'],
    summary: 'Közös és privát kasszák a háztartáson belül.',
    overview:
      'A közös kassza mindenkinél elérhető (jogosultságtól függően). A Pro csomag privát kasszákat is engedélyez — saját költségvetés külön.',
    howToStart: [
      'A fejlécben a kassza választóval válthatsz.',
      'Új privát kassza: Pro csomag szükséges.',
      'Minden modul a kiválasztott kasszához kötött adatokat mutat.',
    ],
    features: [
      { title: 'Közös kassza', description: 'Ingyenes csomagban egy közös kassza.' },
      { title: 'Privát kassza', description: 'Pro funkció — korlátlan számú személyes kassza.' },
    ],
    tips: [
      'Minden modul a kiválasztott kassza adatait mutatja — váltás előtt érdemes ellenőrizni.',
      'Privát kassza = teljesen elkülönített költségvetés a közöstől.',
      'Ingyenes csomagban egy közös kassza érhető el — Pro-val korlátlan privát is.',
    ],
  },
  {
    id: 'data_import',
    title: 'Adatimport (Excel, CSV)',
    path: '/budget',
    keywords: ['excel', 'import', 'csv', 'feltöltés', 'tömeges', 'átvitel', 'migráció', 'xlsx'],
    summary: 'Költségvetés Excel/CSV import jelenleg nem elérhető — alternatívák lent.',
    overview:
      'Az appban jelenleg nincs olyan funkció, amellyel egy meglévő Excel fájlból automatikusan feltölthetnéd a teljes költségvetést. A tételeket manuálisan kell felvinni, vagy előző hónapot másolhatsz. Webshop rendelésimport csak a vállalkozás modulban érhető el (Premium).',
    howToStart: [
      'Költségvetés → + Új tétel: bevételek és kiadások egyenként.',
      'Költségvetés → Hónap másolása: ismétlődő tételek átvitele.',
      'Vállalkozás rendelések: Beállítások → Integrációk (Shopify, WooCommerce, UNAS) — Premium.',
    ],
    features: [
      { title: 'Nincs Excel import', description: 'Költségvetés tömeges importja nem támogatott.' },
      { title: 'Hónap klónozás', description: 'Előző hónap tételeinek másolása az aktuális hónapba.' },
      { title: 'Webshop import', description: 'Csak vállalkozás modul, Premium csomag.' },
    ],
    tips: ['Ha sok adatod van, érdemes kategóriánként haladni, vagy egy hónapot kitölteni és azt klónozni.', 'Excel import jelenleg nem elérhető — a hónap másolása a leggyorsabb tömeges megoldás.', 'Webshop import csak vállalkozás modulban működik, Premium csomaggal.'],
  },
];

export function getHelpTopicById(id: HelpTopicId): HelpGuideTopic | undefined {
  return HELP_GUIDE_TOPICS.find((topic) => topic.id === id);
}

export function getHelpTopicsForModule(moduleId: ModuleId): HelpGuideTopic[] {
  return HELP_GUIDE_TOPICS.filter((topic) => topic.moduleId === moduleId);
}
