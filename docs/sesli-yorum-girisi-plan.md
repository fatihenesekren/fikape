# Sesli Yorum Girişi — Nihai Plan v3 (2 tur × 3 ajan review)

fikape.com · 2026-09-16 · v1 → v2: UX/erişilebilirlik, gizlilik/KVKK/güvenlik, mimari/kod-tekrar ajanları review etti. v2 → v3: aynı 3 ajan 2. turda v2'yi doğruladı, kalan boşlukları kapattı. Değişen/eklenen yerler **⟳** ile işaretli. **Bu sürüm uygulanabilir referanstır — implementasyona başlamadan önce §11'deki açık kararlar netleşmeli.**

## 0. Amaç ve kapsam

Araç yorumu yazma akışındaki serbest metin alanına ("Yorumun", opsiyonel, 500 karakter sınırı) sesli giriş özelliği eklemek. Kullanıcı mikrofon butonuna basar, konuşur, konuşma runtime'da (tarayıcı içinde) metne çevrilip textarea'ya yazılır. Kullanıcı sonucu görüp düzenleyip normal "Gönder" akışıyla kaydeder.

**Kapsam dışı:** Diğer free-text alanlar (Soru-Cevap, Usta notları, mesajlaşma vb.) bu turda dahil değil.

## 1. Etkilenen dosyalar

- [src/app/yorum-yaz/ReviewForm.tsx:536-554](../src/app/yorum-yaz/ReviewForm.tsx) — yeni yorum
- [src/app/yorumum/[id]/duzenle/EditReviewForm.tsx:158-165](../src/app/yorumum/[id]/duzenle/EditReviewForm.tsx) — düzenleme
- [src/app/yorumum/[id]/guncelle/UpdateReviewForm.tsx:159-166](../src/app/yorumum/[id]/guncelle/UpdateReviewForm.tsx) — güncelleme

Ortak desen: `detailText` state, `onChange={(e) => setDetailText(e.target.value.slice(0, 500))}`, sayaç `{detailText.length}/500` (460+ turuncu), `detailValidation`/`detailTouched` ile feedback (`onBlur` tetikler).

Sunucu tarafı doğrulama: `checkContent` submit anında server-side çalışıyor ([src/app/api/reviews/route.ts:35](../src/app/api/reviews/route.ts)) — input yöntemi (klavye/ses) fark etmeksizin final `detailText` aynı state'ten aynı submit akışından geçiyor. Sesli girişin moderasyon zincirine ayrı bir entegrasyon gerekmiyor.

## 2. Teknik yaklaşım

**Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`), tarayıcı yerleşik — fikape'ye API maliyeti yok.

**⟳ `recognition.lang = 'tr-TR'` zorunlu.** Belirtilmezse tarayıcı sistem diline düşer, Türkçe içerik sitesinde tanıma kalitesi düşebilir veya yanlış dil algılanabilir. Hook başlatılırken sabit olarak ayarlanır.

**Şeffaflık:** "Ses hiçbir zaman fikape sunucusuna gitmiyor" ifadesi yanıltıcı — Chrome/Edge'de ses akışı **tarayıcı vendor'ının (örn. Google) bulut STT sunucusuna** gider. Kullanıcıya gösterilecek metin: *"Sesiniz fikape'ye kaydedilmez; tarayıcınız (örn. Google) sesi anlık olarak metne çevirir, fikape bu süreçte sesi görmez veya saklamaz."*

Alternatif (Whisper API, ~$0.006/dk) bu turda kapsam dışı.

## 3. Tarayıcı desteği ve fallback

- Chrome/Edge (masaüstü+Android): iyi destek.
- Safari (iOS dahil): kısmi/tutarsız destek — "var ama bozuk" senaryosu §6'da ele alınıyor.
- Firefox: desteklemiyor.

Feature detection: `'webkitSpeechRecognition' in window || 'SpeechRecognition' in window`. Desteklenmiyorsa mikrofon butonu hiç render edilmez.

## 4. Karakter sınırı entegrasyonu

- Yalnızca **final** transcript sonuçları state'e commit edilir. İnterim (ara) sonuçlar textarea altında/üstünde soluk/italik bir önizleme satırında gösterilir (state'e yazılmaz), final geldiğinde önizleme temizlenip textarea'ya commit edilir.
- Her final parça geldiğinde mevcut kırpma mantığı aynen kullanılır: `.slice(0, 500)` — bu mantık `applyTextWithLimit(prev, next, 500)` adında paylaşılan bir util'de tekilleştirilir (bkz. §7 konum kararı).
- Limit dolduğunda kayıt otomatik durdurulur (`recognition.stop()`) ve kalıcı (toast değil) inline mesaj gösterilir: "Karakter sınırına ulaşıldığı için kayıt durduruldu, kalan kısmı elle ekleyebilirsiniz."
- Sesli girişten gelen final commit, `detailTouched`'ı da `true` yapar (yazmakla eşdeğer sayılır) — validasyon rengi sessizce atlanmaz.

## 5. UI/UX akışı ve durumlar

Projede toast/bildirim bileşeni yok (grep ile doğrulandı) — mevcut hata deseni her formda `error` state + sayfa üstü kırmızı banner, mikrofon hatası için konumsal olarak kopuk. Bunun yerine: mikrofon butonunun hemen altında/yanında küçük, geçici **inline mesaj** (`aria-live="polite"`).

**Beş buton durumu:**
1. `idle` — normal mikrofon ikonu, tıklanabilir.
2. `requesting-permission` — native izin prompt'u açık; buton disabled + spinner (çift tetikleme engellenir).
3. `listening` — nabız/pulse animasyonu, `aria-pressed="true"`. **⟳ `prefers-reduced-motion` sorgusunda animasyon statik bir göstergeye (renk/ikon değişimi) düşer** (bkz. §9).
4. `error` — kısa süreli uyarı rengi, altında/yanında inline mesaj, sonra otomatik `idle`'a döner.
5. `unsupported` — buton hiç render edilmez.

Akış:
1. Kullanıcı mikrofon ikonuna basar.
2. İlk kullanımda native prompt'tan önce kısa bir bağlamsal açıklama: "Yorumunuzu sesli girmek için mikrofon izni gerekir. Ses fikape'de saklanmaz, sadece anlık metne çevrilir." + gizlilik sayfasına link.
3. Native izin prompt'u.
4. `listening` durumu: ikon pulse, interim önizleme görünür.
5. Kullanıcı tekrar basınca veya sessizlik/timeout'ta durur, `idle`'a döner.
6. Metin textarea'da düzenlenebilir, normal gönder akışı değişmez.

## 6. Hata ve edge-case senaryoları

- Mikrofon izni reddedilirse: `error` durumunda kısa inline mesaj ("Mikrofon izni verilmedi"), textarea'ya normal yazmaya devam edilebilir.
- `no-speech`/`network` event'leri: inline mesajla bildirilir, **otomatik yeniden başlatma (auto-restart) yapılmaz** — bilinçli tasarım kararı, mikrofonun kullanıcı haberi olmadan arka planda açık kalmasını önler.
- "Var ama bozuk" senaryosu (Safari/mobil): API mevcut ama belirli bir süre (8-10 sn) hiç final/interim sonuç gelmezse otomatik `error` durumuna geçilir: "Ses algılanamadı, tekrar deneyin veya yazarak devam edin."
- Çift tetikleme guard'ı: `isListening` tek bir state/ref ile korunur; dinlerken tekrar basılırsa yeni `recognition` başlatılmaz, mevcut olan durdurulur.
- Cleanup: unmount, route değişimi, sekme gizlenmesinde durdurma çağrılır. Formlar arası state resetlenirken (`productSlug` değişince, `ReviewForm.tsx:158-177`) aktif dinleme de iptal edilir.
- **⟳ Render-safe cleanup kısıtı (kritik, implementasyon detayı):** `ReviewForm.tsx`'teki `productSlug` reset bloğu **render sırasında** çalışıyor (useEffect değil — bilinçli proje deseni, kod içinde yorumla belirtilmiş). Bu nedenle hook'un dinlemeyi durduran fonksiyonu (`stop`/`abort`) **render-safe olmak zorunda**: yalnızca `recognitionRef.current` üzerinde senkron `abort()` çağırıp ref'i temizleyen, **hiçbir state güncellemesi yapmayan** saf bir fonksiyon olarak yazılmalı. State güncellemesi (örn. `status` sıfırlama) yalnızca hook'un kendi event handler'larında veya bir sonraki effect'te yapılmalı — render fazına side-effect sızdırılmamalı. Bu ayrım implementasyon sırasında hook tasarımının ilk kararı olmalı.

## 7. Ortak mimari

**Sorumluluk ayrımı:**
- `useSpeechToText` hook'u **sadece transkripsiyon durumunu** döndürür: `{ status, finalTranscript, interimTranscript, error, start, stop }`. Hook state'e (`detailText`) hiç dokunmaz, `setDetailText`'i çağırmaz.
- Her form kendi `onFinalTranscript` callback'inde `applyTextWithLimit` util'ini çağırır ve `detailTouched`'ı `true` yapar. **⟳ Netleştirme:** bu yalnızca *limit kırpma mantığını* tekilleştirir — `onFinalTranscript` callback'inin kendisi (state set + touched set + buton render wiring) yine 3 formda ayrı ayrı yazılacak (2-3 satırlık wiring, gerçek iş mantığı tekrarı değil). Plan bunu "kod tekrarını tamamen önler" gibi sunmaz, sınırı nettir.

**⟳ Dosya konumları (round 2'de netleştirildi):**
- `useSpeechToText` → `src/hooks/useSpeechToText.ts` (projede henüz `src/hooks/` dizini yok — bu ilk custom hook olacak, dizin bu vesileyle açılır).
- `applyTextWithLimit` → `src/lib/reviewValidation.ts` içine, mevcut `validateDetailShort`'un yanına eklenir (yeni dosya açılmaz).
- `VoiceInputButton` → `src/components/review/FormPrimitives.tsx` içine eklenir. **⟳ Düzeltme:** `SectionCard`/`FieldFeedback` ayrı dosyalar değil, ikisi de zaten bu tek dosyada tanımlı — `VoiceInputButton` da oraya eklenir, yeni dosya gerekmez.

**TypeScript tip güvenliği:** `SpeechRecognition`/`webkitSpeechRecognition` DOM lib'de tanımlı değil. `src/types/speech-recognition.d.ts` içinde minimal, projeye özel arayüz tanımlanır (`SpeechRecognitionEvent`, `SpeechRecognitionErrorEvent`, `ISpeechRecognition`), `window` genişletilir. `any` kullanılmaz.

**Test edilebilirlik:** `useSpeechToText`, `window.SpeechRecognition`'a sert bağımlı olmayacak şekilde constructor'ı enjekte edilebilir (DI) yazılır. Asgari birim test listesi: final-transcript-append, limit-durdurma, error-mapping, **⟳ interim-transcript önizleme, cleanup/abort çağrısının doğru tetiklendiği.**

**Efor tahmini:** İyimser 1–1.5 gün (hook + tipler + component + 3 forma entegrasyon). Gerçekçi 2–3 gün — mobil Safari gerçek cihaz testi ve render-safe cleanup tasarımı (§6) süreyi uzatır.

## 8. Gizlilik / KVKK

Ses verisi fikape sunucusuna gönderilmiyor/saklanmıyor. Tarayıcı vendor'ının (örn. Google) bulut STT servisi sesi işliyor — bu üçüncü taraf veri akışı kullanıcıya bildirilecek:

- Mikrofon butonuna ilk basışta bağlamsal açıklama (bkz. §5 adım 2).
- Gizlilik sayfasına (`src/app/gizlilik/page.tsx`) yeni madde eklenecek.

**⟳ Round 2'de kapatılamayan, implementasyon öncesi karar gerektiren hukuki noktalar (kurucu/hukuk danışmanı onayı gerekli — bu plan bunları kendiliğinden çözemez):**

1. **Gizlilik sayfası metninin kesin dili:** Taslak edilen "bu işlem fikape'nin veri işleme sözleşmesi kapsamında değildir" cümlesi risklidir — KVKK'da veri sorumlusu (fikape) üçüncü tarafı (Google) seçtiği için sorumluluktan tamamen ayrışamayabilir. Bu cümle **hukuk danışmanı onayı almadan yayınlanmamalı**; daha temkinli bir ifade (örn. sadece "tarayıcınızın konuşma tanıma servisi bu veriyi işler, ilgili sağlayıcının gizlilik politikası geçerlidir" — sorumluluk iddiası içermeyen) implementasyon öncesi belirlenmeli.
2. **Açık rıza mekanizması:** Tarayıcının native mikrofon izni, KVKK md.5/6 anlamında "açık rıza" ile aynı şey değildir (donanım erişimi izni ≠ üçüncü tarafa veri işleme rızası). §5 adım 2'deki bağlamsal açıklama şu an sadece **bilgilendirme**, aktif bir onay kutusu değil. Bu yeterli mi yoksa ayrı bir onay checkbox'ı mı gerekiyor — kurucunun/hukuk danışmanının kararı; plan bu soruyu netleştirmeden implementasyona geçmemeli.
3. **Veri işleyenler envanteri:** Projede böyle bir envanter var mı, varsa Google STT'nin oraya eklenmesi gerekip gerekmediği implementasyon öncesi kontrol edilmeli (bu plan bunu araştırmadı).
4. **Vendor retention politikası:** Google'ın (veya diğer vendor'ların) STT sırasında sesi kendi tarafında ne kadar süre/ne amaçla tuttuğu fikape'nin kontrolü dışında — gizlilik metninde bu belirsizlik "vendor'ın kendi politikası geçerlidir" şeklinde dürüstçe yansıtılmalı, fikape garanti vermemeli.

Sonuç metin (transcript), mevcut moderasyon/content-filter zincirinden mevcut haliyle geçer (bkz. §1).

## 9. Erişilebilirlik

- Gerçek `<button type="button">` elementi zorunlu (klavye Tab+Enter/Space native çalışır).
- `aria-label` durumla değişir: "Sesli giriş başlat" / "Kaydı durdur".
- `aria-pressed` dinleme durumunu taşır.
- Görünmez (`sr-only`) `aria-live="polite"` durum metni: "Dinleniyor…", "Kayıt durdu", "500 karakter sınırına ulaşıldı".
- **⟳ `prefers-reduced-motion` sorgusu:** `listening` pulse animasyonu bu tercih açıkken statik bir göstergeye (renk/ikon değişimi) düşer.
- **⟳ Dokunma hedefi:** mikrofon butonu mobilde minimum 44×44px dokunma alanına sahip olmalı (mevcut buton stillerinden miras alınabilir, implementasyonda teyit edilecek).

## 10. Test planı (özet)

- Birim: final-transcript-append, limit-durdurma, error-mapping, interim-önizleme, cleanup/abort tetiklenmesi (mock `SpeechRecognition` ile, DI üzerinden).
- Manuel: Chrome masaüstü, Chrome Android, Safari iOS (gerçek cihaz — emülatörde garanti değil), Firefox (buton hiç görünmemeli), klavye-only gezinme, ekran okuyucu (VoiceOver/NVDA) ile durum anonsu, `prefers-reduced-motion` açıkken görsel kontrol.

## 11. İmplementasyon öncesi kararlar — KİLİTLENDİ (2026-09-16)

- [x] **Gizlilik sayfası metni:** Mevcut §6 "Üçüncü Taraf Hizmetleri" listesine (`src/app/gizlilik/page.tsx:108-120`) aynı üslupla ("kendi gizlilik politikası kapsamında hareket eder") Google/tarayıcı konuşma tanıma servisi eklenir. Detaylı KVKK metni **avukat onayı bekliyor** notuyla işaretlenir (Usta Görüşleri hafıza kaydındaki emsal yaklaşım).
- [x] **Açık rıza mekanizması:** Ayrı onay checkbox'ı YOK — mevcut üçüncü taraf servisleri (Supabase/Vercel/Resend) için de checkbox yok, sadece bağlamsal bilgilendirme var. Tutarlılık için sesli girişte de yalnızca bağlamsal açıklama (§5 adım 2) kullanılır.
- [x] **Veri işleyenler envanteri:** Zaten var (`src/app/gizlilik/page.tsx` §6), Google STT bu listeye eklenecek.
- [x] **`VoiceInputButton` konumu:** `src/components/review/FormPrimitives.tsx` içine eklenir.

Plan implementasyona hazır.
