import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import { wallets, walletTransactions } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { formatJalaliDateTime, formatPrice, toPersianDigits } from "@/lib/format";

export default async function ProfileBalancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("account.balance");
  const dir = locale === "en" ? "ltr" : "rtl";
  const localizeDigits = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  // Server-side session re-verification (layout also gates, defense in depth).
  const user = await requireUser();
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id));
  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, user.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(50);
  const balance = Number(wallet?.balance ?? 0);

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">{t("title")}</span>
        </div>

        {/* Balance Status Card (real wallet row) */}
        <div className="bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary p-6 sm:p-8 rounded-3xl shadow-tier-2 flex flex-col sm:flex-row items-center justify-between gap-6 text-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0">
              <Wallet size={36} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs text-on-primary/80 font-medium">{t("availableBalance")}</span>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1">
                {formatPrice(balance, locale)}
              </div>
              <p className="text-[11px] text-on-primary/70 mt-1">
                {t("balanceNote")}
              </p>
            </div>
          </div>

          <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0 w-full sm:w-auto">
            <span className="text-[11px] text-on-primary/80 block">{t("accountStatus")}</span>
            <span className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1">
              <BadgeCheck size={16} aria-hidden="true" />
              <span>{t("activeStatus")}</span>
            </span>
          </div>
        </div>

        {/* Top-up notice: no payment gateway is wired (paid = downloadable
            content per product vision), so no dead top-up button is rendered. */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-1 border border-outline-variant/30 text-start">
          <h2 className="text-base sm:text-lg font-bold text-on-surface mb-2">
            {t("topupTitle")}
          </h2>
          <p className="text-xs text-on-surface-variant mb-4">
            {t("topupDesc")}
          </p>
          <p className="text-xs text-on-surface-variant">
            {t("gatewayNotice")}
          </p>
        </div>

        {/* Transactions Ledger Card (real wallet_transaction rows) */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-1 border border-outline-variant/30 text-start flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <ReceiptText size={20} className="text-primary" aria-hidden="true" />
              <span>{t("ledgerTitle")}</span>
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              {t("txCount", { count: localizeDigits(transactions.length) })}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              const dateStr = formatJalaliDateTime(tx.createdAt, locale);
              return (
                <div
                  key={tx.id}
                  className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-green-500/10 text-green-700"
                          : "bg-amber-500/10 text-amber-700"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDown size={18} aria-hidden="true" />
                      ) : (
                        <ArrowUp size={18} aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-on-surface block">{tx.title}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {dateStr}
                        {tx.bankRefCode ? ` · ${t("trackingLabel")} ${tx.bankRefCode}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="font-extrabold text-sm self-end sm:self-center">
                    <span className={isCredit ? "text-green-700" : "text-on-surface"}>
                      {isCredit ? "+ " : "- "}
                      {formatPrice(Number(tx.amount), locale)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
