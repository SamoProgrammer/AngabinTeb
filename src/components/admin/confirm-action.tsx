"use client";

import { useRef, type ReactNode } from "react";

export interface ConfirmActionProps {
  openLabel: string;
  title: string;
  message: string;
  confirmSlot: ReactNode;
  cancelLabel: string;
}

export function ConfirmAction({ openLabel, title, message, confirmSlot, cancelLabel }: ConfirmActionProps) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="px-4 py-2 rounded-xl border border-error/30 text-error text-xs sm:text-sm font-bold hover:bg-error/10 transition-colors"
      >
        {openLabel}
      </button>
      <dialog
        ref={ref}
        className="w-full max-w-sm rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-start shadow-tier-3 backdrop:bg-black/40"
      >
        <h2 className="text-base sm:text-lg font-bold text-on-surface">{title}</h2>
        <p className="mt-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">{message}</p>
        <div className="mt-4 flex items-center gap-2">
          {confirmSlot}
          <form method="dialog">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {cancelLabel}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
