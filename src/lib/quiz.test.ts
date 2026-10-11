import { describe, it, expect } from "vitest";
import {
  encodeQuiz, decodeQuiz, calcQuizScore, quizQ4Matches, quizMatches, answerAffectsResults, kisiKapasitesi,
  MOTO_CC_RANGES, EBIKE_WATT_RANGES, QUIZ_STEPS, STEP_RULES,
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
    expect(EBIKE_WATT_RANGES.eco).toEqual({ min: 0, max: 250 });
    expect(EBIKE_WATT_RANGES.guclu).toEqual({ min: 251, max: Infinity });
    expect(EBIKE_WATT_RANGES.orta).toBeUndefined(); // boş kalan 251–500 W kademesi kaldırıldı
  });

  it("farketmez için filtre koymaz (null)", () => {
    expect(EBIKE_WATT_RANGES.fark).toBeNull();
  });
});

describe("QUIZ_STEPS", () => {
  it("her kategoride 4 soru var (kategori seçimiyle birlikte 5 adım)", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      expect(QUIZ_STEPS[cat]).toHaveLength(4);
    }
  });

  it("her soruda en az 2 seçenek var ve anahtarlar tekrarlanmıyor", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      for (const adim of QUIZ_STEPS[cat]) {
        expect(adim.opts.length).toBeGreaterThanOrEqual(2);
        const keys = adim.opts.map((o) => o.key);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it("3. ve 4. sorularda (q4, q5) filtre koymayan bir 'fark' seçeneği var", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      for (const i of [2, 3]) {
        expect(QUIZ_STEPS[cat][i].opts.map((o) => o.key)).toContain("fark");
      }
    }
  });

  it("filtre adımlarındaki her seçenek ya filtreli ya da bilinçli 'fark/bilmiyorum' (sessizce etkisiz seçenek yok)", () => {
    const tarafsiz = new Set(["fark", "bilmiyorum", "bir_iki", "karma", "rahat", "minimal"]);
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      QUIZ_STEPS[cat].forEach((adim, i) => {
        const kural = STEP_RULES[cat][i];
        if (!kural || kural === "rank") return;
        for (const opt of adim.opts) {
          if (tarafsiz.has(opt.key)) continue;
          expect(Object.keys(kural), `${cat} adım ${i + 1} seçenek ${opt.key}`).toContain(opt.key);
        }
      });
    }
  });

  it("kural dizisi soru sayısıyla aynı uzunlukta", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      expect(STEP_RULES[cat]).toHaveLength(QUIZ_STEPS[cat].length);
    }
  });
});

describe("encodeQuiz / decodeQuiz", () => {
  it("round-trip yapar (5 parça)", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "dizel", q5: "suv" };
    expect(encodeQuiz(answers)).toBe("oto,sehir,bakim,dizel,suv");
    expect(decodeQuiz(encodeQuiz(answers))).toEqual(answers);
  });

  it("eski 3 parçalı URL'leri q4=q5=fark ile kabul eder (geriye uyumluluk)", () => {
    expect(decodeQuiz("oto,sehir,bakim")).toEqual({ cat: "oto", q2: "sehir", q3: "bakim", q4: "fark", q5: "fark" });
  });

  it("eski 4 parçalı URL'leri q5=fark ile kabul eder; q4 aynen korunur", () => {
    expect(decodeQuiz("oto,sehir,bakim,dizel")).toEqual({ cat: "oto", q2: "sehir", q3: "bakim", q4: "dizel", q5: "fark" });
  });

  it("geçersiz kategoriyi reddeder", () => {
    expect(decodeQuiz("gecersiz,sehir,bakim,fark,fark")).toBeNull();
  });

  it("eksik parçaları reddeder", () => {
    expect(decodeQuiz("oto,sehir")).toBeNull();
  });

  it("boş q2/q3'ü reddeder", () => {
    expect(decodeQuiz("oto,,bakim,fark,fark")).toBeNull();
  });
});

describe("quizQ4Matches", () => {
  it("fark hiçbir şeyi elemez", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "fark", q5: "fark" };
    expect(quizQ4Matches(answers, {}, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(true);
  });

  it("oto: dizel seçimi benzinli aracı eler", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "dizel", q5: "fark" };
    expect(quizQ4Matches(answers, { fuel_type: "DIESEL" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "GASOLINE" }, "otomobil")).toBe(false);
  });

  it("oto: hibrit seçimi HYBRID ve PHEV'i kapsar", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim", q4: "hibrit", q5: "fark" };
    expect(quizQ4Matches(answers, { fuel_type: "HYBRID" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "PHEV" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(false);
  });

  it("moto: naked seçimi retro/cruiser'ı da kapsar, sport'u eler", () => {
    const answers: QuizAnswers = { cat: "moto", q2: "sehir", q3: "fark", q4: "naked", q5: "fark" };
    expect(quizQ4Matches(answers, { moto_type: "naked" }, "motosiklet")).toBe(true);
    expect(quizQ4Matches(answers, { moto_type: "retro" }, "motosiklet")).toBe(true);
    expect(quizQ4Matches(answers, { moto_type: "sport" }, "motosiklet")).toBe(false);
  });

  it("scooter: motor_watt aralığa göre filtrelenir, watt verisi olmayan elenir", () => {
    const answers: QuizAnswers = { cat: "scooter", q2: "kisa", q3: "rahat", q4: "guclu", q5: "fark" };
    expect(quizQ4Matches(answers, { motor_watt: 700 }, "e-scooter")).toBe(true);
    expect(quizQ4Matches(answers, { motor_watt: 350 }, "e-scooter")).toBe(false);
    expect(quizQ4Matches(answers, {}, "e-scooter")).toBe(false);
  });

  it("ebike: motor_watt aralığa göre filtrelenir, watt verisi olmayan elenir", () => {
    const answers: QuizAnswers = { cat: "ebike", q2: "kisa", q3: "orta", q4: "guclu", q5: "fark" };
    expect(quizQ4Matches(answers, { motor_watt: 700, bike_type: "mtb" }, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, {}, "e-bisiklet")).toBe(true); // q4 (tip) burada test edilen filtre değil
  });

  it("ebike: kargo seçimi sadece kargo tipini kapsar", () => {
    const answers: QuizAnswers = { cat: "ebike", q2: "orta", q3: "fark", q4: "kargo", q5: "fark" };
    expect(quizQ4Matches(answers, { bike_type: "kargo" }, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, { bike_type: "sehir" }, "e-bisiklet")).toBe(false);
  });

  it("ebike: katlanır seçimi katlanabilir tipini eşler", () => {
    const answers: QuizAnswers = { cat: "ebike", q2: "kisa", q3: "eco", q4: "katlanir", q5: "fark" };
    expect(quizQ4Matches(answers, { bike_type: "katlanabilir" }, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, { bike_type: "mtb" }, "e-bisiklet")).toBe(false);
  });

  it("karavan: kamper seçimi kamper-van tipini eşler", () => {
    const answers: QuizAnswers = { cat: "karavan", q2: "iki", q3: "minimal", q4: "kamper", q5: "fark" };
    expect(quizQ4Matches(answers, { karavan_type: "kamper-van" }, "karavan")).toBe(true);
    expect(quizQ4Matches(answers, { karavan_type: "cekme" }, "karavan")).toBe(false);
  });

  it("kamyon: 'yuk' seçimi van/panelvan kapsar, pickup'ı eler", () => {
    const answers: QuizAnswers = { cat: "kamyon", q2: "is", q3: "orta", q4: "yuk", q5: "fark" };
    expect(quizQ4Matches(answers, { body_type: "panelvan" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, { body_type: "van" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, { body_type: "pickup" }, "kamyonet")).toBe(false);
    expect(quizQ4Matches(answers, { body_type: "minivan" }, "kamyonet")).toBe(false);
    expect(quizQ4Matches(answers, {}, "kamyonet")).toBe(false);
  });

  it("kamyon: 'pickup' seçimi sadece pickup kapsar", () => {
    const answers: QuizAnswers = { cat: "kamyon", q2: "is", q3: "orta", q4: "pickup", q5: "fark" };
    expect(quizQ4Matches(answers, { body_type: "pickup" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, { body_type: "panelvan" }, "kamyonet")).toBe(false);
  });

  it("kamyon: eski 'dortcarpi' URL'i (artık geçersiz key) filtre koymaz", () => {
    const answers: QuizAnswers = { cat: "kamyon", q2: "is", q3: "orta", q4: "dortcarpi", q5: "fark" };
    expect(quizQ4Matches(answers, { body_type: "pickup" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, {}, "kamyonet")).toBe(true);
  });

  it("hepsi: elektrik seçimi EV + e-scooter/e-bisiklet kategorilerini kapsar", () => {
    const answers: QuizAnswers = { cat: "hepsi", q2: "sehir", q3: "bir_iki", q4: "elektrik", q5: "fark" };
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(true);
    expect(quizQ4Matches(answers, {}, "e-scooter")).toBe(true);
    expect(quizQ4Matches(answers, {}, "e-bisiklet")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "GASOLINE" }, "otomobil")).toBe(false);
  });

  it("hepsi: yakitli seçimi elektrikli olmayan her şeyi kapsar (çekme karavan dahil)", () => {
    const answers: QuizAnswers = { cat: "hepsi", q2: "macera", q3: "dort", q4: "yakitli", q5: "fark" };
    expect(quizQ4Matches(answers, { fuel_type: "DIESEL" }, "kamyonet")).toBe(true);
    expect(quizQ4Matches(answers, {}, "karavan")).toBe(true);
    expect(quizQ4Matches(answers, { fuel_type: "EV" }, "otomobil")).toBe(false);
    expect(quizQ4Matches(answers, {}, "e-scooter")).toBe(false);
  });
});

describe("calcQuizScore", () => {
  const scores = { scoreFiyat: 8, scoreKalite: 6, scorePerformans: 4 };

  it("oto dışı kategorilerde review eşleştirmesi yapmaz", () => {
    const result = calcQuizScore(scores, [{ usage_type: "city" }], { cat: "moto", q2: "sehir", q3: "guven", q4: "fark", q5: "fark" });
    expect(result.matchCount).toBe(0);
    expect(result.isRealMatch).toBe(false);
  });

  it("q3=bakim iken fiyat+kalite ağırlıklı skor hesaplar", () => {
    const result = calcQuizScore(scores, [], { cat: "oto", q2: "sehir", q3: "bakim", q4: "fark", q5: "fark" });
    expect(result.score).toBeCloseTo(8 * 0.5 + 6 * 0.5);
  });

  it("3'ten az eşleşme varsa isRealMatch false döner", () => {
    const result = calcQuizScore(
      scores,
      [{ usage_type: "city" }, { usage_type: "city" }],
      { cat: "oto", q2: "sehir", q3: "guven", q4: "fark", q5: "fark" }
    );
    expect(result.matchCount).toBe(2);
    expect(result.isRealMatch).toBe(false);
  });

  it("3+ eşleşme varsa isRealMatch true döner", () => {
    const reviews = [{ usage_type: "city" }, { usage_type: "city" }, { usage_type: "city" }];
    const result = calcQuizScore(scores, reviews, { cat: "oto", q2: "sehir", q3: "guven", q4: "fark", q5: "fark" });
    expect(result.matchCount).toBe(3);
    expect(result.isRealMatch).toBe(true);
  });

  it("uyumsuz usage_type'ları eleyerek eşleştirir", () => {
    const reviews = [{ usage_type: "city" }, { usage_type: "highway" }, { usage_type: "city" }];
    const result = calcQuizScore(scores, reviews, { cat: "oto", q2: "sehir", q3: "guven", q4: "fark", q5: "fark" });
    expect(result.matchCount).toBe(2);
  });
});

describe("answerAffectsResults — sonuç şeridi çip görünürlüğü", () => {
  const kategoriler = Object.keys(QUIZ_STEPS) as QuizCat[];

  it("karar kural tablosundan türer: 'fark' asla çip üretmez, kural tablosunda olan cevap üretir", () => {
    for (const cat of kategoriler) {
      QUIZ_STEPS[cat].forEach((adim, i) => {
        const kural = STEP_RULES[cat][i];
        for (const opt of adim.opts) {
          const beklenen = opt.key !== "fark" && (kural === "rank" || (!!kural && opt.key in kural));
          expect(answerAffectsResults(cat, (i + 1) as 1 | 2 | 3 | 4, opt.key), `${cat} adım ${i + 1} ${opt.key}`).toBe(beklenen);
        }
      });
    }
  });

  it("kısıtlamayan cevaplar çip üretmez (karma, rahat, minimal)", () => {
    expect(answerAffectsResults("oto", 1, "karma")).toBe(false);
    expect(answerAffectsResults("moto", 1, "karma")).toBe(false);
    expect(answerAffectsResults("kamyon", 1, "karma")).toBe(false);
    expect(answerAffectsResults("scooter", 2, "rahat")).toBe(false);
    expect(answerAffectsResults("karavan", 2, "minimal")).toBe(false);
  });

  it("kullanım/amaç/şarj/konfor cevapları artık çip üretir", () => {
    expect(answerAffectsResults("oto", 1, "sehir")).toBe(true);
    expect(answerAffectsResults("oto", 1, "zorlu")).toBe(true);
    expect(answerAffectsResults("moto", 1, "tur")).toBe(true);
    expect(answerAffectsResults("moto", 1, "offroad")).toBe(true);
    expect(answerAffectsResults("scooter", 2, "zor")).toBe(true);
    expect(answerAffectsResults("karavan", 2, "tamkonfor")).toBe(true);
    expect(answerAffectsResults("kamyon", 1, "aile")).toBe(true);
    expect(answerAffectsResults("hepsi", 1, "macera")).toBe(true);
  });

  it("sonucu etkileyen adımlar çip üretir", () => {
    expect(answerAffectsResults("oto", 2, "guven")).toBe(true);       // sıralama ağırlığı
    expect(answerAffectsResults("oto", 4, "suv")).toBe(true);
    expect(answerAffectsResults("moto", 2, "orta")).toBe(true);
    expect(answerAffectsResults("moto", 4, "otomatik")).toBe(true);
    expect(answerAffectsResults("scooter", 1, "orta")).toBe(true);
    expect(answerAffectsResults("scooter", 4, "hizli")).toBe(true);
    expect(answerAffectsResults("karavan", 1, "dort")).toBe(true);
    expect(answerAffectsResults("karavan", 4, "kompakt")).toBe(true);
    expect(answerAffectsResults("kamyon", 2, "agir")).toBe(true);
    expect(answerAffectsResults("kamyon", 4, "dortcek")).toBe(true);
    expect(answerAffectsResults("ebike", 1, "uzun")).toBe(true);
    expect(answerAffectsResults("ebike", 4, "mid")).toBe(true);
    expect(answerAffectsResults("hepsi", 2, "dort")).toBe(true);
    expect(answerAffectsResults("hepsi", 4, "yasam")).toBe(true);
  });

  it("'fark', 'bilmiyorum' ve 'bir_iki' (filtresiz cevaplar) çip üretmez", () => {
    expect(answerAffectsResults("scooter", 1, "bilmiyorum")).toBe(false);
    expect(answerAffectsResults("ebike", 1, "bilmiyorum")).toBe(false);
    expect(answerAffectsResults("hepsi", 2, "bir_iki")).toBe(false);
    expect(answerAffectsResults("moto", 4, "fark")).toBe(false);
  });

  it("boş/tanımsız key çip üretmez", () => {
    expect(answerAffectsResults("oto", 3, "")).toBe(false);
    expect(answerAffectsResults("oto", 4, "bilinmeyen-anahtar")).toBe(false);
  });

  it("her q4 ve q5 adımında tam olarak bir 'fark' key'i var (skip mantığı bozulmasın)", () => {
    for (const cat of kategoriler) {
      for (const i of [2, 3]) {
        expect(QUIZ_STEPS[cat][i].opts.filter((o) => o.key === "fark")).toHaveLength(1);
      }
    }
  });
});

describe("quizMatches — 5 adımlı sert filtreler (kategori bazında)", () => {
  const A = (cat: QuizCat, q2: string, q3: string, q4: string, q5: string): QuizAnswers => ({ cat, q2, q3, q4, q5 });
  const FARK = "fark";

  it("hiçbir sert cevap yoksa (hepsi 'fark') hiçbir kaydı elemez", () => {
    for (const cat of Object.keys(QUIZ_STEPS) as QuizCat[]) {
      expect(quizMatches(A(cat, FARK, FARK, FARK, FARK), {}, "otomobil")).toBe(true);
    }
  });

  it("oto q5 gövde: suv yalnız suv'u, sedan sedan+station'ı eşler; gövde verisi olmayan elenir", () => {
    expect(quizMatches(A("oto", "karma", "bakim", FARK, "suv"), { body_type: "suv" }, "otomobil")).toBe(true);
    expect(quizMatches(A("oto", "karma", "bakim", FARK, "suv"), { body_type: "hatchback" }, "otomobil")).toBe(false);
    expect(quizMatches(A("oto", "karma", "bakim", FARK, "suv"), {}, "otomobil")).toBe(false);
    expect(quizMatches(A("oto", "karma", "bakim", FARK, "sedan"), { body_type: "station" }, "otomobil")).toBe(true);
    expect(quizMatches(A("oto", "karma", "bakim", FARK, "hatchback"), { body_type: "hatchback" }, "otomobil")).toBe(true);
  });

  it("oto q4 yakıt + q5 gövde birlikte (AND)", () => {
    const dizelSuv = A("oto", "karma", "guven", "dizel", "suv");
    expect(quizMatches(dizelSuv, { fuel_type: "DIESEL", body_type: "suv" }, "otomobil")).toBe(true);
    expect(quizMatches(dizelSuv, { fuel_type: "DIESEL", body_type: "sedan" }, "otomobil")).toBe(false);
    expect(quizMatches(dizelSuv, { fuel_type: "GASOLINE", body_type: "suv" }, "otomobil")).toBe(false);
  });

  it("moto q5 vites: otomatik; scooter/CVT/DCT'yi (Yarı Otomatik) kapsar, manueli eler", () => {
    const oto = A("moto", "karma", FARK, FARK, "otomatik");
    expect(quizMatches(oto, { transmission: "Otomatik" }, "motosiklet")).toBe(true);
    expect(quizMatches(oto, { transmission: "CVT" }, "motosiklet")).toBe(true);
    expect(quizMatches(oto, { transmission: "Yarı Otomatik" }, "motosiklet")).toBe(true);
    expect(quizMatches(oto, { transmission: "Manuel" }, "motosiklet")).toBe(false);
    expect(quizMatches(A("moto", "karma", FARK, FARK, "manuel"), { transmission: "Manuel" }, "motosiklet")).toBe(true);
    expect(quizMatches(A("moto", "karma", FARK, FARK, "manuel"), { transmission: "Otomatik" }, "motosiklet")).toBe(false);
  });

  it("moto q3 motor hacmi + q4 tip + q5 vites birlikte; elektrikli (cc yok) yalnız 'fark etmez' hacimde kalır", () => {
    const hepsi = A("moto", "karma", "orta", "naked", "manuel");
    expect(quizMatches(hepsi, { engine_cc: 471, moto_type: "naked", transmission: "Manuel" }, "motosiklet")).toBe(true);
    expect(quizMatches(hepsi, { engine_cc: 649, moto_type: "naked", transmission: "Manuel" }, "motosiklet")).toBe(false);
    const ev = { fuel_type: "EV", moto_type: "scooter", transmission: "Otomatik" };
    expect(quizMatches(A("moto", "karma", FARK, "scooter", "otomatik"), ev, "motosiklet")).toBe(true);
    expect(quizMatches(A("moto", "karma", "kucuk", "scooter", "otomatik"), ev, "motosiklet")).toBe(false);
  });

  it("moto q4 scooter, üç tekerlekli scooter türevini de kapsar", () => {
    expect(quizMatches(A("moto", "karma", FARK, "scooter", FARK), { moto_type: "uc-tekerlekli" }, "motosiklet")).toBe(true);
  });

  it("scooter q2 günlük mesafe: menzil >= mesafenin ~2 katı; menzil verisi olmayan somut seçimde elenir", () => {
    expect(quizMatches(A("scooter", "kisa", "rahat", FARK, FARK), { range_km: 20 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "orta", "rahat", FARK, FARK), { range_km: 25 }, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "orta", "rahat", FARK, FARK), { range_km: 30 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "uzun", "rahat", FARK, FARK), { range_km: 59 }, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "uzun", "rahat", FARK, FARK), { range_km: 60 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "uzun", "rahat", FARK, FARK), {}, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, FARK), {}, "e-scooter")).toBe(true);
  });

  it("scooter q5 azami hız: sınırlar dahil (25 / 26–45 / 46+)", () => {
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, "dusuk"), { max_speed_kmh: 25 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, "dusuk"), { max_speed_kmh: 26 }, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, "orta"), { max_speed_kmh: 26 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, "orta"), { max_speed_kmh: 45 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, "hizli"), { max_speed_kmh: 46 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, "hizli"), {}, "e-scooter")).toBe(false);
  });

  it("karavan q2 kişi sayısı: en az o kadar yatak; q5 boy aralıkları sınırlar dahil", () => {
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, FARK), { berth: 2 }, "karavan")).toBe(true);
    expect(quizMatches(A("karavan", "dort", "minimal", FARK, FARK), { berth: 2 }, "karavan")).toBe(false);
    expect(quizMatches(A("karavan", "dort", "minimal", FARK, FARK), { berth: 3 }, "karavan")).toBe(true);
    expect(quizMatches(A("karavan", "dort", "minimal", FARK, FARK), {}, "karavan")).toBe(false);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, "kompakt"), { berth: 2, length_cm: 650 }, "karavan")).toBe(true);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, "kompakt"), { berth: 2, length_cm: 651 }, "karavan")).toBe(false);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, "orta"), { berth: 2, length_cm: 651 }, "karavan")).toBe(true);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, "orta"), { berth: 2, length_cm: 750 }, "karavan")).toBe(true);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, "buyuk"), { berth: 2, length_cm: 832.5 }, "karavan")).toBe(true);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, "buyuk"), { berth: 2, length_cm: 750 }, "karavan")).toBe(false);
  });

  it("kamyon q3 yük kapasitesi kovaları (≤800 / 801–1200 / 1201+); q5 çekiş 4x4 / 2 çeker", () => {
    expect(quizMatches(A("kamyon", "karma", "hafif", FARK, FARK), { payload_kg: 800 }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "karma", "hafif", FARK, FARK), { payload_kg: 805 }, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "karma", "orta", FARK, FARK), { payload_kg: 1200 }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "karma", "agir", FARK, FARK), { payload_kg: 1201 }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "karma", "agir", FARK, FARK), {}, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "karma", FARK, FARK, "dortcek"), { four_wd: true }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "karma", FARK, FARK, "dortcek"), { four_wd: false }, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "karma", FARK, FARK, "ikicek"), { four_wd: false }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "karma", FARK, FARK, "ikicek"), { four_wd: true }, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "karma", FARK, FARK, "ikicek"), {}, "kamyonet")).toBe(false);
  });

  it("ebike q2 mesafe, q5 motor tipi, q3 watt, q4 tip birlikte", () => {
    const sec = A("ebike", "orta", "eco", "sehir", "hub");
    const iyi = { range_km: 50, motor_watt: 250, bike_type: "sehir", motor_type: "hub-drive" };
    expect(quizMatches(sec, iyi, "e-bisiklet")).toBe(true);
    expect(quizMatches(sec, { ...iyi, range_km: 20 }, "e-bisiklet")).toBe(false);
    expect(quizMatches(sec, { ...iyi, motor_type: "mid-drive" }, "e-bisiklet")).toBe(false);
    expect(quizMatches(sec, { ...iyi, bike_type: "mtb" }, "e-bisiklet")).toBe(false);
    expect(quizMatches(sec, { ...iyi, motor_watt: 750 }, "e-bisiklet")).toBe(false);
    expect(quizMatches(A("ebike", FARK, "guclu", FARK, FARK), { motor_watt: 750 }, "e-bisiklet")).toBe(true);
    expect(quizMatches(A("ebike", FARK, "orta", FARK, FARK), { motor_watt: 750 }, "e-bisiklet")).toBe(true); // eski adres: orta artık filtre koymaz
    expect(quizMatches(A("ebike", FARK, FARK, FARK, "mid"), { motor_type: "mid-drive" }, "e-bisiklet")).toBe(true);
  });

  it("hepsi q2 kişi sayısı: otomobil koltuk, karavan yatak, motosiklet 2, scooter/bisiklet 1 kabul edilir", () => {
    const dort = A("hepsi", FARK, "dort", FARK, FARK);
    expect(quizMatches(dort, { seat_count: 5 }, "otomobil")).toBe(true);
    expect(quizMatches(dort, { seat_count: 2 }, "kamyonet")).toBe(false);
    expect(quizMatches(dort, { berth: 4 }, "karavan")).toBe(true);
    expect(quizMatches(dort, {}, "motosiklet")).toBe(false);
    expect(quizMatches(dort, {}, "e-scooter")).toBe(false);
    expect(quizMatches(A("hepsi", FARK, "bes_alti", FARK, FARK), { seat_count: 7 }, "otomobil")).toBe(true);
    expect(quizMatches(A("hepsi", FARK, "bes_alti", FARK, FARK), { seat_count: 4 }, "otomobil")).toBe(false);
    expect(quizMatches(A("hepsi", FARK, "bir_iki", FARK, FARK), {}, "e-bisiklet")).toBe(true);
  });

  it("hepsi q5 araç türü: kategoriye göre (4 tekerlek / 2 tekerlek / karavan)", () => {
    const dort = A("hepsi", FARK, FARK, FARK, "dort_teker");
    expect(quizMatches(dort, {}, "otomobil")).toBe(true);
    expect(quizMatches(dort, {}, "kamyonet")).toBe(true);
    expect(quizMatches(dort, {}, "motosiklet")).toBe(false);
    const iki = A("hepsi", FARK, FARK, FARK, "iki_teker");
    for (const slug of ["motosiklet", "e-scooter", "e-bisiklet"]) expect(quizMatches(iki, {}, slug)).toBe(true);
    expect(quizMatches(iki, {}, "karavan")).toBe(false);
    const yasam = A("hepsi", FARK, FARK, FARK, "yasam");
    expect(quizMatches(yasam, {}, "karavan")).toBe(true);
    expect(quizMatches(yasam, {}, "otomobil")).toBe(false);
  });

  it("hepsi q4 enerji + q5 tür birlikte: elektrikli 2 tekerlekli = e-scooter/e-bisiklet/elektrikli motosiklet", () => {
    const sec = A("hepsi", FARK, FARK, "elektrik", "iki_teker");
    expect(quizMatches(sec, {}, "e-scooter")).toBe(true);
    expect(quizMatches(sec, { fuel_type: "EV" }, "motosiklet")).toBe(true);
    expect(quizMatches(sec, { fuel_type: "GASOLINE" }, "motosiklet")).toBe(false);
  });

  it("oto q2 kullanım: şehir = A/B segment, yol = depo >= 50 L veya EV menzil >= 400 km, zorlu = AWD/4WD; karma filtre koymaz", () => {
    const sehir = A("oto", "sehir", FARK, FARK, FARK), yol = A("oto", "yol", FARK, FARK, FARK), zorlu = A("oto", "zorlu", FARK, FARK, FARK);
    expect(quizMatches(sehir, { segment: "B" }, "otomobil")).toBe(true);
    expect(quizMatches(sehir, { segment: "C" }, "otomobil")).toBe(false);
    expect(quizMatches(sehir, {}, "otomobil")).toBe(false);
    expect(quizMatches(yol, { fuel_type: "GASOLINE", tank_l: 50 }, "otomobil")).toBe(true);
    expect(quizMatches(yol, { fuel_type: "GASOLINE", tank_l: 45 }, "otomobil")).toBe(false);
    expect(quizMatches(yol, { fuel_type: "EV", ev_range_km: 400 }, "otomobil")).toBe(true);
    expect(quizMatches(yol, { fuel_type: "EV", ev_range_km: 399, tank_l: 80 }, "otomobil")).toBe(false);
    expect(quizMatches(zorlu, { drivetrain: "AWD" }, "otomobil")).toBe(true);
    expect(quizMatches(zorlu, { drivetrain: "4WD" }, "otomobil")).toBe(true);
    expect(quizMatches(zorlu, { drivetrain: "FWD" }, "otomobil")).toBe(false);
    expect(quizMatches(A("oto", "karma", FARK, FARK, FARK), {}, "otomobil")).toBe(true);
  });

  it("moto q2 kullanım: şehir <= 200 kg, tur = depo >= 14 L / EV >= 150 km, off-road = adventure/enduro/cross veya >= 190 mm", () => {
    const sehir = A("moto", "sehir", FARK, FARK, FARK), tur = A("moto", "tur", FARK, FARK, FARK), off = A("moto", "offroad", FARK, FARK, FARK);
    expect(quizMatches(sehir, { weight_kg: 200 }, "motosiklet")).toBe(true);
    expect(quizMatches(sehir, { weight_kg: 201 }, "motosiklet")).toBe(false);
    expect(quizMatches(tur, { fuel_type: "GASOLINE", tank_l: 14 }, "motosiklet")).toBe(true);
    expect(quizMatches(tur, { fuel_type: "GASOLINE", tank_l: 13 }, "motosiklet")).toBe(false);
    expect(quizMatches(tur, { fuel_type: "EV", ev_range_km: 259 }, "motosiklet")).toBe(true);
    expect(quizMatches(tur, { fuel_type: "EV", ev_range_km: 60 }, "motosiklet")).toBe(false);
    expect(quizMatches(off, { moto_type: "adventure" }, "motosiklet")).toBe(true);
    expect(quizMatches(off, { moto_type: "naked", ground_clearance_mm: 190 }, "motosiklet")).toBe(true);
    expect(quizMatches(off, { moto_type: "naked", ground_clearance_mm: 150 }, "motosiklet")).toBe(false);
    expect(quizMatches(off, { moto_type: "naked" }, "motosiklet")).toBe(false);
  });

  it("scooter q3 şarj: zor <= 7 sa, bazen <= 9 sa (ya da çıkarılabilir batarya); rahat filtre koymaz", () => {
    expect(quizMatches(A("scooter", "bilmiyorum", "zor", FARK, FARK), { charge_hours: 7 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "zor", FARK, FARK), { charge_hours: 8 }, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "bilmiyorum", "zor", FARK, FARK), { charge_hours: 12, removable_battery: true }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "zor", FARK, FARK), {}, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "bilmiyorum", "bazen", FARK, FARK), { charge_hours: 9 }, "e-scooter")).toBe(true);
    expect(quizMatches(A("scooter", "bilmiyorum", "bazen", FARK, FARK), { charge_hours: 10 }, "e-scooter")).toBe(false);
    expect(quizMatches(A("scooter", "bilmiyorum", "rahat", FARK, FARK), {}, "e-scooter")).toBe(true);
  });

  it("karavan q3 konfor: tam konfor = banyo + duş + mutfak, temel = mutfak, minimal filtre koymaz", () => {
    const tam = A("karavan", "iki", "tamkonfor", FARK, FARK), temel = A("karavan", "iki", "temel", FARK, FARK);
    const full = { berth: 2, has_bathroom: true, has_shower: true, has_kitchen: true };
    expect(quizMatches(tam, full, "karavan")).toBe(true);
    expect(quizMatches(tam, { ...full, has_shower: undefined }, "karavan")).toBe(false);
    expect(quizMatches(tam, { ...full, has_kitchen: false }, "karavan")).toBe(false);
    expect(quizMatches(temel, { berth: 2, has_kitchen: true }, "karavan")).toBe(true);
    expect(quizMatches(temel, { berth: 2 }, "karavan")).toBe(false);
    expect(quizMatches(A("karavan", "iki", "minimal", FARK, FARK), { berth: 2 }, "karavan")).toBe(true);
  });

  it("kamyon q2 amaç: iş = yük >= 800 kg, aile = >= 5 koltuk, macera = 4x4; karma filtre koymaz", () => {
    expect(quizMatches(A("kamyon", "is", FARK, FARK, FARK), { payload_kg: 800 }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "is", FARK, FARK, FARK), { payload_kg: 700 }, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "aile", FARK, FARK, FARK), { seat_count: 5 }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "aile", FARK, FARK, FARK), { seat_count: 3 }, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "macera", FARK, FARK, FARK), { four_wd: true }, "kamyonet")).toBe(true);
    expect(quizMatches(A("kamyon", "macera", FARK, FARK, FARK), { four_wd: false }, "kamyonet")).toBe(false);
    expect(quizMatches(A("kamyon", "karma", FARK, FARK, FARK), {}, "kamyonet")).toBe(true);
  });

  it("hepsi q2 kullanım: kategoriler arası kurallar (şehir, yol, iş, macera)", () => {
    const sehir = A("hepsi", "sehir", FARK, FARK, FARK), yol = A("hepsi", "yol", FARK, FARK, FARK);
    const is = A("hepsi", "is", FARK, FARK, FARK), macera = A("hepsi", "macera", FARK, FARK, FARK);
    // şehir
    expect(quizMatches(sehir, {}, "e-scooter")).toBe(true);
    expect(quizMatches(sehir, {}, "e-bisiklet")).toBe(true);
    expect(quizMatches(sehir, { weight_kg: 150 }, "motosiklet")).toBe(true);
    expect(quizMatches(sehir, { weight_kg: 250 }, "motosiklet")).toBe(false);
    expect(quizMatches(sehir, { segment: "A" }, "otomobil")).toBe(true);
    expect(quizMatches(sehir, { segment: "D" }, "otomobil")).toBe(false);
    expect(quizMatches(sehir, {}, "karavan")).toBe(false);
    expect(quizMatches(sehir, { payload_kg: 1000 }, "kamyonet")).toBe(false);
    // uzun yol
    expect(quizMatches(yol, {}, "karavan")).toBe(true);
    expect(quizMatches(yol, { fuel_type: "GASOLINE", tank_l: 60 }, "otomobil")).toBe(true);
    expect(quizMatches(yol, { fuel_type: "GASOLINE", tank_l: 14 }, "motosiklet")).toBe(true);
    expect(quizMatches(yol, {}, "e-scooter")).toBe(false);
    // iş
    expect(quizMatches(is, { payload_kg: 900 }, "kamyonet")).toBe(true);
    expect(quizMatches(is, { payload_kg: 900 }, "otomobil")).toBe(false);
    // macera
    expect(quizMatches(macera, {}, "karavan")).toBe(true);
    expect(quizMatches(macera, { four_wd: true }, "kamyonet")).toBe(true);
    expect(quizMatches(macera, { drivetrain: "AWD" }, "otomobil")).toBe(true);
    expect(quizMatches(macera, { moto_type: "enduro" }, "motosiklet")).toBe(true);
    expect(quizMatches(macera, {}, "e-bisiklet")).toBe(false);
  });

  it("quizQ4Matches yalnız 3. soruyu uygular (q5 görmezden gelinir)", () => {
    expect(quizQ4Matches(A("oto", "karma", "bakim", "dizel", "suv"), { fuel_type: "DIESEL", body_type: "hatchback" }, "otomobil")).toBe(true);
  });
});

describe("kisiKapasitesi", () => {
  it("kategoriye göre koltuk/yatak/varsayılan", () => {
    expect(kisiKapasitesi({ seat_count: 5 }, "otomobil")).toBe(5);
    expect(kisiKapasitesi({ seat_count: "7" }, "kamyonet")).toBe(7);
    expect(kisiKapasitesi({ berth: 4 }, "karavan")).toBe(4);
    expect(kisiKapasitesi({}, "karavan")).toBeNull();
    expect(kisiKapasitesi({}, "motosiklet")).toBe(2);
    expect(kisiKapasitesi({}, "e-scooter")).toBe(1);
    expect(kisiKapasitesi({}, "e-bisiklet")).toBe(1);
    expect(kisiKapasitesi({}, "otomobil")).toBeNull();
  });
});
