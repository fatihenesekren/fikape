"use client";

import { useRouter } from "next/navigation";

// "Geri" — anasayfadan, headerdaki bir bildirimden ya da başka bir sayfadan
// gelinmiş olabilir; sabit tek bir hedefe (ör. her zaman /profil) linklemek
// kullanıcıyı geldiği yerden koparır (kullanıcı fark etti). Tarayıcı
// geçmişi varsa oraya döner, yoksa (doğrudan link/yeni sekme/bookmark)
// `fallbackHref`'e düşer — yorumum/[id]/paylas/BackButton.tsx'teki aynı
// desen, burada paylaşılan bir bileşene çıkarıldı.
export function BackLink({ fallbackHref, label = "← Geri dön" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
    >
      {label}
    </button>
  );
}
