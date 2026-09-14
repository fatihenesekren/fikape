"use client";

import { useState } from "react";

// Topluluk iletişim teyidi — önceden mesaj thread'inin İÇİNDE, "İletişime
// geçtiğiniz telefon/adres bilgisi doğru muydu?" diye soruluyordu; kullanıcı
// bunun neden orada sorulduğunu anlamadı, haklıydı — bağlamsızdı. Artık
// iletişim bilgisinin GÖSTERİLDİĞİ yerde (bu profildeki İletişim bloğu)
// soruluyor. Yetki kuralı DEĞİŞMEDİ: API hâlâ yalnız bu ustayla gerçekten
// bir mesaj thread'i başlatmış kullanıcıları kabul ediyor — bu bileşen de
// yalnız o koşul sağlandığında render ediliyor (bkz. usta/[slug]/page.tsx).
export function ContactFeedbackWidget({
  expertProfileId,
  initialValue,
}: {
  expertProfileId: number;
  initialValue: boolean | null;
}) {
  const [value, setValue] = useState(initialValue);
  const [sending, setSending] = useState(false);

  async function sendFeedback(isAccurate: boolean) {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/expert-profiles/${expertProfileId}/contact-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAccurate }),
      });
      if (res.ok) setValue(isAccurate);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
      <p className="text-xs text-gray-500">Bu ustayla daha önce mesajlaştınız — yukarıdaki bilgiler doğru muydu?</p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={sending}
          onClick={() => sendFeedback(true)}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
            value === true ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Evet
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => sendFeedback(false)}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
            value === false ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Hayır
        </button>
      </div>
    </div>
  );
}
