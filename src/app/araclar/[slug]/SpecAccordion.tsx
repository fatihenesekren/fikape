"use client";

import { useState } from "react";

type SpecItem = { label: string; value: string };

export function SpecAccordion({ specs }: { specs: SpecItem[] }) {
  const [open, setOpen] = useState(false);
  if (specs.length === 0) return null;

  const left = specs.filter((_, i) => i % 2 === 0);
  const right = specs.filter((_, i) => i % 2 === 1);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gray-400">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Teknik Özellikler
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-3">
          <div className="grid grid-cols-2">
            <div className="border-r border-gray-100 pr-5">
              {left.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-baseline py-2.5 border-b border-gray-50 text-sm last:border-b-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-800 text-right ml-4">{value}</span>
                </div>
              ))}
            </div>
            <div className="pl-5">
              {right.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-baseline py-2.5 border-b border-gray-50 text-sm last:border-b-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-800 text-right ml-4">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
