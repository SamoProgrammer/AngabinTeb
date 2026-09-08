import { getTranslations } from "next-intl/server";
import { getSettings } from "@/contexts/platform/queries";
import { saveSettings } from "@/contexts/platform/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Spec F-026: integration registry with owner, fallback and data boundary.
// Copy lives in admin.settings.integrations.* (fa source of truth).
const INTEGRATIONS = [
  { key: "regim24", integration: "Regim24" },
  { key: "nobat24", integration: "Nobat24" },
  { key: "aparat", integration: "Aparat" },
  { key: "leaflet", integration: "Leaflet/OSM" },
  { key: "enamad", integration: "eNAMAD seal" },
  { key: "social", integration: "Social (Instagram/Telegram)" },
] as const;

export default async function AdminSettingsPage() {
  const tSettings = await getTranslations("admin.settings");
  const tCommon = await getTranslations("admin.common");

  const settings = await getSettings();

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tSettings("title")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tSettings("integration")}</TableHead>
            <TableHead>{tSettings("owner")}</TableHead>
            <TableHead>{tSettings("fallback")}</TableHead>
            <TableHead>{tSettings("boundary")}</TableHead>
            <TableHead>{tSettings("url")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INTEGRATIONS.map((it) => (
            <TableRow key={it.key}>
              <TableCell className="font-medium">{it.integration}</TableCell>
              <TableCell>{tSettings(`integrations.${it.key}.owner`)}</TableCell>
              <TableCell>{tSettings(`integrations.${it.key}.fallback`)}</TableCell>
              <TableCell className="whitespace-normal">{tSettings(`integrations.${it.key}.boundary`)}</TableCell>
              <TableCell>
                <form action={async (fd) => { "use server"; await saveSettings(fd); }} className="flex items-center gap-2">
                  <input type="hidden" name="key" value={it.key} />
                  <Input name="url" defaultValue={settings[it.key]?.url ?? ""} className="w-56" placeholder="https://…" aria-label={`${it.integration} ${tSettings("url")}`} />
                  <Button type="submit" variant="outline">{tCommon("save")}</Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}