"use client";

import { useState } from "react";

interface Props {
  noteId: number;
  initialHelpfulCount: number;
  initialUserVote: boolean | null;
  isLoggedIn: boolean;
  isOwnNote: boolean;
}

// Usta notu faydalı/faydasız oyu — ReviewHelpfulButtons ile aynı desen.
export function ExpertNoteVoteButtons({ noteId, initialHelpfulCount, initialUserVote, isLoggedIn, isOwnNote }: Props) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const disabled = !isLoggedIn || isOwnNote || loading;

  async function vote(isHelpful: boolean) {
    if (disabled) return;
    setLoading(true);
    const prevVote = userVote;
    const prevCount = helpfulCount;

    setUserVote(isHelpful);
    setHelpfulCount((c) => {
      if (prevVote === true && !isHelpful) return c - 1;
      if (prevVote !== true && isHelpful) return c + 1;
      return c;
    });

    const res = await fetch(`/api/expert-notes/${noteId}/vote`, {
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

  const title = isOwnNote ? "Kendi notuna oy veremezsin" : isLoggedIn ? undefined : "Oy vermek için giriş yap";

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={() => vote(true)}
        disabled={disabled}
        className="flex items-center gap-1 font-semibold transition-colors disabled:cursor-default"
        style={{ color: userVote === true ? "#16a34a" : "#9ca3af" }}
        title={title ?? "Faydalı buldum"}
        aria-pressed={userVote === true}
      >
        <span aria-hidden="true">👍</span>
        <span>Faydalı{helpfulCount > 0 ? ` (${helpfulCount})` : ""}</span>
      </button>
      <button
        type="button"
        onClick={() => vote(false)}
        disabled={disabled}
        className="flex items-center gap-1 font-semibold transition-colors disabled:cursor-default"
        style={{ color: userVote === false ? "#dc2626" : "#9ca3af" }}
        title={title ?? "Faydasız buldum"}
        aria-pressed={userVote === false}
      >
        <span aria-hidden="true">👎</span>
      </button>
    </div>
  );
}
