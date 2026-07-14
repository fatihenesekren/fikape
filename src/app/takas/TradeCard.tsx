import Link from "next/link";
import { stripModelGenRange } from "@/lib/modelDisplay";

const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

export function TradeCard({
  listing,
}: {
  listing: {
    id: number;
    city: string;
    paymentIntent: string;
    wantAnything: boolean;
    product: { brand: { name: string }; model: { name: string }; year: number | null };
  };
}) {
  return (
    <Link
      href={`/takas/${listing.id}`}
      className="block bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors"
    >
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{listing.product.brand.name}</div>
      <div className="font-bold text-gray-900">
        {stripModelGenRange(listing.product.model.name)}
        {listing.product.year && <span className="text-gray-400 font-normal ml-1.5">{listing.product.year}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">📍 {listing.city}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
          {PAYMENT_LABEL[listing.paymentIntent] ?? listing.paymentIntent}
        </span>
        {listing.wantAnything && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Marka fark etmez</span>
        )}
      </div>
    </Link>
  );
}
