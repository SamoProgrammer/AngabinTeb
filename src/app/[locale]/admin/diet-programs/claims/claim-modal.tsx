"use client";

import { useRef, type ReactNode } from "react";
import { Eye, X } from "lucide-react";

export type ClaimModalSection = {
  title: string;
  body: string | null;
  emptyText: string;
  dir?: "auto" | "ltr" | "rtl";
  tone?: "plain" | "danger";
};

// One modal per row holding ALL view data (snapshot JSON, AI document,
// error). Forms and action buttons stay inline in the row. Native <dialog>:
// Esc + backdrop click close for free. Purely presentational.
export default function ClaimModal({
  openLabel,
  title,
  sections,
  children,
}: {
  openLabel: string;
  title: string;
  sections: ClaimModalSection[];
  children?: ReactNode;
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
        className="m-auto max-h-[85dvh] w-[min(48rem,92dvw)] rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-tier-3 backdrop:bg-black/50"
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
        <div className="flex max-h-[70dvh] flex-col gap-4 overflow-auto p-5">
          {sections.map((s) => (
            <section key={s.title} className="flex flex-col gap-1.5">
              <h3 className="text-xs font-extrabold text-on-surface-variant">{s.title}</h3>
              {s.body ? (
                <div
                  dir={s.dir ?? "auto"}
                  className={`whitespace-pre-wrap rounded-xl p-3 text-start text-[11px] leading-relaxed ${
                    s.tone === "danger"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-surface-container-low text-on-surface"
                  }`}
                >
                  {s.body}
                </div>
              ) : (
                <p className="text-[11px] text-on-surface-variant">{s.emptyText}</p>
              )}
            </section>
          ))}
          {children}
        </div>
      </dialog>
    </>
  );
}
