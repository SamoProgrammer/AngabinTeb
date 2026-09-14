const BODY_STYLES =
  "space-y-3 text-sm sm:text-base leading-relaxed text-on-surface text-start " +
  "[&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold " +
  "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 " +
  "[&_a]:text-primary [&_a]:underline " +
  "[&_blockquote]:border-s-2 [&_blockquote]:border-primary/40 [&_blockquote]:ps-3 [&_blockquote]:text-on-surface-variant " +
  "[&_code]:rounded [&_code]:bg-surface-container [&_code]:px-1 [&_code]:text-[0.9em]";

export function isRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function RichTextView({ value, className = "" }: { value: string; className?: string }) {
  if (!value) return null;
  if (!isRichHtml(value)) {
    const paragraphs = value.split("\n\n").filter(Boolean);
    return (
      <div className={`${BODY_STYLES} ${className}`}>
        {paragraphs.map((p, idx) => (
          <p key={idx} className="leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    );
  }
  return <div className={`${BODY_STYLES} ${className}`} dangerouslySetInnerHTML={{ __html: value }} />;
}
