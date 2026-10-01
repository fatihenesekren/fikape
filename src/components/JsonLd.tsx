// JSON.stringify "<", ">" ve "&" karakterlerini kaçışlamaz: kullanıcı metni (ör. yorum gövdesi) "</script>" içerirse
// JSON-LD bloğundan çıkılıp sayfada betik çalışabilir. Bu karakterler unicode kaçışı olarak yazılır (JSON açısından aynı değer).
const BS = String.fromCharCode(92); // ters eğik çizgi
const kacis = (kod: string) => BS + "u" + kod;

export function jsonLdGuvenli(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, kacis("003c"))
    .replace(/>/g, kacis("003e"))
    .replace(/&/g, kacis("0026"))
    .split(String.fromCharCode(0x2028)).join(kacis("2028"))
    .split(String.fromCharCode(0x2029)).join(kacis("2029"));
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: jsonLdGuvenli(data) }}
    />
  );
}
