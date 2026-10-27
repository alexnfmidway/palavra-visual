"use client";

import { useState } from "react";

export function InterestPicker({ interests }: { interests: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(interest: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(interest)) next.add(interest);
      return next;
    });
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {interests.map((interest) => {
        const on = selected.has(interest);
        return (
          <li key={interest}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => toggle(interest)}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface hover:border-primary"
              }`}
            >
              {interest}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
