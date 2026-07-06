"use client";

import { useState } from "react";

interface Props {
  reviewId: number;
  initialHelpfulCount: number;
  initialUserVote: boolean | null;
  isLoggedIn: boolean;
}

export function ReviewHelpfulButtons({ reviewId, initialHelpfulCount, initialUserVote, isLoggedIn }: Props) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  async function vote(isHelpful: boolean) {
    if (!isLoggedIn || loading) return;
    setLoading(true);
    const prevVote = userVote;
    const prevCount = helpfulCount;

    // İyimser güncelleme
    setUserVote(isHelpful);
    setHelpfulCount((c) => {
      if (prevVote === true && !isHelpful) return c - 1;
      if (prevVote !== true && isHelpful) return c + 1;
      return c;
    });

    const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHelpful }),
    });

    if (res.ok) {
      const data = await res.json() as { helpfulCount: number };
      setHelpfulCount(data.helpfulCount);
    } else {
      setUserVote(prevVote);
      setHelpfulCount(prevCount);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={() => vote(true)}
        disabled={!isLoggedIn || loading}
        className="flex items-center gap-1 font-semibold transition-colors disabled:cursor-default"
        style={{ color: userVote === true ? "#16a34a" : "#9ca3af" }}
        title={isLoggedIn ? "Faydalı buldum" : "Oy vermek için giriş yap"}
        aria-label={isLoggedIn ? "Yorumu faydalı buldum" : "Oy vermek için giriş yap"}
        aria-pressed={userVote === true}
      >
        <span>👍</span>
        <span>Faydalı{helpfulCount > 0 ? ` (${helpfulCount})` : ""}</span>
      </button>
      <button
        type="button"
        onClick={() => vote(false)}
        disabled={!isLoggedIn || loading}
        className="flex items-center gap-1 font-semibold transition-colors disabled:cursor-default"
        style={{ color: userVote === false ? "#dc2626" : "#9ca3af" }}
        title={isLoggedIn ? "Faydasız buldum" : "Oy vermek için giriş yap"}
        aria-label={isLoggedIn ? "Yorumu faydasız buldum" : "Oy vermek için giriş yap"}
        aria-pressed={userVote === false}
      >
        <span aria-hidden="true">👎</span>
      </button>
    </div>
  );
}
