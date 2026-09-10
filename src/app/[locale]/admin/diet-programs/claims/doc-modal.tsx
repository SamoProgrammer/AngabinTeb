"use client";

import { useRef } from "react";
import { Eye, X } from "lucide-react";

// Native <dialog> viewer for long AI documents / errors: no dependency,
// Esc + backdrop click close for free. Purely presentational.
export default function DocModal({
  openLabel,
  title,
  body,
  dir = "auto",
}: {
  openLabel: string;
  title: string;
  body: string;
  dir?: "auto" | "ltr" | "rtl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        <Eye size={14} aria-hidden="true" />
        <span>{openLabel}</span>
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="max-h-[85dvh] w-[min(48rem,92dvw)] rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-tier-3 backdrop:bg-black/50"
      >
        <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-outline-variant/20 bg-surface-container-lowest px-5 py-3">
          <span className="text-sm font-extrabold">{title}</span>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div dir={dir} className="max-h-[70dvh] overflow-auto whitespace-pre-wrap p-5 text-xs leading-loose">
          {body}
        </div>
      </dialog>
    </>
  );
}
