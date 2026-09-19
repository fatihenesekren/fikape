import type { CompareProductView } from "./CompareResultsGrid";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

type AiSummary = NonNullable<CompareProductView["aiSummary"]>;

// Satır etiketi bilinçli olarak nötr ("AI Değerlendirmesi") — hücreler duruma
// göre "AI İzlenimi" (yorumsuz, genel) ya da "AI Yorum Özeti" (gerçek yorum
// bazlı) gösterebiliyor, sabit bir etiketin ikisinden birinin adını ödünç
// alması (önceki "AI Özeti") kullanıcı için kafa karıştırıcıydı (bkz. geri
// bildirim). Rozetler de ek bir ikonla (🔮 vs 💬) ayrışıyor — sadece renk farkı
// hızlı taramada/renk körlüğünde yetersiz kalabilir.
function summaryLabel(summary: AiSummary): { title: string; muted: boolean; shortNote: string; icon: string } {
  if (summary.mode === "REVIEWS_SUMMARY") {
    return {
      title: `AI Yorum Özeti${summary.reviewCountAtGeneration ? ` (${summary.reviewCountAtGeneration} yorum)` : ""}`,
      muted: false,
      shortNote: "gerçek yorumlardan",
      icon: "💬",
    };
  }
  return { title: "AI İzlenimi", muted: true, shortNote: "gerçek yorum değildir", icon: "🔮" };
}

// Metin artık HER ZAMAN tam açık (önceki turdaki line-clamp+modal yerine —
// kullanıcı tercihi). Satırdaki en uzun metin satırın yüksekliğini belirler,
// kısa metinli hücrelerde altta doğal bir boşluk kalır — bunu "kayıp alan"
// değil "not her zaman aynı hizada" hissettirmek için hücre flex-col + h-full,
// şeffaflık ibaresi mt-auto ile en alta sabitleniyor (3 uzman ajanın ortak
// sonucu). Client state/modal kalmadığı için bu artık server component.
// Metnin önünde ayrıca "İzlenim:"/"Özet:" öneki YOK — rozet zaten bağlamı
// kuruyor, ikisi art arda aynı kelimeyi tekrarlıyordu (bkz. kullanıcı geri
// bildirimi).
// w-full (min-w-[180px] DEĞİL): UnifiedCompareTable artık table-fixed —
// sütun genişliği tabloca garanti altında, bir alt-eleman min-width ile
// bunu zorlarsa dar sütunlarda (3-4 araç, mobil) komşu hücrenin üzerine
// taşıyordu (canlıda bulunan gerçek hata, ekran görüntüsüyle doğrulandı).
function AiSummaryCell({ summary }: { summary: AiSummary }) {
  const { title, muted, shortNote, icon } = summaryLabel(summary);
  return (
    <div className="flex flex-col h-full w-full max-w-[260px]">
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 self-start"
        style={{ background: muted ? "#E0E7FF" : "#6366F1", color: muted ? "#4F46E5" : "#fff" }}
      >
        {icon} {title}
      </span>
      <p className="text-xs text-gray-700 italic leading-relaxed">{summary.summaryText}</p>
      <span className="text-[10px] text-amber-600 font-medium mt-auto pt-1.5">{shortNote}</span>
    </div>
  );
}

export function AiSummaryRow({ products }: { products: CompareProductView[] }) {
  return (
    <tr className="border-b border-gray-100">
      <th
        scope="row"
        className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 align-top"
      >
        <span className="inline-flex items-center gap-1">
          AI Değerlendirmesi
          <span
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold normal-case cursor-help shrink-0"
            title="Her araç için farklı olabilir: yeterli yorum varsa gerçek yorumların özeti, yoksa AI'nin genel izlenimi."
          >
            i
          </span>
        </span>
      </th>
      {products.map((p, i) => (
        <td key={p.slug} className={`${zebraColumnBg(i)} px-3 py-2.5 align-top`}>
          {p.aiSummary ? (
            <AiSummaryCell summary={p.aiSummary} />
          ) : (
            <span className="text-xs text-gray-300">Henüz özet yok</span>
          )}
        </td>
      ))}
    </tr>
  );
}
