"use client";

import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişime Geçildi",
  CONVERTED: "Dönüştü",
};

export function LeadStatusSelect({ id, status, kind }: { id: number; status: string; kind: "insurance" | "sale" }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setValue(next);
    setSaving(true);
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, kind }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={saving}
      className="text-xs font-medium rounded-lg border border-gray-200 px-2 py-1 bg-white"
    >
      {Object.entries(STATUS_LABEL).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  );
}
