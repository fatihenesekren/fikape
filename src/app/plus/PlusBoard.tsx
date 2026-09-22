"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLUS_SECTIONS, PLUS_FEATURE_CARDS, type PlusFeatureCard } from "@/lib/plusFeatures";

export function PlusBoard({ initialVotes, isLoggedIn }: { initialVotes: string[]; isLoggedIn: boolean }) {
  const router = useRouter();
  const [votes, setVotes] = useState<Set<string>>(() => new Set(initialVotes));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function toggle(card: PlusFeatureCard) {
    if (!isLoggedIn) {
      router.push("/giris?callbackUrl=%2Fplus");
      return;
    }
    if (pending.has(card.id)) return;

    setError(null);
    const nextActive = !votes.has(card.id);

    setVotes((prev) => {
      const next = new Set(prev);
      if (nextActive) next.add(card.id);
      else next.delete(card.id);
      return next;
    });
    setPending((prev) => new Set(prev).add(card.id));

    function revert() {
      setVotes((prev) => {
        const next = new Set(prev);
        if (nextActive) next.delete(card.id);
        else next.add(card.id);
        return next;
      });
    }

    try {
      const res = await fetch("/api/plus/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestKey: card.id, active: nextActive }),
      });
      if (!res.ok) {
        revert();
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Bir hata oluştu, tekrar dene.");
      }
    } catch {
      revert();
      setError("Bağlantı hatası, tekrar dene.");
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5" role="alert">
          {error}
        </p>
      )}

      {PLUS_SECTIONS.map((section) => {
        const cards = PLUS_FEATURE_CARDS.filter((c) => c.section === section.id);
        return (
          <section key={section.id} className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h2>
            <p className="text-sm text-gray-500 mb-4 max-w-xl">{section.subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cards.map((card) => {
                const active = votes.has(card.id);
                return (
                  <div
                    key={card.id}
                    className="flex flex-col min-w-0 border border-gray-100 bg-white rounded-2xl p-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-500 flex-1">{card.description}</p>

                    {section.interactive ? (
                      <button
                        type="button"
                        onClick={() => toggle(card)}
                        disabled={pending.has(card.id)}
                        aria-pressed={active}
                        className={
                          active
                            ? "mt-3 self-start text-xs font-medium rounded-full px-3 py-1.5 bg-link-deep text-white transition-colors disabled:opacity-60"
                            : "mt-3 self-start text-xs font-medium rounded-full px-3 py-1.5 border border-link-line text-link-deep hover:bg-link-soft transition-colors disabled:opacity-60"
                        }
                      >
                        {active ? "✓ İlgileniyorum" : "İlgileniyorum"}
                      </button>
                    ) : (
                      <span className="mt-3 self-start text-xs font-medium rounded-full px-3 py-1.5 bg-gray-50 text-gray-400 border border-gray-100">
                        Uzak vizyon — henüz plan yok
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {!isLoggedIn && (
        <p className="text-xs text-gray-400">
          İlgi alanı işaretlemek için{" "}
          <Link href="/giris?callbackUrl=%2Fplus" className="underline hover:text-gray-600">
            giriş yapmalısın
          </Link>
          .
        </p>
      )}
    </div>
  );
}
