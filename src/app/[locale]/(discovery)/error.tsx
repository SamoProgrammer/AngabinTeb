"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/clinical/empty-state";

export default function DiscoveryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("states");
  return (
    <div className="w-full bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4">
        <ErrorState
          title={t("errorTitle")}
          hint={t("errorHint")}
        />
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold transition-colors self-center"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
