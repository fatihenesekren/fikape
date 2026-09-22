// Plus sayfasındaki fikir kartlarının tek kaynağı — hem sayfa (server),
// hem PlusBoard (client), hem de /api/plus/interest route'u aynı listeyi
// kullanıyor (route, gelen interestKey'i buna karşı doğruluyor).

export type PlusSectionId = "gelistiriyoruz" | "ai" | "vizyon";

export interface PlusSection {
  id: PlusSectionId;
  title: string;
  subtitle: string;
  /** true ise kartlarda "İlgileniyorum" toggle'ı var; false ise pasif/rozetli. */
  interactive: boolean;
}

export interface PlusFeatureCard {
  id: string;
  section: PlusSectionId;
  title: string;
  description: string;
}

export const PLUS_SECTIONS: PlusSection[] = [
  {
    id: "gelistiriyoruz",
    title: "Şimdi Geliştiriyoruz",
    subtitle: "Var olan özellikleri daha akıllı, daha kullanışlı hale getiriyoruz — yeni bir modül değil.",
    interactive: true,
  },
  {
    id: "ai",
    title: "AI ile Mümkün",
    subtitle: "Yapay zekâyla, ek maliyet gerektirmeden ya da ileride kolayca üstlenilebilecek fikirler.",
    interactive: true,
  },
  {
    id: "vizyon",
    title: "Uzak Vizyon",
    subtitle: "Dünyadaki büyük platformlardan ilham alan, ama henüz planımızda olmayan büyük fikirler.",
    interactive: false,
  },
];

export const PLUS_FEATURE_CARDS: PlusFeatureCard[] = [
  // Şimdi Geliştiriyoruz
  {
    id: "skor-kirilim",
    section: "gelistiriyoruz",
    title: "Skor kartında kırılım",
    description: "Tek sayı yerine \"neden bu puan?\": yakıt ekonomisi, güvenilirlik, konfor gibi alt kategoriler ayrı ayrı görünsün.",
  },
  {
    id: "yorum-faydali",
    section: "gelistiriyoruz",
    title: "Yorumlarda \"faydalı buldum\"",
    description: "En değerli yorumlar öne çıksın, herkes aynı sırada görünmesin.",
  },
  {
    id: "qna-en-iyi-cevap",
    section: "gelistiriyoruz",
    title: "Soru-Cevap'ta en iyi cevap",
    description: "Soruyu soran kişi en doğru cevabı işaretleyip üste sabitleyebilsin.",
  },
  {
    id: "garaj-zaman-cizelgesi",
    section: "gelistiriyoruz",
    title: "Garaj'da sahiplik hikayesi",
    description: "Alış, bakım, yorum ve satış tek bir zaman çizelgesinde, tek bakışta görünsün.",
  },
  {
    id: "takas-uyum-rozeti",
    section: "gelistiriyoruz",
    title: "Takas'ta uyum rozeti",
    description: "Aradığın kriterlere göre ilanlar, tek bir \"%78 uyum\" rozetiyle özetlensin.",
  },
  // AI ile Mümkün
  {
    id: "ai-sik-sikayet",
    section: "ai",
    title: "Sık şikayet / sık övgü etiketleri",
    description: "Bir modelde en çok neyin şikayet, en çok neyin övgü konusu olduğunu AI özetlesin.",
  },
  {
    id: "ai-karsilastir-fark",
    section: "ai",
    title: "Karşılaştırmada \"3 temel fark\"",
    description: "İki aracı karşılaştırırken aralarındaki en önemli farkları AI tek cümlede özetlesin.",
  },
  {
    id: "ai-oneri-gerekce",
    section: "ai",
    title: "Kişiselleştirilmiş öneri gerekçesi",
    description: "Öner akışında \"bu araç sana neden uygun\" diye AI kısaca açıklasın.",
  },
  {
    id: "ai-ilan-metni",
    section: "ai",
    title: "Otomatik satış ilanı metni",
    description: "\"Sattım\" formundaki bilgilerden AI, paylaşılabilir bir ilan taslağı yazsın.",
  },
  {
    id: "ai-dogal-dil-arama",
    section: "ai",
    title: "Doğal dille arama",
    description: "\"80 bin altı hasarsız dizel SUV\" yazman yeterli olsun, filtreleri AI uygulasın.",
  },
  {
    id: "ai-fiyat-sinyali",
    section: "ai",
    title: "Topluluk fiyat sinyali",
    description: "Takas/satış ilanlarındaki gerçek fiyatlardan, \"bu fiyat topluluk ortalamasına göre nasıl\" sinyali.",
  },
  // Uzak Vizyon
  {
    id: "vizyon-arac-gecmisi",
    section: "vizyon",
    title: "Araç geçmiş raporu",
    description: "Sahiplik, yorum ve skor geçmişinin tamamı — paylaşılabilir bir \"araç kimliği\" tek sayfada.",
  },
  {
    id: "vizyon-bolgesel-fiyat",
    section: "vizyon",
    title: "Bölgesel fiyat karşılaştırma",
    description: "Bölgene göre gerçek piyasa fiyat aralığı — güvenilir bir veri kaynağı gerektiriyor.",
  },
  {
    id: "vizyon-hasar-tramer",
    section: "vizyon",
    title: "Hasar/tramer uyarısı",
    description: "Resmi hasar kaydı entegrasyonu — kurumsal veri ortaklığı gerektiriyor.",
  },
  {
    id: "vizyon-coklu-usta",
    section: "vizyon",
    title: "Çoklu usta teklifi",
    description: "Birden fazla ustadan aynı anda görüş almak — ileride değerlendirilecek.",
  },
];

export const PLUS_INTEREST_KEYS = new Set(
  PLUS_FEATURE_CARDS.filter((c) => PLUS_SECTIONS.find((s) => s.id === c.section)?.interactive).map((c) => c.id),
);
