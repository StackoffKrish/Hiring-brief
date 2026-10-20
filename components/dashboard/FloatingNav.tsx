"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const options = ["Option One", "Option Two", "Option Three"] as const;

type Option = (typeof options)[number];

export default function FloatingNav() {
  const [activeOption, setActiveOption] = useState<Option>(options[0]);

  return (
    <div className="flex w-full justify-center">
      <nav
        aria-label="Dashboard"
        className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-gray-200 bg-white p-1.5 shadow-lg shadow-gray-200/60"
      >
        {options.map((option) => {
          const isActive = option === activeOption;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveOption(option)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-6",
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              )}
            >
              {option}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
