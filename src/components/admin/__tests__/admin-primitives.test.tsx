import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { AdminToolbar, AdminPagination, AdminEmpty } from "../admin-table";
import { ConfirmAction } from "../confirm-action";
import { FormDrawer } from "../form-drawer";

describe("admin primitives", () => {
  it("toolbar keeps the current query and submits via GET", () => {
    const html = renderToString(<AdminToolbar placeholder="جستجو" searchLabel="فیلتر" currentQ="ali" />);
    expect(html).toContain('name="q"');
    expect(html).toContain('value="ali"');
  });
  it("pagination links prev and next pages", () => {
    const html = renderToString(
      <AdminPagination page={2} totalPages={3} hrefFor={(p) => `/fa/admin/support?page=${p}`} />,
    );
    expect(html).toContain("page=1");
    expect(html).toContain("page=3");
  });
  it("confirm renders a dialog with the server form inside", () => {
    const html = renderToString(
      <ConfirmAction openLabel="لغو" title="تأیید لغو" message="مطمئنی؟" confirmSlot={<button type="submit">بله</button>} cancelLabel="انصراف" />,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain("تأیید لغو");
  });
  it("drawer renders a side panel with the create form inside", () => {
    const html = renderToString(
      <FormDrawer openLabel="جدید" title="دسته جدید" closeLabel="بستن"><form /></FormDrawer>,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain("دسته جدید");
  });
  it("empty renders title and action link", () => {
    const html = renderToString(
      <AdminEmpty title="خالی" hint="راهنما" actionHref="/fa/admin" actionLabel="ایجاد" />,
    );
    expect(html).toContain("خالی");
    expect(html).toContain("/fa/admin");
  });
});
