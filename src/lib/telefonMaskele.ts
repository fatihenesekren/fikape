/** Telefonu listede maskeli gösterir: ilk 4 ve son 2 rakam kalır ("05551112233" → "0555 *** ** 33"). Kısa/bozuk değerler tamamen maskelenir. */
export function telefonMaskele(telefon: string): string {
  const rakamlar = telefon.replace(/\D/g, "");
  if (rakamlar.length < 8) return "••••••••";
  return `${rakamlar.slice(0, 4)} *** ** ${rakamlar.slice(-2)}`;
}
