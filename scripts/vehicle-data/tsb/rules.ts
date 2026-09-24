/**
 * TSB tip adlarını ayrıştırmak için sözlükler. Hepsi TSB'nin kendi yazımına
 * göre (BÜYÜK HARF, Türkçe karaktersiz) tutulur; karşılaştırma öncesi metin
 * fold() ile aynı biçime getirilir.
 *
 * İlke: bir sözlük bir alanı ancak KESİN biliyorsa doldurur. Emin olunmayan
 * alan boş kalır ve Araç Öner'de kullanıcıya sorulur.
 */

export const fold = (s: string) =>
  s
    .toLocaleUpperCase("tr")
    .replace(/Ç/g, "C").replace(/Ğ/g, "G").replace(/İ/g, "I").replace(/Ö/g, "O")
    .replace(/Ş/g, "S").replace(/Ü/g, "U").replace(/Ë/g, "E").replace(/Â/g, "A")
    .replace(/\s+/g, " ")
    .trim();

// ─── Kaynak düzeltmeleri ─────────────────────────────────────────────────
/**
 * TSB listesindeki yazım hataları (kelime bazında). Her düzeltme raporda
 * sayısıyla listelenir — kaynağı sessizce değiştirmiyoruz.
 */
export const TYPO_FIXES: Record<string, string> = {
  STEVIO: "STELVIO", CHALLANGER: "CHALLENGER", LATITUTE: "LATITUDE", QUATTROPRTE: "QUATTROPORTE",
  PANEMERA: "PANAMERA", TOURAEG: "TOUAREG", HIGHLINDER: "HIGHLANDER", ALHAMRA: "ALHAMBRA",
  "C-ELLYSE": "C-ELYSEE", MIINI: "MINI", COOOPER: "COOPER", SAVY: "SAVVY", PREMIIUM: "PREMIUM",
  ABART: "ABARTH", MULTIDRIVRE: "MULTIDRIVE", "T.PORTER": "TRANSPORTER", BLUHDI: "BLUEHDI",
  // Sık tekrarlandığı için otomatik ayırıcıya takılmayan bitişik yazımlar (değerde boşluk = bölme)
  C5AIRCROSS: "C5 AIRCROSS", C3AIRCROSS: "C3 AIRCROSS", TOURNEOCUSTOM: "TOURNEO CUSTOM", TRANSITVAN: "TRANSIT VAN",
  TRANSITCUSTOM: "TRANSIT CUSTOM", ECOBLUE170: "ECOBLUE 170", "1.5BLUEHDI": "1.5 BLUEHDI", "2.0TFSI": "2.0 TFSI",
  OZELSERI: "OZEL SERI", SPECIALEDITION: "SPECIAL EDITION", MULTIAIR2: "MULTIAIR", "U.TREND": "UZUN TREND",
  MSPORT: "M SPORT", "3008ACTIVELIFE": "3008 ACTIVE LIFE", CROSSLANDX: "CROSSLAND X", INSIGNIASPORTTOURER: "INSIGNIA SPORTS TOURER",
  TIGUANALLSPACE: "TIGUAN ALLSPACE", TRANSPORTERCAMLIVAN: "TRANSPORTER CAMLIVAN", CRAFTERPANELVAN: "CRAFTER PANELVAN",
  L200KAMYONET: "L200 KAMYONET", DAILYVAN: "DAILY VAN", DAILYCIFT: "DAILY CIFT", DAILYCIFTKABIN: "DAILY CIFT KABIN",
  BOXERVAN: "BOXER VAN", PRATICOPLUS: "PRATICO PLUS", TRANSPORTERCITYVAN: "TRANSPORTER CITYVAN",
  TOURNEOCOURIER: "TOURNEO COURIER", TOURNEOCOURIERKOMBI: "TOURNEO COURIER KOMBI", TOURNEOCONNECTKOMBI: "TOURNEO CONNECT KOMBI",
  TRANSITCUSTOMKOMBIVAN: "TRANSIT CUSTOM KOMBI VAN", TRANSITCUSTOMVAN: "TRANSIT CUSTOM VAN", TRANSITCUSTOMKOMBI: "TRANSIT CUSTOM KOMBI",
  TRANSITCUSTOMKOMBIVANECOBLUE170: "TRANSIT CUSTOM KOMBI VAN ECOBLUE 170", TRANSITKAMYONET: "TRANSIT KAMYONET",
  TRANSITVAN350LF: "TRANSIT VAN 350LF", TRANSITVAN350MF: "TRANSIT VAN 350MF", "T.CUSTOMKOMBI": "TRANSIT CUSTOM KOMBI",
  "T.CUSTOMKOMBIVAN": "TRANSIT CUSTOM KOMBI VAN", TITANIUMPLUS: "TITANIUM PLUS", UPGRADE170TREND: "UPGRADE 170 TREND",
  CIFTKABINKAMYONET: "CIFT KABIN KAMYONET", TEKKABINSASI: "TEK KABIN SASI", KAPALIKASAKAMYONET: "KAPALI KASA KAMYONET",
  UZUNTRENDKASALI: "UZUN TREND KASALI", ORTATRENDKAS: "ORTA TREND KASALI", BLUEFFICIENCY: "BLUEEFFICIENCY",
  BLUEEFICIENCY: "BLUEEFFICIENCY", BLUEEFFICIENY: "BLUEEFFICIENCY", COMFORTLINEDSG: "COMFORTLINE DSG",
  ESSENTIAL4WD: "ESSENTIAL 4WD", SPORTSTOURER: "SPORTS TOURER", MINICOOPERCOUNTRYMANALL4: "MINI COOPER COUNTRYMAN ALL4",
  MINICOOOPERCOUNTRYMAN: "MINI COOPER COUNTRYMAN", JCWCOUNTRYMAN: "JCW COUNTRYMAN", PRIMEEDITION: "PRIME EDITION",
  GRANDCONFORT: "GRAND CONFORT", C4PICASSO: "C4 PICASSO", GRANDCHEROKEE: "GRAND CHEROKEE",
  C3AIRCROSSSHINE: "C3 AIRCROSS SHINE", C3AIRCROSSEXCLUSIVE: "C3 AIRCROSS EXCLUSIVE", C5AIRCROSSSHINEBOLD: "C5 AIRCROSS SHINE BOLD",
  C5AIRCROSSFEELADVENTURE: "C5 AIRCROSS FEEL ADVENTURE", C5AIRCROSSSELECTIONBUSINESS: "C5 AIRCROSS SELECTION BUSINESS",
  JEEPGRANDCHEROKEENIGTHEAGLE: "JEEP GRAND CHEROKEE NIGHT EAGLE", JEEPGRANDCHEROKEEOVERLAND: "JEEP GRAND CHEROKEE OVERLAND",
  JEEPGRANDCHEROKEELIMITED: "JEEP GRAND CHEROKEE LIMITED", JEEPGRANDCHEROKEE: "JEEP GRAND CHEROKEE", JEEPRENEGADE: "JEEP RENEGADE",
  A5SPORTBACK: "A5 SPORTBACK", Q5SPORTBACK: "Q5 SPORTBACK", DS7CROSSBACK: "DS 7 CROSSBACK",
  EXPERTTRAVELLERMINIBUS: "EXPERT TRAVELLER MINIBUS", "EXPERTTRAVELLERMINIBUS9+1": "EXPERT TRAVELLER MINIBUS 9+1",
  BOXERVANDYNAMICPLUS: "BOXER VAN DYNAMIC PLUS", BOXERMINIBUSPERSONEL: "BOXER MINIBUS PERSONEL", BOXERMINIBUSOKUL: "BOXER MINIBUS OKUL",
  KANGOOEXPRESSFRIGOMAXI: "KANGOO EXPRESS FRIGO MAXI", TRAFICMULTIX: "TRAFIC MULTIX", TRAFICPANELVAN: "TRAFIC PANELVAN",
  TRAFICPANELVANGRANDCONFORT: "TRAFIC PANELVAN GRAND CONFORT", SPRINTERKAMYONETORTA: "SPRINTER KAMYONET ORTA",
  "SPRINTERSASIK.NETUZUN": "SPRINTER SASI K.NET UZUN", SPRINTERSASIKAMYONUZUN: "SPRINTER SASI KAMYONET UZUN",
  "SPRINTERPANELVANEKSTRAUZUN5.0T": "SPRINTER PANELVAN EKSTRA UZUN 5.0T", "SPRINTERPANELVANEKSTRAUZUN5.5T": "SPRINTER PANELVAN EKSTRA UZUN 5.5T",
  TRANSITMINIBUS: "TRANSIT MINIBUS", "TR.CIFTKABINKAMYONETECOBLUE": "TRANSIT CIFT KABIN KAMYONET ECOBLUE",
  "TR.TEKKABINKAMYONET": "TRANSIT TEK KABIN KAMYONET", "TR.CIFT": "TRANSIT CIFT", "TR.350L": "TRANSIT 350L", TRANSIT350: "TRANSIT 350",
  TRANSIT350E: "TRANSIT 350E", TIGGO3: "TIGGO 3",
  // Kasa yazım hataları (kullanıcı denetimi: "Z4 ROADSTAR" → kasa Roadster, paket yalnız Exclusive)
  ROADSTAR: "ROADSTER", ROASTAR: "ROADSTER", RADSTER: "ROADSTER", CABROLET: "CABRIOLET", CABRILET: "CABRIOLET",
  SPORTYWAGON: "SPORTWAGON", SPORTOURER: "SPORT TOURER", GRANCOUPE: "GRAN COUPE", CIFTKABIN: "CIFT KABIN",
  "3KAPI": "3 KAPI", "5KAPI": "5 KAPI", KANYONET: "KAMYONET", "K.KAMYONET": "KAPALI KASA KAMYONET",
  MININUS: "MINIBUS", MINIBUSU: "MINIBUS", "PAN.VAN": "PANELVAN", "SERV›S": "SERVIS",
  // Vites yazım hataları
  GEARTONIC: "GEARTRONIC", GEARTRON: "GEARTRONIC", GEARTRONI: "GEARTRONIC", GEATRONIC: "GEARTRONIC",
  GEARRONIC: "GEARTRONIC", GARTRONIC: "GEARTRONIC", POWERSSHIFT: "POWERSHIFT", POWERSIFT: "POWERSHIFT",
  POWESHIFT: "POWERSHIFT", PWERSHIFT: "POWERSHIFT", POWERSHI: "POWERSHIFT", DUALOG: "DUALOGIC", DUALOGI: "DUALOGIC",
  DULOGIC: "DUALOGIC", TIPTRONI: "TIPTRONIC", TIPTRON: "TIPTRONIC", TIPTRINIC: "TIPTRONIC", "T.TRONIC": "TIPTRONIC",
  MULTRONIC: "MULTITRONIC",
  // Motor/yakıt yazım hataları
  BLUTEC: "BLUETEC", BUEHDI: "BLUEHDI", LUEHDI: "BLUEHDI", PURETCH: "PURETECH", PURETCEH: "PURETECH", PURECH: "PURETECH",
  EOBLUE: "ECOBLUE", ECOB00ST: "ECOBOOST", "E.BOOST": "ECOBOOST", "EC0-G": "ECO-G", MULTIAR: "MULTIAIR", MULTIAR2: "MULTIAIR",
  "T.JET": "T-JET", HIBRID: "HYBRID", EHYBRID: "E-HYBRID", "P.HYBRID": "PHEV", "F.HYBRID": "HYBRID", "M.HYBRID": "MHEV",
  PLUGIN: "PLUG-IN", QUATTO: "QUATTRO", QUATTROS: "QUATTRO", XRIVE: "XDRIVE", "4-MATIC": "4MATIC", "M.ET": "M.JET", ULTIMTE: "ULTIMATE", "9G-TR0NIC": "9G-TRONIC", "7G-TR0NIC": "7G-TRONIC",
};

/** Tip adının BAŞINDA gelirse atılan işaretler (model değişikliği vb.). Emisyon kodları burada YOK — "E5" DFSK'da modeldir. */
export const START_NOISE_RE = /^(MC|MCA|NEW|YENI|MY)$/;

/** Otomatik ayırıcının bölmemesi gereken, gerçekten tek kelime olan adlar. */
export const DEGLUE_EXCEPTIONS = new Set([
  "HIGHLANDER", "CLASSICA", "COMFORTMATIC", "SPORTLINE", "LUXURYLINE", "HIGHLINE", "TRENDLINE", "COMFORTLINE",
  "PANORAMIC", "SPORTWAGON", "GRANDTOUR", "SPORTBACK", "COUNTRYMAN", "CROSSBACK", "SPACETOURER", "AIRCROSS",
  "PRIMASTAR", "AUTOBIOGRAPHY", "SVAUTOBIOGRAPHY", "SUPERCHARGED", "QUATTROPORTE", "ANNIVERSARIO", "COMPETIZIONE",
  "SUPERLEGGERA", "STREETFIGHTER", "COUNTRYTOURER", "CROSSCOUNTRY", "BLUEEFFICIENCY", "PERFORMANCE+", "PROGRESSIVE+",
]);

// ─── Marka ────────────────────────────────────────────────────────────────

/** TSB marka adı → katalog marka adı. Listede olmayan TSB markaları başlık biçimine çevrilir. */
export const BRAND_MAP: Record<string, string> = {
  "TOFAS-FIAT": "Fiat", FIAT: "Fiat",
  "RENAULT (OYAK)": "Renault", RENAULT: "Renault",
  "VOLVO-TR": "Volvo", VOLVO: "Volvo",
  "RANGE ROVER": "Land Rover", "LAND ROVER": "Land Rover",
  MERCEDES: "Mercedes-Benz",
  "OTOYOL\\IVECO\\FIAT": "Iveco",
  "FORD /USA": "Ford", "DODGE/USA": "Dodge",
  SSANGYONG: "SsangYong", KGMOBILITY: "KGM",
  "ALFA ROMEO": "Alfa Romeo", "ASTON MARTIN": "Aston Martin", "ROLLS-ROYCE": "Rolls-Royce",
  "LYNK-CO": "Lynk & Co", "TRUMPCHI/GAC": "GAC", "FARIZON AUTO": "Farizon",
  BMW: "BMW", DS: "DS", MG: "MG", TOGG: "TOGG", GMC: "GMC", BYD: "BYD", DFSK: "DFSK", DFM: "DFM",
  SEAT: "SEAT", MINI: "Mini", LEVC: "LEVC", SWM: "SWM", FAW: "FAW", JAC: "JAC", XEV: "XEV", IKCO: "IKCO",
  KTM: "KTM", GAZ: "GAZ", MCLAREN: "McLaren",
};

/**
 * Bir TSB markası altında başka markanın araçları: tip adının ilk kelimesi
 * alt markayı söylüyorsa marka değiştirilir. `keep: true` ise kelime model
 * adının parçası olarak kalır ("OMODA 5").
 */
export const SUB_BRANDS: Record<string, Record<string, { make: string; keep?: boolean }>> = {
  CHRYSLER: { JEEP: { make: "Jeep" }, DODGE: { make: "Dodge" }, LANCIA: { make: "Lancia" } },
  FIAT: { ABARTH: { make: "Abarth" } },
  "TOFAS-FIAT": { ABARTH: { make: "Abarth" } },
  CHERY: { OMODA: { make: "Omoda", keep: true }, JAECOO: { make: "Jaecoo", keep: true } },
  MITSUBISHI: { FUSO: { make: "Fuso" } },
  RENAULT: { ALPINE: { make: "Alpine" } },
  "RENAULT (OYAK)": { ALPINE: { make: "Alpine" } },
  TOYOTA: { LEXUS: { make: "Lexus" } },
};

/** Binek/hafif ticari olmayan ya da ayrı kategoride işlenen TSB markaları. */
export const EXCLUDED_BRANDS = new Set([
  // Ayrı kategoriler (motosiklet/karavan ayrıca işlenecek)
  "MOTORSIKLET", "ZIRAI TRAKTOR",
  "ADRIA", "KNAUS", "HYMER", "HOBBY", "CARTHAGO", "LAIKA", "WEINSBERG",
  // Ağır vasıta, otobüs, iş makinesi, üstyapı, özel amaçlı araç
  "MAN", "SCANIA", "DAF", "OTOKAR/MAGIRUS", "TEMSA", "NEOPLAN", "SETRA", "TATRA",
  "KAMAZ", "SANY", "ASTRA", "AVIA", "MENARINIBUS", "BREDAMENARIBUS", "CRRC",
  "KENWORTH", "IRIZAR", "SOLARIS", "SINOTRUK", "GROVE", "ZOOMLION", "TADANO FAUN",
  "MAZ", "SITRAK", "BMC", "GULERYUZ", "HABAS", "ISOBUS", "BOZANKAYA", "TEZELLER",
  "AKIA", "VICTORY", "MULTICAR", "SCHMIDT", "MILLER", "PIMAKINA", "HISCAR", "HBS",
  "TCV", "VEICOLI", "ETRUSCO", "REEDER", "KOMI", "FEST", "NIEVE", "POLESTONES", "EMT",
  "ALKE", "PILOTCAR", "ULTRAND", "RELIVE", "TURKKAR", "TURKAR", "CENNTRO", "PIAGGIO",
  "HOTOMOBIL", // Crafter/Ducato tabanlı karavan dönüşümleri
]);

/** Marka altındaki ağır vasıta/otobüs/özel amaçlı tipler. */
export const HEAVY_RE =
  /\b(CEKICI|OTOBUS|MIDIBUS|KAMYON|TRAKTOR|DAMPER|BETON|MIKSER|VINC|ITFAIYE|COP|AMBULANS|CENAZE|TRAKKER|T-WAY|MORELO|MOTOKARAVAN|KARAVAN)\b/;
// "KAMYON" tek kelime ağır vasıtadır; "KAMYONET" \b sayesinde eşleşmez.

// ─── Model ────────────────────────────────────────────────────────────────

/**
 * Birden fazla kelimeden oluşan model adları (marka bazında). Tip adının
 * başında en uzun eşleşme model sayılır; eşleşme yoksa ilk kelime modeldir.
 */
export const MULTI_WORD_MODELS: Record<string, string[]> = {
  Fiat: ["500 C", "PUNTO EVO", "GRANDE PUNTO", "GRANDE PANDA", "EGEA CROSS", "500 L", "NEW DOBLO", "DOBLO CARGO", "DOBLO COMBI", "FIORINO COMBI", "FIORINO CARGO", "MY FIORINO"],
  Ford: ["TRANSIT CONNECT", "TRANSIT CUSTOM", "TRANSIT COURIER", "TOURNEO CONNECT", "TOURNEO CUSTOM", "TOURNEO COURIER", "GRAND TOURNEO", "GRAND C-MAX", "MUSTANG MACH-E", "F 150", "F 550", "E-TRANSIT", "E-TOURNEO"],
  Renault: ["GRAND ESPACE", "GRAND SCENIC", "CLIO SPORT TOURER", "MEGANE E-TECH", "SCENIC E-TECH", "GRAND KANGOO", "KANGOO EXPRESS"],
  Suzuki: ["GRAND VITARA", "SX4 S-CROSS"],
  Tesla: ["MODEL S", "MODEL 3", "MODEL X", "MODEL Y"],
  "Land Rover": ["RANGE ROVER SPORT", "RANGE ROVER EVOQUE", "RANGE ROVER VELAR", "RANGE ROVER", "DISCOVERY SPORT", "FREELANDER 2"],
  Toyota: ["LAND CRUISER", "COROLLA CROSS", "YARIS CROSS", "URBAN CRUISER", "PROACE CITY", "PROACE VERSO"],
  Kia: ["PRO CEED", "PRO_CEED"],
  Hyundai: ["GRAND SANTA FE", "SANTA FE", "IONIQ 5", "IONIQ 6", "IONIQ 9", "GENESIS COUPE"],
  Citroen: ["C4 PICASSO", "GRAND C4 PICASSO", "C4 SPACETOURER", "GRAND C4 SPACETOURER", "C4 CACTUS", "C4 X", "C5 AIRCROSS", "C5 X", "C3 AIRCROSS", "C3 PICASSO"],
  Peugeot: ["PARTNER TEPEE", "BIPPER TEPEE"],
  Opel: ["COMBO LIFE", "COMBO CARGO", "GRANDLAND X", "CROSSLAND X", "MOKKA X", "ZAFIRA LIFE", "VIVARO LIFE", "ZAFIRA TOURER"],
  Volkswagen: ["GOLF SPORTSVAN", "PASSAT VARIANT", "PASSAT CC", "CADDY MAXI", "ID. BUZZ", "ID.BUZZ", "GRAND CALIFORNIA", "CROSS POLO", "CROSS TOURAN", "TIGUAN ALLSPACE"],
  Mitsubishi: ["SPACE STAR", "ECLIPSE CROSS", "PAJERO SPORT", "L 200"],
  Jeep: ["GRAND CHEROKEE", "G. CHEROKEE"],
  Dodge: ["GRAND CARAVAN"],
  Chrysler: ["GRAND VOYAGER", "300 C"],
  Porsche: ["911 CARRERA", "718 CAYMAN", "718 BOXSTER", "718 SPYDER"],
  Skoda: ["OCTAVIA COMBI", "SUPERB COMBI"],
  Dacia: ["SANDERO STEPWAY", "LOGAN MCV"],
  Maserati: ["GRAN TURISMO", "GRAN CABRIO"],
  Honda: ["TYPE-R"],
  Infiniti: ["M 30D", "M 37", "G 37"],
  Mercedes: [],
  Audi: ["A5 SPORTBACK", "Q5 SPORTBACK", "S E-TRON", "E-TRON GT", "RS Q3", "RS Q8", "RS E-TRON GT", "Q8 E-TRON", "SQ8 E-TRON", "Q4 E-TRON", "Q4 SPORTBACK E-TRON"],
  Ferrari: ["SF 90"],
  Jaguar: ["F TYPE"],
  DS: ["DS 3", "DS 4", "DS 5", "DS 7", "DS 9", "DS 7 CROSSBACK"],
  // TSB'de ayrı yazılan farklı araçlar (Seal sedan / Seal U SUV; Song Plus / Song L)
  BYD: ["SEAL U", "SONG PLUS", "SONG L", "SEALION 7", "LEOPARD 5"],
};

/** Model anahtarı eş anlamlıları (TSB yazım farkları → tek anahtar). */
export const MODEL_ALIASES: Record<string, Record<string, string>> = {
  Ford: {
    "T.CONNECT": "TRANSIT CONNECT", "TR.CUSTOM": "TRANSIT CUSTOM", "T.CUSTOM": "TRANSIT CUSTOM", "T.COURIER": "TRANSIT COURIER",
    "TRAN.ICA3": "TRANSIT", "TRAN.MCAI": "TRANSIT", "TRA.MCAI": "TRANSIT", "TRANS.MCAI": "TRANSIT", "TRAN.MCA": "TRANSIT",
    "TRANS.MCA": "TRANSIT", "TR.MCAI": "TRANSIT", "TR.": "TRANSIT", "T.": "TRANSIT", "TRANS.": "TRANSIT", "TRANSITVAN": "TRANSIT",
    F150: "F 150",
  },
  Jeep: { "G. CHEROKEE": "GRAND CHEROKEE" },
  Kia: { PRO_CEED: "PRO CEED" },
  Volkswagen: { "ID.BUZZ": "ID. BUZZ", ID4: "ID.4", "ID-4": "ID.4", CC: "PASSAT CC", "TIGUAN ALLSPACE": "TIGUAN", UP: "UP!" },
  Opel: { "GRANDLAND X": "GRANDLAND", "CROSSLAND X": "CROSSLAND", "MOKKA X": "MOKKA" },
  Fiat: { "MY FIORINO": "FIORINO", "500 C": "500C", "FIORINO COMBI": "FIORINO", "FIORINO CARGO": "FIORINO", "NEW DOBLO": "DOBLO", "DOBLO CARGO": "DOBLO", "DOBLO COMBI": "DOBLO", "500 L": "500L" },
  Mazda: { MX5: "MX-5", "2": "MAZDA 2", "3": "MAZDA 3", "5": "MAZDA 5", "6": "MAZDA 6" },
  Porsche: { "911 CARRERA": "911", CARRERA: "911" },
  Maserati: { GRANCABRIO: "GRAN CABRIO", GRANTURISMO: "GRAN TURISMO" },
  Honda: { "TYPE-R": "CIVIC" },
  Infiniti: { "M 30D": "M", "M30D": "M", "M 37": "M", "G 37": "G", G37: "G" },
  Audi: { A8L: "A8", "A5 SPORTBACK": "A5", "Q5 SPORTBACK": "Q5", "Q4 E-TRON": "Q4", "Q4 SPORTBACK E-TRON": "Q4", "SQ8 E-TRON": "S E-TRON" },
  Ferrari: { "SF 90": "SF90" },
  Chrysler: { "300 C": "300C" },
  Jaguar: { "F TYPE": "F-TYPE" },
  BMW: { ALPINE: "ALPINA" },
  Renault: { "GRAND ESPACE": "ESPACE" },
  DS: { DS3: "DS 3", DS4: "DS 4", DS5: "DS 5", DS7: "DS 7", DS9: "DS 9", "DS 7 CROSSBACK": "DS 7" },
  Mitsubishi: { SPACESTAR: "SPACE STAR", "L 200": "L200" },
  Hyundai: { "H-100": "H100" },
  "Mercedes-Benz": { "V KLASSE": "V SERISI", "V CLASSE": "V SERISI", ESPRINTER: "E-SPRINTER", "MERCEDES-MAYBACH": "MAYBACH" },
  Nissan: { NP: "NP300" },
  Alpine: { "A 110": "A110" },
  Lada: { "4X4": "LADA 4X4" },
  Proton: { SAVY: "SAVVY" },
};

/** Model adının görünen yazımı — başlık biçimi yanlış çıkanlar. */
export const MODEL_DISPLAY: Record<string, string> = {
  TT: "TT", TTS: "TTS", TTR: "TT RS", TTRS: "TT RS", CC: "CC", "PASSAT CC": "Passat CC", XV: "XV", BRZ: "BRZ", XLV: "XLV",
  RCZ: "RCZ", ASX: "ASX", "GT-R": "GT-R", DBS: "DBS", DBX: "DBX", FX: "FX", EX: "EX", QX70: "QX70", QX80: "QX80",
  NX: "NX", RX: "RX", IS: "IS", GS: "GS", CT: "CT", LS: "LS", RC: "RC", ES: "ES", LC: "LC", LM: "LM", RZ: "RZ", UX: "UX",
  LX: "LX", LBX: "LBX", EQ: "EQ", ZS: "ZS", HS: "HS", EHS: "EHS", MKC: "MKC", MKT: "MKT", TX: "TX", SLS: "SLS", CLE: "CLE",
  "UP!": "up!", "E-UP": "e-up!", "ID.4": "ID.4", "ID.3": "ID.3", "ID.6": "ID.6", "ID.7": "ID.7", "ID. BUZZ": "ID. Buzz",
  "MAZDA 2": "Mazda2", "MAZDA 3": "Mazda3", "MAZDA 5": "Mazda5", "MAZDA 6": "Mazda6", "MX-5": "MX-5", "CX-3": "CX-3",
  "CX-5": "CX-5", "CX-9": "CX-9", "CX-30": "CX-30", "CX-60": "CX-60", "BT-50": "BT-50", "C-HR": "C-HR", "CR-V": "CR-V",
  "HR-V": "HR-V", "ZR-V": "ZR-V", "CR-Z": "CR-Z", NSX: "NSX", "C-ELYSEE": "C-Elysée", DS3: "DS3", DS4: "DS4", DS5: "DS5",
  "DS 3": "DS 3", "DS 4": "DS 4", "DS 7": "DS 7", "DS 9": "DS 9", NO8: "N°8", NO4: "N°4", "E-TRON": "e-tron",
  "E-TRON GT": "e-tron GT", "S E-TRON": "SQ8 e-tron", RAV4: "RAV4", GT86: "GT86", "4RUNNER": "4Runner",
  "IX35": "ix35", "IX20": "ix20", "IX55": "ix55", I10: "i10", I20: "i20", I30: "i30", I40: "i40", I3: "i3", I4: "i4",
  I5: "i5", I7: "i7", I8: "i8", IX: "iX", IX1: "iX1", IX2: "iX2", IX3: "iX3", XM: "XM", "EV2": "EV2", "EV3": "EV3", "EV6": "EV6", "EV9": "EV9",
  "D-MAX": "D-Max", NLR: "NLR", NNR: "NNR", "N-WIDE": "N-Wide", "E-DELIVER": "eDeliver", "E-DELIVER 3": "eDeliver 3", "E-DELIVER 5": "eDeliver 5", "E-DELIVER 7": "eDeliver 7", "E-DELIVER 9": "eDeliver 9", "E-SPRINTER": "eSprinter",
  "E-DAILY": "eDaily", "E-TRANSIT": "E-Transit", "E-TOURNEO": "E-Tourneo Courier", NP300: "NP300", GTC4LUSSO: "GTC4Lusso",
  "12CILINDRI": "12Cilindri", SF90: "SF90", F8: "F8", FF: "FF", F12: "F12", "E-HS9": "E-HS9", "V SERISI": "V Serisi",
  "X SERISI": "X Serisi", "AMG GT": "AMG GT", "500L": "500L", "500X": "500X", "500C": "500C", "500E": "500e", "600E": "600e",
  "E-DOBLO": "E-Doblo", "E-SCUDO": "E-Scudo", "E-C4": "ë-C4", "E-C3": "ë-C3", "E-C5": "ë-C5", "E-208": "e-208",
  "E-2008": "e-2008", "E-308": "e-308", "E-3008": "e-3008", "E-5008": "e-5008", "E-PARTNER": "e-Partner",
  "CORSA-E": "Corsa-e", "MOKKA-E": "Mokka-e", "ASTRA-E": "Astra-e", "ZAFIRA-E": "Zafira-e", "FRONTERA-E": "Frontera-e",
  "JEST+": "Jest+", EQA: "EQA", EQB: "EQB", EQC: "EQC", EQE: "EQE", EQS: "EQS", EQV: "EQV", EQT: "EQT", XKR: "XKR",
  CTS: "CTS", SRX: "SRX", "LADA 4X4": "4x4", "Q8 E-TRON": "Q8 e-tron", "RS E-TRON GT": "RS e-tron GT", MCLAREN: "SLR McLaren", HD: "HD", R5: "R5", A110: "A110", A290: "A290", A390: "A390", "M": "M", "G": "G",
};

// ─── Kategori ─────────────────────────────────────────────────────────────

/** Tip adında bu kelimeler varsa araç hafif ticaridir (kamyonet kategorisi). */
export const LCV_WORDS_RE =
  /\b(KAMYONET|K\.NET|KNET|PANELVAN|PANEL VAN|VAN|MINIBUS|CAMLIVAN|CITYVAN|PICK-?UP|CIFT KABIN|TEK KABIN|SASI|OKUL|SERVIS|CARGO|FURGON|MIXTO|FRIGO\w*|KASALI|KASASIZ)\b/;

/** Tüm tipleri hafif ticari olan modeller (kasa kelimesi yazılmasa bile). */
export const LCV_MODELS: Record<string, string[]> = {
  Ford: ["TRANSIT", "TRANSIT CUSTOM", "RANGER", "F 150", "F 550", "E-TRANSIT"],
  "Mercedes-Benz": ["SPRINTER", "E-SPRINTER", "VITO", "CITAN", "V SERISI", "VIANO", "X SERISI"],
  Volkswagen: ["CRAFTER", "TRANSPORTER", "AMAROK", "CARAVELLE", "MULTIVAN", "ID. BUZZ"],
  Fiat: ["DUCATO", "FULLBACK", "SCUDO", "E-SCUDO", "TALENTO", "PRATICO"],
  Renault: ["MASTER", "ALASKAN", "TRAFIC"],
  Peugeot: ["BOXER", "EXPERT", "TRAVELLER"],
  Citroen: ["JUMPER", "JUMPY", "SPACETOURER"],
  Opel: ["MOVANO", "VIVARO", "VIVARO LIFE", "ZAFIRA LIFE"],
  Iveco: ["DAILY", "E-DAILY"],
  Toyota: ["HILUX", "HIACE", "PROACE", "PROACE VERSO"],
  Mitsubishi: ["L200", "CANTER", "L300"],
  Fuso: ["CANTER"],
  Nissan: ["NAVARA", "NP300", "NV200", "NV300", "NV400", "CABSTAR", "PRIMASTAR"],
  Isuzu: ["D-MAX", "NPR", "NNR", "NLR", "NMR", "NKR", "N-WIDE"],
  Hyundai: ["H-1", "H100", "HD", "H350", "STAREX", "STARIA"],
  Kia: ["K2500", "K2700", "BONGO"],
  Karsan: ["JEST", "JEST+", "J10", "ATAK", "JESTRONIC"],
  SsangYong: ["MUSSO", "ACTYON SPORTS", "KORANDO SPORTS"],
  KGM: ["MUSSO"],
  Dodge: ["RAM"],
  Mazda: ["BT-50"],
  GAZ: ["GAZELLE"],
  Maxus: ["DELIVER", "E-DELIVER"],
  Tata: ["XENON"],
  Tenax: ["C35", "C35D", "V35"],
  Foton: ["TUNLAND"],
  Chevrolet: ["SILVERADO", "EXPRESS"],
  GMC: ["SIERRA", "SAVANA", "CANYON"],
  Jeep: ["GLADIATOR"],
  DFSK: ["C31", "C32", "C35", "EC31", "EC35", "K01", "K01H", "MEGA"],
  DFM: ["MINI", "MAXIMUS", "CIFT"],
  FAW: ["CA1024", "CA5024"],
};

// ─── Kelime sınıfları ─────────────────────────────────────────────────────

export const BODY_WORDS: Record<string, string> = {
  SEDAN: "Sedan", HB: "Hatchback", HATCHBACK: "Hatchback", SW: "Station Wagon", ST: "Sports Tourer",
  "SPORTS TOURER": "Sports Tourer", "SPORT TOURER": "Sports Tourer", ESTATE: "Station Wagon", KOMBI: "Kombi", COMBI: "Kombi",
  VARIANT: "Variant", COUPE: "Coupe", CABRIO: "Cabrio", CABRIOLET: "Cabrio", ROADSTER: "Roadster", SPIDER: "Spider",
  SPYDER: "Spyder", SPORTBACK: "Sportback", "GRAN COUPE": "Gran Coupe", "GRAN TURISMO": "Gran Turismo",
  "GRAN TOURER": "Gran Tourer", "ACTIVE TOURER": "Active Tourer", "SHOOTING BRAKE": "Shooting Brake",
  LIMOUSINE: "Limousine", AVANT: "Avant", "3K": "3 Kapı", "5K": "5 Kapı", "3 KAPI": "3 Kapı", "5 KAPI": "5 Kapı",
  "4 KAPI": "4 Kapı", "2 KAPI": "2 Kapı", NB: "Notchback", SPORTWAGON: "Sportwagon", TOURER: "Tourer", GRANDTOUR: "Grandtour",
  PANELVAN: "Panelvan", "PANEL VAN": "Panelvan", VAN: "Van", MINIBUS: "Minibüs", KAMYONET: "Kamyonet", "K.NET": "Kamyonet",
  KNET: "Kamyonet", CAMLIVAN: "Camlıvan", CITYVAN: "Cityvan", "CIFT KABIN": "Çift Kabin", "TEK KABIN": "Tek Kabin",
  "PICK-UP": "Pick-up", PICKUP: "Pick-up", SASI: "Şasi", OKUL: "Okul Taşıtı", SERVIS: "Servis", MIXTO: "Mixto",
  CARGO: "Cargo", FURGON: "Furgon", "CAMLI VAN": "Camlıvan", HATCBACK: "Hatchback", "S.WAGON": "Station Wagon", SUV: "SUV", "KOMBI VAN": "Kombi Van", KOMBIVAN: "Kombi Van",
};

/** Hafif ticaride boyut/kapasite yapılandırması — kasa bilgisine eklenir, paket değildir. */
export const CONFIG_RE =
  /^(\d{1,2}\+\d|\d{1,2}(\.\d)?M3|L\dH\d|L\d|H\d|HR|LWB|SWB|MWB|ELWB|XLWB|UZUN|ORTA|KISA|EKSTRA|YUKSEK|TAVAN|KASALI|KASASIZ|DUBEL|\d{4}|\d(\.\d)?T|\d{1,2}(\.\d)?TON|CIFT|TEK|KABIN|UZUN\/YUKSEK|MAXI|FRIGO\w*|SOGUTUCU\w*|YOLCU|KAPALI|ACIK)$/;

export const DRIVE_WORDS: Record<string, string> = {
  "4X4": "4x4", "4X2": "4x2", AWD: "AWD", FWD: "FWD", RWD: "RWD", "4WD": "4x4", "2WD": "4x2",
  "4MATIC": "4MATIC", "4 MATIC": "4MATIC", "4MATIC+": "4MATIC+", XDRIVE: "xDrive", SDRIVE: "sDrive",
  QUATTRO: "quattro", "4MOTION": "4MOTION", ALL4: "ALL4", Q4: "Q4", "E-FOUR": "E-Four", "4XE": "4xe",
  "ALL-GRIP": "ALLGRIP", "4M": "4MOTION", "4DRIVE": "4Drive", MATIC: "4MATIC", ALLGRIP: "ALLGRIP", "4X4I": "4x4",
};

/** Emisyon/üretim kodları — kullanıcıya bir şey söylemez, etiketten atılır. */
export const NOISE_RE =
  /^(Y|LCI|EURO[3456]\+?|E[456](\.\d)?(\+|D|C|E|DT|DTEMP|AP|BP)?|EU[456]|EURO ?[3456](\+)?|EURO[3456]|STT|S&S|S\/S|START\/?STOP|FL|MY\d{2}|YENI|NEW|MCA|MCAI|MC|FACELIFT|-|\+|\/)$/;

/**
 * Otomatik vites işaretleri. Yalnızca OTOMATİK açıkça yazılır; manuel çoğu
 * zaman yazılmaz, bu yüzden "işaret yok = manuel" varsayımı YAPILMAZ.
 * İki kelimelik yazımlar ("S TRONIC") ayrıştırma öncesi birleştirilir.
 */
export const AUTO_RE =
  /^(AT\d?|A\/T|\d\/AT|\dAT|AT-\d|OTOMATIK|OTM|OTO|OV|AUT\.?|AUTO|AUTOMATIC|DSG\d?|\d?DSG|DCT\d?|\dDCT|\d-?DCT|\dG-DCT|EDC\d?|CVT\d?|E-CVT|IVT|X-?TRONIC|STEPTRONIC|TIPTRONIC|S-?TRONIC|MULTITRONIC|GEARTRONIC|POWERSHIFT|\d?G-?TRONIC|\dG|AMT\d?|MTA|I-SHIFT|DUALOGIC|EAT\d?|EASYTR\w*|TCT|SPEEDSHIFT|DKG|SMG|MCT|PDK|MULTIDRIVE\w*|SENSODRIVE|EGS|ETG|AGS|TORQUEFLITE|\d+-?SPEED|STEPTR\.?|DDCT|WET-DCT|E-DCT|EDC6|EDC7|DHT|E-SHIFT|COMFORTMATIC|COMFORT-MATIC|TOUCHTRONIC|SWITCH-TRONIC|SPORTSHIFT|SELESPEED|MULTIRONIC|MCP|M\/M|MMT|AUTO\d\w*|EDCS?\d?|ETG\d?|\d{1,2}AT\w*|\d{1,2}DCT\w*|HIGHL\.DSG|EASY-R|EASYR|2-TRON|2-TRONIC)$/;
export const AUTO_TWO_WORDS = new Set(["S TRONIC", "G TRONIC", "7G TRONIC", "9G TRONIC", "STEP TRONIC", "X TRONIC", "M TRONIC", "Q TRONIC", "7 DCT", "6 DCT", "8 AT", "6 AT", "S TONIC", "MULTIDRIVE S", "SWITCH TRONIC"]);
/**
 * Otomatik vites işaretinin TÜRÜ — Araç Öner'in vites seçenekleriyle aynı değerler.
 * CVT: kademesiz; Yarı Otomatik: robotize tek kavramalı (AMT). Diğer tüm otomatikler
 * (tork konvertörlü, çift kavramalı DSG/DCT/EDC) "Otomatik".
 */
export const CVT_RE = /^(CVT\d?|E-CVT|IVT|X-?TRONIC|MULTITRONIC|MULTIRONIC|LINEARTRONIC)$/;
export const AMT_RE = /^(AMT\d?|MTA|I-SHIFT|DUALOGIC|EASYTR\w*|SMG|SELESPEED|ETG\d?|EGS|MMT|M\/M|MCP|2-TRON|2-TRONIC|EASY-R|EASYR|SENSODRIVE|COMFORTMATIC|COMFORT-MATIC|AGS|SPEEDSHIFT)$/;
export const MANUAL_RE = /^(MT\d?|M\/T|\dMT|\d-MT|MANUEL|DUZ)$/;

/** Motoru tanımlayan kelimeler: paket değil, "Versiyon" alanına gider. */
export const ENGINE_WORDS: Record<string, string> = {
  "M.JET": "Multijet", "M. JET": "Multijet", MJET: "Multijet", MULTIJET: "Multijet", "MULTIJET2": "Multijet II",
  "E-TORQ": "E-Torq", FIRE: "Fire", "T-JET": "T-Jet", TJET: "T-Jet", MULTIAIR: "MultiAir", TWINAIR: "TwinAir",
  PURETECH: "PureTech", BLUEHDI: "BlueHDi", HDI: "HDi", "E-HDI": "e-HDi", VTI: "VTi", THP: "THP",
  TCE: "TCe", SCE: "SCe", DCI: "dCi", BLUEDCI: "Blue dCi", ECOBOOST: "EcoBoost", TDCI: "TDCi", ECOBLUE: "EcoBlue",
  TSI: "TSI", ECOTSI: "eTSI", ETSI: "eTSI", TFSI: "TFSI", TDI: "TDI", FSI: "FSI", CRDI: "CRDi", GDI: "GDi",
  "T-GDI": "T-GDi", TGDI: "T-GDi", MPI: "MPi", CDI: "CDI", CRD: "CRD", "D-4D": "D-4D", D4D: "D-4D", VVT: "VVT",
  "VVT-I": "VVT-i", "DUAL VVT-I": "Dual VVT-i", VTEC: "VTEC", "I-VTEC": "i-VTEC", "I-DTEC": "i-DTEC", DDIS: "DDiS",
  BOOSTERJET: "Boosterjet", ECOTEC: "Ecotec", CDTI: "CDTi", "SKYACTIV-G": "Skyactiv-G", "SKY-G": "Skyactiv-G",
  "SKYACTIV-D": "Skyactiv-D", "SKY-D": "Skyactiv-D", "SKYACTIV-X": "Skyactiv-X", MIVEC: "MIVEC", "DI-D": "DI-D", DID: "DI-D",
  HYBRID: "Hybrid", HIBRIT: "Hybrid", "E-HYBRID": "e-Hybrid", HEV: "HEV", FHEV: "HEV", MHEV: "MHEV", PHEV: "PHEV",
  "PLUG-IN": "Plug-in", "E-TECH": "E-Tech", "E-POWER": "e-Power", "DM-I": "DM-i", DMI: "DM-i", LPG: "LPG", "ECO-G": "ECO-G",
  CNG: "CNG", TURBO: "Turbo", BITURBO: "Biturbo", "16V": "16V", "8V": "8V", "12V": "12V", "24V": "24V", DIZEL: "Dizel",
  DIESEL: "Dizel", DZL: "Dizel", BENZIN: "Benzin", BENZINLI: "Benzin", BLUETEC: "BlueTEC", BLUEMOTION: "BlueMotion",
  BMT: "BMT", "DIG-T": "DIG-T", CVVT: "CVVT", "D-CVVT": "D-CVVT", CR: "CR", SCR: "SCR", KAPPA: "Kappa", GAMMA: "Gamma",
  TWINPOWER: "TwinPower", VALVEMATIC: "Valvematic", DUALJET: "DualJet", SIDI: "SIDI", JTS: "JTS", JTD: "JTD", JTDM: "JTDm",
  TWINSPARK: "Twin Spark", "TWIN ENGINE": "Twin Engine", RECHARGE: "Recharge", ELEKTRIK: "Elektrik", ELECTRIC: "Electric",
  ELETTRICA: "Elettrica", "E-TRON": "e-tron", EV: "EV", BEV: "EV", EVO: "Evo", "SKYACTIV": "Skyactiv", TD: "TD",
  TDV6: "TDV6", TDV8: "TDV8", SDV6: "SDV6", SDV8: "SDV8", SD4: "SD4", TD4: "TD4", SI4: "Si4", "E-XDI": "e-XDi", XDI: "XDi",
  VGT: "VGT", GTDI: "GTDi", TCI: "TCi", "TSI ACT": "TSI ACT", ACT: "ACT", EAT: "EAT", VCDI: "VCDi", "I-CTDI": "i-CTDi",
  CTDI: "CTDi", "I-MMD": "i-MMD", "DIG-S": "DIG-S", "IG-T": "IG-T", "TI-VCT": "Ti-VCT", "TI-CVT": "Ti-VCT",
  TB: "TB", TBI: "TBi", "E-VTI": "e-VTi", "E-TEC": "e-TEC", "HYBRID+": "Hybrid+", "E-HIBRIT": "e-Hybrid", "PLUG IN": "Plug-in", ZE: "Z.E.", "Z.E.": "Z.E.",
  BLUEEFFICIENCY: "BlueEFFICIENCY", BZ: "Benzin", EB: "EB", TWINPORT: "Twinport", ELEKTRIKLI: "Elektrik",
  "BLUE HDI": "BlueHDi", BLUETECH: "BlueTEC", "T FSI": "TFSI", "BLUE DCI": "Blue dCi", "MULTIJET II": "Multijet II", "M.JET II": "Multijet II", "MJET II": "Multijet II", "E:HEV": "e:HEV", "EHEV": "e:HEV", "PLUG": "Plug-in",
};

/** Tek başına anlamı olmayan ama motor koduna yapışık gelen kelimeler: V6/V8/W12, Volvo T4/D4 vb. */
export const ENGINE_CODE_RE = /^([VW](6|8|10|12)|D\d{3}|P\d{3}E?|SD4|TD4|\d{2}[CS]\d{2}\w*)$/;
/** Volvo/Polestar motor kodları (T4, D4, B5) — yalnızca bu markalarda motor sayılır. */
export const VOLVO_CODE_RE = /^[TDB][2-8]$/;
/**
 * Hafif ticaride modelin hemen ardından gelen 3 haneli ağırlık/güç kodu
 * ("SPRINTER 316", "VITO 114", "TRANSIT 350L", "CRAFTER 35") — motor/versiyon kodudur.
 */
export const LCV_CODE_RE_BY_MODEL: Record<string, RegExp> = {
  SPRINTER: /^\d{3}$/, "E-SPRINTER": /^\d{3}$/, VITO: /^\d{3}$/, CITAN: /^\d{3}$/, // 316 CDI, 114 CDI
  TRANSIT: /^\d{3}[A-Z]{1,3}$/, "E-TRANSIT": /^\d{3}[A-Z]{1,3}$/, // 350L, 440E, 350ED
  "TRANSIT CUSTOM": /^\d{3}[LSM]$/, "TOURNEO CUSTOM": /^\d{3}[LSM]$/, // 320L, 340S
  CRAFTER: /^\d{2}$/, // 35 (3.5 ton)
};

/**
 * Motor AİLESİ adları — yakıtı tartışmasız söyler. Bir satırda dizel ve benzin işareti
 * birlikte geçerse (ör. "1.3 TCE 100 D-FULL", "3.5T … 316 CDI") çelişki bunlarla çözülür:
 * güçlü olan kazanır; ikisi de güçlüyse ("1.6i TDCi") alan kullanıcıya sorulur.
 */
export const GUCLU_DIZEL_RE = /\b(TDI|DCI|BLUEDCI|CRDI|CDI|HDI|BLUEHDI|E-HDI|TDCI|M\.? ?JET|MJET|MULTIJET2?|JTD|JTDM|DDIS|ECOBLUE|CDTI|D-?4D|BLUETEC|I-DTEC|SKYACTIV-D|DIZEL|DIESEL|DZL|XDI|E-XDI|VCDI|CTDI|DI-D|DID)\b/;
export const GUCLU_BENZIN_RE = /\b(TSI|ETSI|ECOTSI|TFSI|FSI|FIRE|E-TORQ|T-?JET|VTEC|I-VTEC|MPI|GDI|T-?GDI|TCE|SCE|PURETECH|ECOBOOST|BOOSTERJET|BENZIN|BENZINLI|BZ|SKYACTIV-G|TWINAIR|MULTIAIR|ECOTEC|THP|VTI|MIVEC|DIG-T|CVVT|TI-VCT)\b/;

/** Yakıt işaretleri — sırayla denenir, ilk eşleşen kazanır. Model adı hariç metne uygulanır. */
export const FUEL_RULES: [string, RegExp][] = [
  ["PHEV", /\b(PHEV|PLUG-?IN|PLUG|E-HYBRID|PHV|RECHARGE|TWIN ENGINE|4XE|DM-?I|HYBRID4|E PERFORMANCE|E-PERFORMANCE|IPERFORMANCE|E-HIBRIT|PLUG IN)\b|\bPHEV\d+\b|\bTFSI ?E\b|\bP\d{3}E\b|\bXDRIVE\d{2}E\b/],
  ["HYBRID", /\b(HYBRID|HIBRIT|HEV|FHEV|E-POWER|SELF-CHARGING|I-MMD|E:HEV|EHEV)\b|\bE-TECH\b(?! ELECTRIC)|\b\d{3}H\b/],
  ["EV", /\b(ELEKTRIK|ELEKTRIKLI|ELECTRIC|ELETTRICA|BEV|EV|ZE|Z\.E)\b|\d+(\.\d+)?\s?KWH\b|\b\d{2,3}\s?KW\b/],
  ["LPG", /\b(LPG|ECO-?G|BI-?FUEL|CNG|GPL)\b/],
  ["DIESEL", /\b(DIZEL|DIESEL|DZL|TDI|DCI|BLUEDCI|CRDI|CDI|D-?4D|HDI|BLUEHDI|E-HDI|M\.? ?JET|MJET|MULTIJET2?|JTD|JTDM|DDIS|TDCI|ECOBLUE|CRD|SDI|I-DTEC|DTEC|D-CAT|TD|CDTI|DTI|SKYACTIV-D|SKY-D|SD4|TD4|TD6|SDV6|SDV8|TDV6|TDV8|BLUETEC|DID|DI-D|VGT|XDI|E-XDI|GTD|VCDI|CTDI|I-CTDI|SCR|BLUE HDI|BLUETECH)\b|\b\d{3}D\b|\b\d{3}LD\b|\b\d{2}D\b|\bD\d\.\d\b|\b[XS]DRIVE\d{2}D\b|\b\d\.\dD\b|\bD\d{3}\b|\b\d{3} ?D\b|(^| )D( |$)/],
  ["GASOLINE", /\b(TSI|ETSI|ECOTSI|TFSI|FSI|FIRE|E-TORQ|T-?JET|VTEC|I-VTEC|VVT|VVT-I|MPI|GDI|T-?GDI|TCE|SCE|PURETECH|ECOBOOST|BOOSTERJET|BENZIN|BENZINLI|SKYACTIV-G|SKY-G|TWINAIR|MULTIAIR|ECOTEC|KAPPA|GAMMA|TWINPOWER|VALVEMATIC|THP|VTI|GTI|DUALJET|MIVEC|SIDI|TWINSPARK|JTS|DIG-T|CVVT|D-CVVT|GTDI|SI4|DIG-S|IG-T|TI-VCT|TI-CVT|TB|TBI|BZ|TWINPORT|T FSI)\b|\b\d{3}LI\b|\b\d{2}I\b|\b\d{3}I\b|\b[XS]DRIVE\d{2}I\b|\b\d\.\d+I\b|\b\d\.\dT\b|\bP\d{3}\b/],
];

/** Yakıtı model adından kesin belli olan modeller (yalnızca tek yakıtla satılanlar). */
export const EV_ONLY_MODELS: Record<string, string[]> = {
  Tesla: ["MODEL S", "MODEL 3", "MODEL X", "MODEL Y"],
  TOGG: ["T10X", "T10F"],
  Porsche: ["TAYCAN"],
  Renault: ["ZOE", "MEGANE E-TECH", "SCENIC E-TECH", "R5"],
  BMW: ["I3", "I4", "I5", "I7", "IX", "IX1", "IX2", "IX3"],
  "Mercedes-Benz": ["EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "E-SPRINTER"],
  Volkswagen: ["ID.3", "ID.4", "ID.6", "ID.7", "ID. BUZZ", "E-UP"],
  Hyundai: ["IONIQ 5", "IONIQ 6", "IONIQ 9", "INSTER"],
  Kia: ["EV2", "EV3", "EV6", "EV9"],
  Skoda: ["ENYAQ", "ELROQ"],
  Audi: ["E-TRON", "E-TRON GT", "Q4", "Q6", "S E-TRON", "Q8 E-TRON", "RS E-TRON GT"],
  Nissan: ["LEAF", "ARIYA"],
  Dacia: ["SPRING"],
  Fiat: ["500E", "600E", "E-DOBLO", "E-SCUDO"],
  Opel: ["CORSA-E", "MOKKA-E", "ASTRA-E", "ZAFIRA-E", "FRONTERA-E"],
  Peugeot: ["E-208", "E-2008", "E-308", "E-3008", "E-5008", "E-PARTNER"],
  Citroen: ["E-C3", "E-C4", "E-C5"],
  Ford: ["MUSTANG MACH-E", "E-TRANSIT", "E-TOURNEO"],
  Iveco: ["E-DAILY"],
  Maxus: ["E-DELIVER", "E-DELIVER 3", "E-DELIVER 5", "E-DELIVER 7", "E-DELIVER 9"],
  Volvo: ["EX30", "EX40", "EC40", "C40", "EX90"],
  Polestar: ["POLESTAR 2"],
  Subaru: ["SOLTERRA"],
  Smart: ["EQ"],
  MG: ["MG4"],
  Lucid: ["AIR", "GRAND"],
};

/** Paket/donanım adlarında büyük harfle kalması gereken kısaltmalar. */
export const KEEP_UPPER = new Set([
  "AMG", "GT", "GTI", "GTD", "GTS", "GTE", "RS", "ST", "SE", "SEL", "SX", "LX", "EX", "GL", "GLS", "GLX", "LS",
  "LT", "LTZ", "XLT", "XL", "HSE", "SV", "SVR", "SVA", "JCW", "TDI", "TSI", "M", "R", "S", "GS", "GR", "SR", "XR",
  "ZX", "XS", "XE", "XF", "XJ", "DS", "RC", "RX", "NX", "UX", "LBX", "ES", "IS", "LC", "LM", "CR", "HR", "ZR",
  "FR", "N", "SRT", "TRD", "ACC", "LED", "ABS", "ESP", "II", "III", "IV", "VI", "VII", "VIII", "LWB", "SWB", "MWB",
  "ELWB", "VIP", "BSM", "JLX", "GLE", "GLC", "GLA", "GLB", "CLA", "CLS", "SLK", "SLC", "GLK", "ML", "SL", "CL",
  "GTC", "OPC", "RTL", "RFL", "EV", "HEV", "PHEV", "MHEV", "LPG", "CVT", "DSG", "DCT", "EDC", "BMT", "CR", "SCR",
  "TD", "TCe", "V6", "V8", "V12", "W12", "4X4", "4X2", "AWD", "FWD", "RWD", "XLS", "ZXR", "GX", "GXL", "VX", "LE",
  "SLE", "SLT", "GLI", "SXI", "VXI", "LXI", "ZXI", "HX", "DX", "RS3", "RS4", "RS5", "RS6", "RS7", "SQ5", "SQ7", "SQ8",
  "JLX-A", "S-LINE", "M-SPORT", "R-LINE", "N-LINE", "GT-LINE", "ST-LINE", "FR-LINE", "RS-LINE", "AMG-LINE",
]);
