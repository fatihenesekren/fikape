// Gemini API — ücretsiz katman, canlı web araması KULLANMAZ (bkz. proje notu:
// Grounding with Google Search ToS'u sonuçların tek seferlik üretilip tüm
// ziyaretçilere önbellekli gösterilmesine izin vermiyor). Sadece modelin
// eğitim verisindeki genel bilgiyle düz metin üretimi yapılır.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class GeminiError extends Error {}

export async function generateGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY tanımlı değil.");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(`Gemini API hatası (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new GeminiError("Gemini boş yanıt döndürdü.");

  return text.trim();
}

// Serbest metin yerine yapılandırılmış JSON isteyen çağrılar için (ör. teknik
// özellik çıkarımı) — aynı ToS kısıtı burada da geçerli: web araması yok,
// model sadece kendi eğitim bilgisiyle cevap veriyor.
export async function generateGeminiJson(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY tanımlı değil.");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1000, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(`Gemini API hatası (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new GeminiError("Gemini boş yanıt döndürdü.");

  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini JSON olarak ayrıştırılamayan bir yanıt döndürdü.");
  }
}

export function currentGeminiModelVersion(): string {
  return GEMINI_MODEL;
}
