"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";

interface BlockedRow {
  userId: number;
  displayName: string | null;
  avatarUrl: string | null;
  since: string;
}

export function BlockedUsersSection({ initialBlocked }: { initialBlocked: BlockedRow[] }) {
  const [rows, setRows] = useState(initialBlocked);
  const [busy, setBusy] = useState<number | null>(null);

  async function unblock(uid: number) {
    setBusy(uid);
    try {
      const res = await fetch("/api/trades/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      if (res.ok) setRows((r) => r.filter((x) => x.userId !== uid));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div id="engellenenler">
      <h2 className="text-base font-bold text-gray-900 mb-1">Engellenen kullanıcılar</h2>
      <p className="text-xs text-gray-400 mb-3">
        Engellediğin kişiler seninle hiçbir takas ilanı üzerinden iletişim kuramaz.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-2xl px-4 py-5 text-center">
          Engellenen kimse yok.
        </p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {rows.map((r) => (
            <div key={r.userId} className="flex items-center gap-3 px-4 py-3">
              <Avatar displayName={r.displayName} avatarUrl={r.avatarUrl} seed={String(r.userId)} size={32} />
              <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">
                {r.displayName ?? "Kullanıcı"}
              </span>
              <button
                type="button"
                onClick={() => unblock(r.userId)}
                disabled={busy === r.userId}
                className="shrink-0 text-xs font-semibold text-link hover:text-link-deep disabled:opacity-60 transition-colors"
              >
                {busy === r.userId ? "Kaldırılıyor..." : "Engeli kaldır"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
