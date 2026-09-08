"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatJalaliDate, formatJalaliDay, jalaliLocale, TEHRAN_TIME_ZONE } from "@/lib/format";
import {
  addDays,
  gregorianIso,
  jalaliMonthLength,
  jalaliMonthStart,
  parseIso,
  saturdayFirstIndex,
  tehranTodayIso,
} from "@/lib/jalali";

export interface JalaliDatePickerProps {
  locale?: string;
  /** Hidden-input name for plain HTML forms (emits Gregorian yyyy-mm-dd). */
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (gregorianIso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  id?: string;
  buttonClassName?: string;
}

// Saturday-first weekday headers, localized via Intl.
function weekdayNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    weekday: "short",
  });
  // 2024-03-23T12:00Z was a Saturday in Tehran.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(Date.UTC(2024, 2, 23 + i, 12))),
  );
}

function monthTitle(monthStart: Date, locale: string): string {
  return new Intl.DateTimeFormat(jalaliLocale(locale), {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "long",
  }).format(monthStart);
}

export function JalaliDatePicker({
  locale = "fa",
  name,
  defaultValue,
  value,
  onChange,
  min,
  max,
  required,
  id,
  buttonClassName,
}: JalaliDatePickerProps) {
  const t = useTranslations("common");
  const isRtl = locale !== "en";
  const [open, setOpen] = useState(false);
  const [innerIso, setInnerIso] = useState(
    () => defaultValue || value || tehranTodayIso(),
  );
  const [anchor, setAnchor] = useState<Date>(
    () => parseIso(defaultValue || value || tehranTodayIso()) ?? new Date(),
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Fixed position in viewport coords. The panel portals to document.body so
  // no ancestor stacking context or overflow can clip it or paint over it.
  const [panelPos, setPanelPos] = useState<{ top: number; start: number } | null>(null);

  const selectedIso = value ?? innerIso;

  const placePanel = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 288; // w-72
    const start = isRtl
      ? Math.max(8, window.innerWidth - rect.right - width)
      : Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    setPanelPos({
      top: Math.min(rect.bottom + 8, window.innerHeight - 8),
      start,
    });
  };

  useEffect(() => {
    if (value) {
      const parsed = parseIso(value);
      if (parsed) setAnchor(parsed);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    placePanel();
    const onDown = (e: MouseEvent) => {
      const el = e.target as Node;
      if (
        boxRef.current &&
        !boxRef.current.contains(el) &&
        !(panelRef.current && panelRef.current.contains(el))
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => placePanel();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const monthStart = useMemo(() => jalaliMonthStart(anchor), [anchor]);
  const monthLen = useMemo(() => jalaliMonthLength(monthStart), [monthStart]);
  const leadBlanks = useMemo(() => saturdayFirstIndex(monthStart), [monthStart]);
  const names = useMemo(() => weekdayNames(locale), [locale]);

  const pick = (iso: string) => {
    if (!value) setInnerIso(iso);
    onChange?.(iso);
    setOpen(false);
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div ref={boxRef} dir={isRtl ? "rtl" : "ltr"}>
      {name && <input type="hidden" name={name} value={selectedIso} required={required} />}
      <button
        type="button"
        id={id}
        ref={buttonRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          buttonClassName ??
          "inline-flex items-center gap-2 bg-surface-container-low text-xs sm:text-sm text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
        }
      >
        <Calendar size={18} className="text-primary shrink-0" aria-hidden="true" />
        <span className="font-bold">
          {formatJalaliDate(parseIso(selectedIso) ?? new Date(), locale, {
            weekday: "short",
          })}
        </span>
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t("datepicker.dialogLabel")}
            dir={isRtl ? "rtl" : "ltr"}
            className="fixed z-[100] w-72 max-h-[80vh] overflow-y-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-tier-3"
            style={{
              top: panelPos.top,
              ...(isRtl ? { right: panelPos.start } : { left: panelPos.start }),
            }}
          >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label={t("datepicker.prevMonth")}
              onClick={() => setAnchor((a) => addDays(jalaliMonthStart(a), -1))}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              <PrevIcon size={18} aria-hidden="true" />
            </button>
            <span className="text-sm font-extrabold text-on-surface">
              {monthTitle(monthStart, locale)}
            </span>
            <button
              type="button"
              aria-label={t("datepicker.nextMonth")}
              onClick={() => setAnchor((a) => addDays(a, 32))}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              <NextIcon size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {names.map((n, i) => (
              <span
                key={i}
                className="text-[10px] font-bold text-on-surface-variant py-1"
              >
                {n}
              </span>
            ))}
            {Array.from({ length: leadBlanks }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: monthLen }, (_, i) => {
              const iso = gregorianIso(addDays(monthStart, i));
              const disabled = Boolean((min && iso < min) || (max && iso > max));
              const isSelected = iso === selectedIso;
              const isToday = iso === tehranTodayIso();
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(iso)}
                  className={`py-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary font-extrabold shadow-xs"
                      : "text-on-surface hover:bg-surface-container font-semibold"
                  } ${isToday && !isSelected ? "ring-1 ring-primary/50" : ""} disabled:opacity-30 disabled:pointer-events-none cursor-pointer`}
                >
                  {formatJalaliDay(parseIso(iso) ?? new Date(), locale)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const today = tehranTodayIso();
              setAnchor(parseIso(today) ?? new Date());
              pick(today);
            }}
            className="mt-2 w-full py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            {t("datepicker.today")}
          </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
