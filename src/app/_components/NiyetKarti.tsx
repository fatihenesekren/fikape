'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PRIORITIES = [
  { key: 'fi',    label: 'Fiyat / Değer', icon: '🏷', activeBg: '#EBF4FF', activeBorder: '#85B7EB', activeText: '#1a4a6e' },
  { key: 'ka',    label: 'Kalite',         icon: '🛡', activeBg: '#EEF7E2', activeBorder: '#97C459', activeText: '#2d5a0e' },
  { key: 'pe',    label: 'Performans',     icon: '⚡', activeBg: '#FEF0EB', activeBorder: '#F0997B', activeText: '#7a2a0e' },
  { key: 'karma', label: 'Dengeli',        icon: '⚖️', activeBg: '#F3F4F6', activeBorder: '#9ca3af', activeText: '#374151' },
];

const DETAIL_GROUPS = [
  { id: 'kullanim', label: 'Kullanım şekli',     options: ['Şehir içi', 'Otoyol', 'Karma'],      multi: true  },
  { id: 'bakim',    label: 'Bakım toleransı',    options: ['Düşük olsun', 'Orta', 'Farketmez'],  multi: false },
  { id: 'lpg',      label: "LPG'ye açık mısın?", options: ['Evet', 'Hayır'],                     multi: false },
];

export function NiyetKarti({ baseUrl = '/' }: { baseUrl?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detay, setDetay]       = useState<Record<string, Set<string>>>({});

  const togglePriority = (key: string) =>
    setSelected(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const toggleDetay = (gid: string, opt: string, multi: boolean) =>
    setDetay(prev => {
      const cur = new Set(prev[gid] ?? []);
      if (multi) { cur.has(opt) ? cur.delete(opt) : cur.add(opt); }
      else        { const was = cur.has(opt); cur.clear(); if (!was) cur.add(opt); }
      return { ...prev, [gid]: cur };
    });

  const handleUygula = () => {
    if (!selected.size) return;
    const sep = baseUrl.includes('?') ? '&' : '?';
    router.replace(`${baseUrl}${sep}niyet=${[...selected].join(',')}`);
  };

  return (
    <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 sm:p-6">
      <p className="text-base font-semibold text-gray-900 mb-0.5">Yeni araç mı arıyorsun?</p>
      <p className="text-sm text-gray-500 mb-4">
        Önceliklerini seç (birden fazla olabilir), sana göre sıralayalım.
      </p>

      {/* Öncelikler — çoklu toggle */}
      <div className="flex flex-wrap gap-2 mb-5">
        {PRIORITIES.map(p => {
          const on = selected.has(p.key);
          return (
            <button
              key={p.key}
              onClick={() => togglePriority(p.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all select-none"
              style={{
                background:  on ? p.activeBg     : '#fff',
                borderColor: on ? p.activeBorder  : '#e5e7eb',
                color:       on ? p.activeText    : '#6b7280',
              }}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Detay filtreler */}
      <div className="border-t border-gray-200 pt-4 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Ek tercihler{' '}
          <span className="font-normal normal-case">(isteğe bağlı)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DETAIL_GROUPS.map(g => (
            <div key={g.id}>
              <p className="text-xs text-gray-500 mb-1.5">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map(opt => {
                  const on = detay[g.id]?.has(opt) ?? false;
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleDetay(g.id, opt, g.multi)}
                      className="text-xs px-3 py-1 rounded-full border transition-all select-none"
                      style={{
                        background:  on ? '#f3f4f6' : '#fff',
                        borderColor: on ? '#9ca3af' : '#e5e7eb',
                        color:       on ? '#111827' : '#6b7280',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setSelected(new Set()); setDetay({}); }}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Seçimi sıfırla
        </button>
        <button
          onClick={handleUygula}
          disabled={!selected.size}
          className="px-6 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: selected.size ? '#111' : '#e5e7eb',
            color:      selected.size ? '#fff' : '#9ca3af',
            cursor:     selected.size ? 'pointer' : 'not-allowed',
          }}
        >
          Uygula →
        </button>
      </div>
    </div>
  );
}
