"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";

export function DiaryDayPicker({ locale, day }: { locale: string; day: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <JalaliDatePicker
      locale={locale}
      value={day}
      max={new Date().toISOString().slice(0, 10)}
      onChange={(iso) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("day", iso);
        router.push(`?${params.toString()}`);
      }}
    />
  );
}
