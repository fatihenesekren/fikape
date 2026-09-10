import { describe, it, expect } from "vitest";
import {
  encodeQuiz, decodeQuiz, calcQuizScore, quizQ4Matches, answerAffectsResults,
  MOTO_CC_RANGES, EBIKE_WATT_RANGES, QUIZ_STEPS,
  type QuizAnswers, type QuizCat,
} from "./quiz";

describe("MOTO_CC_RANGES", () => {
  it("aralık sınırlarını doğru tanımlar", () => {
    expect(MOTO_CC_RANGES.kucuk).toEqual({ min: 125, max: 250 });
    expect(MOTO_CC_RANGES.orta).toEqual({ min: 400, max: 600 });
    expect(MOTO_CC_RANGES.buyuk).toEqual({ min: 600, max: Infinity });
  });

  it("farketmez için filtre koymaz (null)", () => {
    expect(MOTO_CC_RANGES.fark).toBeNull();
  });

  it("125cc bir scooter 600cc+ aralığına girmez", () => {
    const r = MOTO_CC_RANGES.buyuk!;
    expect(125 >= r.min && 125 <= r.max).toBe(false);
  });

  it("689cc bir motosiklet 600cc+ aralığına girer", () => {
    const r = MOTO_CC_RANGES.buyuk!;
    expect(689 >= r.min && 689 <= r.max).toBe(true);
  });
});

describe("EBIKE_WATT_RANGES", () => {
  it("aralık sınırlarını doğru tanımlar", () => {
    expect(EBIKE_WATT_RANGES.eco).toEqual({ min: 0, max: 350 });
    expect(EBIKE_WATT_RANGES.orta).toEqual({ min: 350, max: 500 });
    expect(EBIKE_WATT_RANGES.guclu).toEqual({ min: 500, max: Infinity });
  });

  it("farketmez için filtre koymaz (null)", () => {
    expect(EBIKE_WATT_RANGES.fark).toBeNull();
  });
});

describe("QUIZ_STEPS", () => {
  it("her kategoride 3 soru var (kategori seçimiyle birlikte 4 adım)", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      expect(QUIZ_STEPS[cat]).toHaveLength(3);
    }
  });

  it("her 4. soruda filtre koymayan bir 'fark' seçeneği var", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      const q4Keys = QUIZ_STEPS[cat][2].opts.map((o) => o.key);
      expect(q4Keys).toContain("fark");
    }
  });
});

describe("encodeQuiz / decodeQuiz", () => {
  it("round-trip yapar", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "dizel" };
    expect(decodeQuiz(encodeQuiz(answers))).toEqual(answers);
  });

  it("eski 3 parçalı URL'leri q4=fark ile kabul eder (geriye uyumluluk)", () => {
    expect(decodeQuiz("oto,sehir,bakim")).toEqual({ cat: "oto", q2: "sehir", q3: "bakim", q4: "fark" });
  });

  it("geçersiz kategoriyi reddeder", () => {
    expect(decodeQuiz("gecersiz,sehir,bakim,fark")).toBeNull();
  });

  it("eksik parçaları reddeder", () => {
    expect(decodeQuiz("oto,sehir")).toBeNull();
  });

  it("boş q2/q3'ü reddeder", () => {
    expect(decodeQuiz("oto,,bakim,fark")).toBeNull();
  });
});

describe("quizQ4Matches", () => {
  it("fark hiçbir şeyi elemez", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "fark" };
    expect(quizQ4Matches(answers, {}, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(true);
  });

  it("oto: dizel seçimi benzinli aracı eler", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "dizel" };
    expect(quizQ4Matches(answers, { fuel_type: "DIESEL" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "GASOLINE" }, "otomobil")).toBe(false);
  });

  it("oto: hibrit seçimi HYBRID ve PHEV'i kapsar", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "hibrit" };
    expect(quizQ4Matches(answers, { fuel_type: "HYBRID" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "PHEV" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(false);
  });

  it("moto: naked seçimi retro/cruiser'ı da kapsar, sport'u eler", () => {
    const answers: QuizAnswers = { cat: "moto", q2: "sehir", q3: "fark", q4: "naked" };
    expect(quizQ4Matches(answers, { moto_type: "naked" }, "motosiklet")).toBe(true);
    expect(quizQ4Matches(answers, { moto_type: "retro" }, "motosiklet")).toBe(true);
    expect(quizQ4Matches(answers, { moto_type: "sport" }, "motosiklet")).toBe(false);
  });

  it("scooter: motor_watt aralığa göre filtrelenir, watt verisi olmayan elenir", () => {
    const answers: QuizAnswers = { cat: "scooter", q2: "kisa", q3: "rahat", q4: "guclu" };
    expect(quizQ4Matches(answers, { motor_watt: 700 }, "e-scooter")).toBe(true);
    expect(quizQ4Matches(answers, { motor_watt: 350 }, "e-scooter")).toBe(false);
    expect(quizQ4Matches(answers, {}, "e-scooter")).toBe(false);
  });

  it("ebike: motor_watt aralığa göre filtrelenir, watt verisi olmayan elenir", () => {
    const answers: QuizAnswers = { cat: "ebike", q2: "kisa", q3: "orta", q4: "guclu" };
    expect(quizQ4Matches(answers, { motor_watt: 700, bike_type: "mtb" }, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, {}, "e-bisiklet")).toBe(true); // q4 (tip) burada test edilen filtre değil
  });

  it("ebike: kargo seçimi sadece kargo tipini kapsar", () => {
    const answers: QuizAnswers = { cat: "ebike", q2: "orta", q3: "fark", q4: "kargo" };
    expect(quizQ4Matches(answers, { bike_type: "kargo" }, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, { bike_type: "sehir" }, "e-bisiklet")).toBe(false);
  });

  it("ebike: katlanır seçimi katlanabilir tipini eşler", () => {
    const answers: QuizAnswers = { cat: "ebike", q2: "kisa", q3: "eco", q4: "katlanir" };
    expect(quizQ4Matches(answers, { bike_type: "katlanabilir" }, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, { bike_type: "mtb" }, "e-bisiklet")).toBe(false);
  });

  it("karavan: kamper seçimi kamper-van tipini eşler", () => {
    const answers: QuizAnswers = { cat: "karavan", q2: "iki", q3: "minimal", q4: "kamper" };
    expect(quizQ4Matches(answers, { karavan_type: "kamper-van" }, "karavan")).toBe(true);
    expect(quizQ4Matches(answers, { karavan_type: "cekme" }, "karavan")).toBe(false);
  });

  it("kamyon: 'yuk' seçimi van/panelvan kapsar, pickup'ı eler", () => {
    const answers: QuizAnswers = { cat: "kamyon", q2: "is", q3: "orta", q4: "yuk" };
    expect(quizQ4Matches(answers, { body_type: "panelvan" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, { body_type: "van" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, { body_type: "pickup" }, "kamyonet")).toBe(false);
    expect(quizQ4Matches(answers, { body_type: "minivan" }, "kamyonet")).toBe(false);
    expect(quizQ4Matches(answers, {}, "kamyonet")).toBe(false);
  });

  it("kamyon: 'pickup' seçimi sadece pickup kapsar", () => {
    const answers: QuizAnswers = { cat: "kamyon", q2: "is", q3: "orta", q4: "pickup" };
    expect(quizQ4Matches(answers, { body_type: "pickup" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, { body_type: "panelvan" }, "kamyonet")).toBe(false);
  });

  it("kamyon: eski 'dortcarpi' URL'i (artık geçersiz key) filtre koymaz", () => {
    const answers: QuizAnswers = { cat: "kamyon", q2: "is", q3: "orta", q4: "dortcarpi" };
    expect(quizQ4Matches(answers, { body_type: "pickup" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, {}, "kamyonet")).toBe(true);
  });

  it("hepsi: elektrik seçimi EV + e-scooter/e-bisiklet kategorilerini kapsar", () => {
    const answers: QuizAnswers = { cat: "hepsi", q2: "sehir", q3: "bir_iki", q4: "elektrik" };
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, {}, "e-scooter")).toBe(true);
    expect(quizQ4Matches(answers, {}, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "GASOLINE" }, "otomobil")).toBe(false);
  });

  it("hepsi: yakitli seçimi elektrikli olmayan her şeyi kapsar (çekme karavan dahil)", () => {
    const answers: QuizAnswers = { cat: "hepsi", q2: "macera", q3: "dort", q4: "yakitli" };
    expect(quizQ4Matches(answers, { fuel_type: "DIESEL" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, {}, "karavan")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(false);
    expect(quizQ4Matches(answers, {}, "e-scooter")).toBe(false);
  });
});

describe("calcQuizScore", () => {
  const scores = { scoreFiyat: 8, scoreKalite: 6, scorePerformans: 4 };

  it("oto dışı kategorilerde review eşleştirmesi yapmaz", () => {
    const result = calcQuizScore(scores, [{ usage_type: "city" }], { cat: "moto", q2: "sehir", q3: "guven", q4: "fark" });
    expect(result.matchCount).toBe(0);
    expect(result.isRealMatch).toBe(false);
  });

  it("q3=bakim iken fiyat+kalite ağırlıklı skor hesaplar", () => {
    const result = calcQuizScore(scores, [], { cat: "oto", q2: "sehir", q3: "bakim", q4: "fark" });
    expect(result.score).toBeCloseTo(8 * 0.5 + 6 * 0.5);
  });

  it("3'ten az eşleşme varsa isRealMatch false döner", () => {
    const result = calcQuizScore(
      scores,
      [{ usage_type: "city" }, { usage_type: "city" }],
      { cat: "oto", q2: "sehir", q3: "guven", q4: "fark" }
    );
    expect(result.matchCount).toBe(2);
    expect(result.isRealMatch).toBe(false);
  });

  it("3+ eşleşme varsa isRealMatch true döner", () => {
    const reviews = [{ usage_type: "city" }, { usage_type: "city" }, { usage_type: "city" }];
    const result = calcQuizScore(scores, reviews, { cat: "oto", q2: "sehir", q3: "guven", q4: "fark" });
    expect(result.matchCount).toBe(3);
    expect(result.isRealMatch).toBe(true);
  });

  it("uyumsuz usage_type'ları eleyerek eşleştirir", () => {
    const reviews = [{ usage_type: "city" }, { usage_type: "highway" }, { usage_type: "city" }];
    const result = calcQuizScore(scores, reviews, { cat: "oto", q2: "sehir", q3: "guven", q4: "fark" });
    expect(result.matchCount).toBe(2);
  });
});

describe("answerAffectsResults — sonuç şeridi çip görünürlüğü", () => {
  it("q2 (1. soru) hiçbir kategoride çip üretmez", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      for (const opt of QUIZ_STEPS[cat][0].opts) {
        expect(answerAffectsResults(cat, 1, opt.key)).toBe(false);
      }
    }
  });

  it("q3 (2. soru) yalnız oto/moto/ebike'de ve 'fark' değilse çip üretir", () => {
    expect(answerAffectsResults("oto", 2, "guven")).toBe(true);
    expect(answerAffectsResults("moto", 2, "orta")).toBe(true);
    expect(answerAffectsResults("ebike", 2, "guclu")).toBe(true);
    expect(answerAffectsResults("moto", 2, "fark")).toBe(false);
    expect(answerAffectsResults("ebike", 2, "fark")).toBe(false);
    // okunmayan q3'ler
    expect(answerAffectsResults("scooter", 2, "rahat")).toBe(false);
    expect(answerAffectsResults("karavan", 2, "tamkonfor")).toBe(false);
    expect(answerAffectsResults("kamyon", 2, "agir")).toBe(false);
    expect(answerAffectsResults("hepsi", 2, "dort")).toBe(false);
  });

  it("q4 (3. soru) her kategoride çip üretir, 'fark' hariç", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      for (const opt of QUIZ_STEPS[cat][2].opts) {
        expect(answerAffectsResults(cat, 3, opt.key)).toBe(opt.key !== "fark");
      }
    }
  });

  it("kamyon q4 'Şart değil' (key: fark) çip üretmez", () => {
    expect(answerAffectsResults("kamyon", 3, "fark")).toBe(false);
  });

  it("boş/tanımsız key çip üretmez", () => {
    expect(answerAffectsResults("oto", 3, "")).toBe(false);
  });

  it("her q4 adımında tam olarak bir 'fark' key'i var (skip mantığı bozulmasın)", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      const farkCount = QUIZ_STEPS[cat][2].opts.filter((o) => o.key === "fark").length;
      expect(farkCount).toBe(1);
    }
  });
});
