import Link from "next/link";
import Image from "next/image";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { timeAgoTr } from "@/lib/timeAgo";

const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas (yakın değer)",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

export function TradeCard({
  listing,
  isMatch = false,
}: {
  listing: {
    id: number;
    city: string;
    paymentIntent: string;
    wantAnything: boolean;
    createdAt: Date;
    coverPhotoUrl?: string | null;
    product: { brand: { name: string }; model: { name: string }; year: number | null };
    userProduct?: { usageAmount: number | null; usageUnit: string | null } | null;
  };
  isMatch?: boolean;
}) {
  const km = listing.userProduct?.usageUnit === "km" ? listing.userProduct.usageAmount : null;
  return (
    <Link
      href={`/takas/${listing.id}`}
      className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors relative"
    >
      {isMatch && (
        <span
          className="absolute -top-2 -left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm"
          style={{ background: "#4338ca" }}
          title="İlan sahibinin aradığı kriterler senin aracınla, senin aradığın kriterler de onun aracıyla uyuşuyor"
        >
          ✨ Sana Uygun
        </span>
      )}
      {listing.coverPhotoUrl && (
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-50">
          <Image src={listing.coverPhotoUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{listing.product.brand.name}</div>
          <span className="text-[10px] text-gray-300 shrink-0">{timeAgoTr(listing.createdAt)}</span>
        </div>
        <div className="font-bold text-gray-900">
          {stripModelGenRange(listing.product.model.name)}
          {listing.product.year && <span className="text-gray-400 font-normal ml-1.5">{listing.product.year}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">📍 {listing.city}</span>
          {km != null && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {km.toLocaleString("tr-TR")} km
            </span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {PAYMENT_LABEL[listing.paymentIntent] ?? listing.paymentIntent}
          </span>
          {listing.wantAnything && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Marka fark etmez</span>
          )}
        </div>
      </div>
    </Link>
  );
}
