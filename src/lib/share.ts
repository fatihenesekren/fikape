// Site genelinde tutarlı "Paylaş" davranışı — önceden bazı butonlar
// (Takas ilanı, Usta notu) navigator.share desteklenmezse sessizce panoya
// kopyalıyordu; kullanıcı bunun yerine WhatsApp'ın açılmasını istedi
// (Türkiye'de WhatsApp fallback'i, sessiz kopyalamadan çok daha aksiyona
// dönüşüyor). Native paylaşım penceresi kullanıcı tarafından İPTAL
// edilirse (AbortError) WhatsApp'a düşülmez — kullanıcı bilinçli olarak
// paylaşmamayı seçmiştir, ardından beklenmedik bir WhatsApp sekmesi açmak
// rahatsız edici olurdu.
export async function shareOrOpenWhatsApp(params: { url: string; title?: string; text?: string }): Promise<void> {
  const { url, title, text } = params;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // desteklenmiyor ya da başka bir hata — WhatsApp'a düş
    }
  }

  const waText = text ? `${text} ${url}` : url;
  window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
}
