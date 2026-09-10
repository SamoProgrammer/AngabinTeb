"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

export interface FormDrawerProps {
  openLabel: string;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

export function FormDrawer({ openLabel, title, closeLabel, children }: FormDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) ref.current?.close();
  };
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold hover:bg-primary-container transition-colors"
      >
        {openLabel}
      </button>
      <dialog
        ref={ref}
        onClick={onBackdropClick}
        className="m-0 ms-auto h-screen max-h-screen w-full max-w-md border-e border-outline-variant/30 bg-surface-container-lowest p-6 text-start shadow-tier-3 backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base sm:text-lg font-bold text-on-surface">{title}</h2>
          <form method="dialog">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {closeLabel}
            </button>
          </form>
        </div>
        <div className="mt-4">{children}</div>
      </dialog>
    </>
  );
}
