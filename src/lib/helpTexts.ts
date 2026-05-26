export const HELP = {
  auth: {
    username: 'Egyedi belépési név (kisbetű, szám, aláhúzás). Ezzel lépsz be — nincs e-mail.',
    password: 'A fiókod jelszava. Minimum 8 karakter a regisztrációnál.',
    passwordConfirm: 'Ismételd meg a jelszót — egyeznie kell az előző mezővel.',
    firstName: 'Megjelenik az üdvözlésben és a háztartás taglistájában.',
    lastName: 'Családnév a profilodban.',
    householdName: 'Új háztartás neve — később a Beállításokban módosítható.',
  },

  dashboard: {
    balance:
      'A költségvetésben rögzített egyenleg: bevételek mínusz már kifizetett kiadások. Nem tartalmazza a Széf számláit.',
    payable:
      'Az adott hónapban esedékes, de még nem kifizetett tételek összege (kiadások + rezsi).',
    remaining:
      'Szabad keret a hónap végére: egyenleg mínusz fizetendő. Negatív érték túlköltést jelez.',
    overdue:
      'A határidőn túli, még nem rendezett tételek. Ezeket érdemes előbb kifizetni.',
    wealth:
      'Összes megtakarítás: bankszámlák és állampapírok együtt, tulajdonos szerint bontva.',
    business:
      'A vállalkozás (Little Loom) tárgyhavi árbevétele a rögzített rendelésekből.',
    utilities:
      'Rezsi mérleg: ki mennyit fizetett és ki mennyivel tartozik a partnernek. Megosztás nélkül csak a havi számlák összege.',
    debts:
      'Összes aktív hitel és kölcsön hátraléka (eredeti összeg mínusz eddig törlesztve).',
    aiBriefing:
      'AI által generált heti összefoglaló a háztartás pénzügyeiről — trendek és figyelmeztetések.',
    aiUtilities:
      'A mérőóra-leolvasások és számlák alapján keres szokatlan fogyasztást vagy ugrást.',
  },

  budget: {
    manualBalance:
      'A háztartás jelenlegi pénze (bankszámla + készpénz). A rezsi elszámolás automatikusan módosítja, ha a partner kifizet téged.',
    payable:
      'Ebben a hónapban esedékes, de még nem kifizetett kiadások és rezsi együtt.',
    remaining: 'Becsült szabad keret: jelenlegi egyenleg mínusz a még fizetendő összeg.',
    overdue: 'Lejárt határidőjű, még nyitott tételek — sürgősségi lista.',
    aiOverspend:
      'Túlköltés = negatív havi egyenleg (befolyt bevétel − kifizetett kiadások, rezsivel együtt). A chip-ek a legnagyobb kiadási kategóriákat mutatják, nem magát a túlköltés összeget.',
    categorySummary: 'Kategóriánkénti összesítés — hol mennyit költöttél eddig ebben a hónapban.',
    description: 'Rövid megnevezés a tételről (pl. „Lidl”, „Netflix”).',
    category: 'Költségkategória — a beállításokban szerkeszthető lista.',
    amount: 'Összeg forintban. Kiadásnál negatív előjel nem kell.',
    date: 'Mikor esedékes vagy mikor történt a tranzakció.',
    paidDate: 'Ha kitöltöd, a tétel kifizetettnek számít és nem jelenik meg a fizetendő listában.',
    statusToggle:
      'Kattints a státuszra: függőben ↔ kifizetve váltás egy érintéssel. A kifizetés napja automatikusan a mai dátum lesz.',
    cloneMonth:
      'Az előző hónap költségvetési tételeit másolja a kiválasztott hónapra (esedékesség napja megmarad). Minden másolat függőben marad.',
    ledgerAmount: 'Mennyit használtál fel ebből a keretből / előlegből.',
    ledgerNote: 'Opcionális megjegyzés a ledger bejegyzéshez.',
    txTypeIntro:
      'Válaszd ki, hogyan számítson a tétel a havi cashflow-ba. A választás után is látszik a rövid magyarázat — mobilon is.',
    expenseNormal:
      'Közvetlen kiadás: a teljes összeg a „Fizetendő” / „Marad” számításban szerepel, amíg ki nem fizeted. Nem kell külön ledger tételeket rögzíteni.',
    expenseLedger:
      'Előre lekötött keret (pl. heti bevásárlás): a tétel összege a keret plafon. A tényleges költést később „ledger” bejegyzésekkel követed; addig nem „fogy el” egyszerre a cashflow-ból.',
    incomeNormal:
      'Bevétel, ami növeli a költhető egyenleget, ha kifizetettnek jelölöd (pl. fizetés, visszatérítés).',
    incomeReserve:
      'Pénz, amit ebben a hónapban félreteszel — külön „Tartalékok” listában jelenik meg. Nem növeli a cashflow „Marad” összegét, és nem helyettesíti a Megtakarítások bankszámláit.',
    reserveWarning:
      'Tartalék ≠ megtakarítás számla. Ha bankszámlán / állampapíron van a pénz, azt a Megtakarítások modulban kövesd.',
    ledgerModalIntro:
      'A saját keretes kiadásnál itt rögzíted a tényleges felhasználást. A keret összege nem változik ettől — csak a „felhasználva” sáv nő.',
  },

  debts: {
    remaining:
      'Minden aktív tartozás hátraléka: eredeti összeg − eddig törlesztve. A táblázatban látható részletekkel.',
    monthlyMin:
      'Az összes hitel havi minimum/részlet összege — ezt érdemes a költségvetésben is követni.',
    payoffEstimate:
      'Ha csak a megadott havi részletet fizeted, mikor fut ki utoljára egy hitel. Ha a kamatot nem fedi a részlet, „nincs vége” jelenik meg.',
    monthlyInterest:
      'Becsült kamat, ha a jelenlegi minimumot fizeted — összehasonlításhoz az extra befizetéseknél.',
    progress:
      'Az összes tartozásból eddig visszafizetett arány: összes törlesztve / eredeti összeg.',
    strategy:
      'Avalanche: legmagasabb kamat először (olcsóbb összesen). Snowball: legkisebb hátralék először (gyors sikerélmény).',
    strategyOrder:
      'A kiválasztott stratégia szerinti ajánlott sorrend — melyik tartozást érdemes előbb extra befizetéssel támadni.',
    extraPayment:
      'Mennyivel többet fizetsz a stratégia szerinti első hitelre a minimumon felül — reális összegeket adj meg (pl. +10–50 e Ft).',
    name: 'Felismerhető név: pl. Lakáshitel, Autóhitel, Hitelkártya.',
    targetAmount: 'A hitel eredeti főösszege vagy jelenlegi teljes tartozása forintban.',
    paidAmount: 'Eddig visszafizetett összeg. A hátralék = eredeti − eddig törlesztve.',
    interestRate:
      'Éves kamatláb százalékban (THM-hez közel). A lejárat és kamatköltség számításához kell.',
    minimumPayment:
      'A bank által előírt havi törlesztő/részlet. Ha kisebb, mint a havi kamat, a tartozás nem csökken.',
    dueDay: 'A hónap melyik napján esedékes a törlesztés (1–31). Költségvetés-emlékeztetőhöz.',
    payAmount: 'Most befizetett összeg — növeli az „eddig törlesztve” mezőt.',
    payDate: 'A befizetés dátuma.',
    payNote: 'Opcionális megjegyzés a törlesztéshez (pl. „Júniusi részlet”).',
    payBudget:
      'Ha be van pipálva, ugyanakkor kiadásként is rögzíti a költségvetésben a kiválasztott kategóriával.',
    payCategory: 'Melyik költségkategóriába kerüljön a törlesztés a cashflow-ban.',
  },

  savings: {
    personal:
      'Saját és közös bankszámlák egyenlege — nem tartalmazza a Little Loom számlákat.',
    wife: 'A vállalkozáshoz / feleséghez kötött számlák és papírok összege.',
    totalWealth: 'Számlák + állampapírok együtt, minden tulajdonosra.',
    investRatio: 'Az állampapírok aránya a teljes vagyonban — likvid vs. lekötött.',
    accountName: 'Bank vagy számla neve (pl. OTP megtakarítás, Revolut).',
    currency: 'A számla pénzneme. Az árfolyam a fejlécben állítható.',
    owner: 'Kié a számla: saját, közös, vagy Little Loom.',
    invName: 'Papír megnevezése (pl. PEMÁP 2028, FixMÁP).',
    invType: 'Állampapír típusa — befolyásolja a kamatszámítást.',
    principal: 'Befektetett tőke összege vásárláskor.',
    maturityAmount: 'Lejáratkor várható kifizetés, ha ismert.',
    invRate: 'Éves hozam / kamat százalékban — becsléshez és dashboard emlékeztetőhöz.',
    purchaseDate: 'Mikor vásároltad a papírt.',
    maturityDate: 'Lejárat dátuma — opcionális, emlékeztetőhöz.',
    payoutAmount: 'FixMÁP-hoz hasonló: következő kamatkifizetés összege.',
    payoutDate: 'Következő kamat vagy kupon dátuma.',
    historyAmount: 'Befizetés (+) vagy kivét (−) — módosítja a számla egyenlegét.',
    historyNote: 'Opcionális megjegyzés a mozgáshoz.',
    historyEdit: 'Korábbi tétel javítása: szerkesztés gomb, majd Mentés. Törlés a kuka ikonnal.',
  },

  utilities: {
    balance:
      'Ki mennyivel tartozik a másiknak ebben a hónapban. A „Tartozás rendezése” rögzíti az elszámolást (nem új rezsi sor), és a költségvetésben bevételként vagy kiadásként jelenik meg.',
    settlementRecord:
      'A hónap rezsi-tartozása rendezve. A költségvetésben külön „Rezsi elszámolás” tételként látszik — bevétel, ha a partner fizetett neked; kiadás, ha te fizettél neki.',
    wePaid: 'Ti általatok befizetett közüzemi és egyéb rezsi összege.',
    partnerPaid: 'A partner által befizetett összeg ebben a hónapban.',
    totalBills: 'Összes rögzített rezsi tétel a kiválasztott hónapban.',
    paid: 'Már kifizetett (paidDate) rezsi tételek összege ebben a hónapban.',
    waiting: 'Még nyitott, fizetendő rezsik összege ebben a hónapban.',
    readiness: 'A hónap rezsitételeinek hány százalékát rendezték már kifizetésként.',
    cloneMonth:
      'Az előző hónap rezsi tételeit másolja a kiválasztott hónapra: ugyanaz a megnevezés, összeg, határidő napja és megosztás. Fizető és kifizetés üresen marad.',
    utilityTemplates:
      'Új hónap kitöltéséhez sablon: megnevezés, becsült összeg, esedékesség napja, megosztás. Üres lista = csak múlt havi másolás vagy kézi rögzítés.',
    payerSelect:
      'Kattints a legördülőre: ki fizette a számlát? Függőbenre állítva törlődik a kifizetés.',
    statusToggle:
      'Kattints a státuszra: várakozik ↔ kész. A kifizetés napja automatikusan a mai dátum.',
    aiAnomaly:
      'Összeveti a korábbi hónapok fogyasztását/számláit — szokatlanul magas tételnél figyelmeztet.',
    billType: 'Közüzemi típus: villany, gáz, víz, szemét, egyéb.',
    billAmount: 'A számla végösszege forintban.',
    billDue: 'Fizetési határidő — megjelenik a fizetendő listában is.',
    settlement:
      'Ki viseli ezt a számlát? Ez határozza meg a rezsi-mérleget és hogy kinél jelenik meg költésként.',
    settlementIntro:
      'Rezsi megosztás be van kapcsolva — válaszd ki, ki fizeti ezt a konkrét számlát. A magyarázat mindig látható.',
    settlementShared:
      'Közös költség: a teljes összeg fele-fele számít. Mindketten „fizettetek” a saját felezett részt, a havi rezsi-mérlegben is ez jelenik meg.',
    settlementMine:
      'Te fizeted a teljes számlát egyedül — a teljes összeg a te oldaladon költésként, a partner felé tartozás jelezhető a mérlegben.',
    settlementPartner:
      'A partner fizeti a teljes számlát — nálad ez nem számít közvetlen költésnek, csak nyilvántartás és a mérleg számára.',
  },

  meters: {
    chart: 'Mérőóra állások időbeli alakulása — ugrás vagy csökkenés is látszik.',
    aiAnomaly: 'AI keres szokatlan fogyasztási mintát az elmúlt leolvasások alapján.',
    meterSelect: 'Melyik mérőhöz tartozik a leolvasás (villany, gáz, víz…).',
    readingDate: 'Mikor olvastad le az órát.',
    readingValue: 'Az óra aktuális állása a megadott mértékegységben (kWh, m³…).',
    estimateYear: 'Melyik év fogyasztását becsüljük.',
    estimateMonth: 'Melyik hónap — az elmúlt leolvasások trendjéből számol.',
    newMeterName: 'Felismerhető név (pl. „Villany főóra”).',
    newMeterUnit: 'Mértékegység: kWh, m³, GJ stb.',
    newMeterLocation: 'Hol van az óra (pl. pince, garázs) — csak megjegyzés.',
  },

  business: {
    monthlyRevenue: 'A kiválasztott hónapban rögzített rendelések összértéke.',
    paid: 'Már beérkezett / lekönyvelt összeg (kifizetve státusz).',
    pending: 'Még nem teljesült befizetés — kintlévőség.',
    margin: 'Bevétel mínusz becsült költség — ha van költség mező.',
    aiStrategist: 'AI elemzi a csatornákat és a kintlévőséget — javaslatokkal.',
    orderDate: 'Rendelés vagy számla dátuma.',
    customer: 'Vevő vagy megrendelő neve.',
    orderAmount: 'Rendelés bruttó összege forintban.',
    channel: 'Honnan jött: webshop, piactér, egyéb csatorna.',
    paymentMethod: 'Utalás, kártya, utánvét stb.',
    provider: 'Fizetési szolgáltató (Barion, Stripe…), ha van.',
    destination: 'Hová érkezett a pénz: bankszámla vagy platform.',
    paidDateBiz: 'Tényleges kifizetés napja — ettől számít „beérkezettnek”.',
    invoiceNumber: 'Számla sorszáma könyveléshez.',
    paymentSection: 'Mikor érkezett meg a pénz és milyen számla tartozik hozzá — ettől lesz „beérkezett” a rendelés.',
    conversion:
      'A havi rendelések hány százalékánál érkezett meg a befizetés (RENDBEN / kifizetve státusz).',
    ytd: 'Year-to-date: az adott év elejétől összes rögzített forgalom.',
    aov: 'Average Order Value — átlagos rendelési érték: forgalom / rendelésszám.',
    topChannel: 'Legnagyobb árbevételű értékesítési csatorna az időszakban.',
    channelCount: 'Hány különböző értékesítési csatornán volt eladás.',
  },

  settings: {
    firstName: 'Megjelenik a háztartás tagjai előtt és az üdvözlésben.',
    lastName: 'Családnév — profil és meghívások.',
    username: 'Belépési név — csak az admin módosíthatja új fiók létrehozásával.',
    password: 'Legalább 8 karakter. A mentés után azonnal érvényes.',
    passwordConfirm: 'Ismételd meg az új jelszót — egyeznie kell.',
    householdName: 'A háztartás neve a felületen és meghívásoknál.',
    businessName: 'Vállalkozás megjelenő neve (pl. Little Loom).',
    shopifyUrl:
      'A bolt admin címe, pl. bolt-neve.myshopify.com — a Shopify Admin → Beállítások → Bolt részletei alatt találod.',
    shopifyToken:
      'Shopify Admin API hozzáférési token (shpat_… előtaggal). A Shopify Adminban: Beállítások → Alkalmazások és értékesítési csatornák → Alkalmazások fejlesztése → Alkalmazás létrehozása → Admin API jogosultságok (orders olvasás) → Token telepítése / megtekintése. Csak a szerveren tároljuk titkosítva, soha ne oszd meg nyilvánosan.',
    splitPartner: 'Rezsi megosztásnál a másik fél háztartási tagja.',
    inviteUsername: 'Az új tag ezzel a felhasználónévvel lép be (kisbetű, pl. ildi).',
    invitePassword: 'Ideiglenes jelszó — első belépés után érdemes cserélni.',
    inviteRole: 'Admin: minden modul. Olvasó: csak megtekintés. Egyéni: modulonkénti jog.',
    invitePermissions: 'Mely modulokat láthatja az új tag (ha nem admin).',
    categoryName: 'Költségkategória neve a költségvetésben.',
    deleteHousehold:
      'Véglegesen törli a háztartást, az összes pénzügyi adatot és minden családtag fiókját. Nem vonható vissza.',
  },
} as const;
