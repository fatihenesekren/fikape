export interface TrustBadge {
  icon: string;
  label: string;
  color: string;
  bg: string;
}

export const TRUST_BADGES: Record<number, TrustBadge> = {
  2: { icon: "✉️", label: "Doğrulanmış",           color: "#0C447C", bg: "#E6F1FB" },
  3: { icon: "📸", label: "Fotoğraf Doğrulamalı",   color: "#27500A", bg: "#EAF3DE" },
  5: { icon: "⚙️", label: "Admin",                  color: "#fff",    bg: "#111"    },
};

/** Profil sayfası için tüm seviyeleri kapsar */
export const TRUST_PROFILE: Record<number, TrustBadge> = {
  1: { icon: "",   label: "Üye",                   color: "#555",    bg: "#f3f4f6" },
  2: { icon: "✉️", label: "Doğrulanmış",           color: "#0C447C", bg: "#E6F1FB" },
  3: { icon: "📸", label: "Fotoğraf Doğrulamalı",   color: "#27500A", bg: "#EAF3DE" },
  5: { icon: "⚙️", label: "Admin",                  color: "#fff",    bg: "#111"    },
};
