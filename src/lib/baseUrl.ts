// Tek kaynak: e-posta bağlantıları (sıfırlama/doğrulama token'ı taşır) ve site adresi aynı değeri kullanır; env'ler farklıysa
// bağlantılar sessizce başka bir alan adına gitmesin.
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.AUTH_URL ??
  process.env.NEXTAUTH_URL ??
  "https://fikape-e4t7.vercel.app";
