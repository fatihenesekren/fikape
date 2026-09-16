interface Props {
  mode: "SINGLE_CARD" | "REVIEWS_SUMMARY";
  summaryText: string;
}

// Gerçek yorum kartlarıyla (ReviewCard) KARIŞTIRILMASIN diye bilinçli olarak
// farklı bir görsel dil: avatar/rozet/oy butonu yok, ikon+renk+açıklama
// üçlüsüyle net "bu bir gerçek kullanıcı deneyimi değil" sinyali verir.
export function AiSummaryCard({ mode, summaryText }: Props) {
  const title = mode === "REVIEWS_SUMMARY" ? "AI Yorum Özeti" : "AI İzlenimi";
  const caption = mode === "REVIEWS_SUMMARY"
    ? "Bu araç için yazılan gerçek kullanıcı yorumlarının yapay zeka ile oluşturulmuş özetidir."
    : "Bu araç için henüz yeterli kullanıcı yorumu yok. Aşağıdaki metin, yapay zeka tarafından oluşturulmuş genel bir izlenimdir — gerçek bir kullanıcı deneyimi değildir ve puanlamayı etkilemez.";

  return (
    <div
      className="rounded-2xl p-5 space-y-2 border"
      style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%)", borderColor: "#E0E7FF" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
          style={{ background: "#6366F1", color: "#fff" }}
        >
          🤖 {title}
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{summaryText}</p>
      <p className="text-[11px] text-gray-400 leading-snug">{caption}</p>
    </div>
  );
}
