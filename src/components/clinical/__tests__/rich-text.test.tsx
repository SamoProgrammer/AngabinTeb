import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { isRichHtml, toPlainText, RichTextView } from "../rich-text-view";

describe("rich-text helpers", () => {
  it("detects editor HTML vs legacy plain text", () => {
    expect(isRichHtml("<p>سلام</p>")).toBe(true);
    expect(isRichHtml("plain\n\ntext")).toBe(false);
    expect(isRichHtml("")).toBe(false);
  });
  it("strips tags to plain text for excerpts and downloads", () => {
    expect(toPlainText("<h2>تیتر</h2><p>متن <strong>مهم</strong></p>")).toBe("تیتر متن مهم");
    expect(toPlainText("plain\n\ntext")).toBe("plain text");
  });
});

describe("RichTextView", () => {
  it("renders editor HTML passthrough", () => {
    const html = renderToString(<RichTextView value="<h2>تیتر</h2><p>متن</p>" />);
    expect(html).toContain("<h2>تیتر</h2>");
    expect(html).toContain("<p>متن</p>");
  });
  it("falls back to paragraphs for legacy plain text", () => {
    const html = renderToString(<RichTextView value={"lead\n\nrest"} />);
    expect(html).toContain("lead");
    expect(html).toContain("rest");
  });
});
