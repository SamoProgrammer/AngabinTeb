import { getSettings } from "@/contexts/platform/queries";
import { saveSettings } from "@/contexts/platform/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Spec F-026: integration registry with owner, fallback and data boundary.
const INTEGRATIONS: { key: string; integration: string; owner: string; fallback: string; boundary: string }[] = [
  { key: "regim24", integration: "Regim24", owner: "External", fallback: "None — link out", boundary: "Offline diet destination, no data shared" },
  { key: "nobat24", integration: "Nobat24", owner: "External", fallback: "In-app booking", boundary: "Booking ecosystem link only" },
  { key: "aparat", integration: "Aparat", owner: "External", fallback: "None", boundary: "Video embeds, `video_url` field" },
  { key: "leaflet", integration: "Leaflet/OSM", owner: "External", fallback: "None", boundary: "Map link on provider profiles" },
  { key: "enamad", integration: "eNAMAD seal", owner: "External", fallback: "None", boundary: "Trust seal image + link" },
  { key: "social", integration: "Instagram/Telegram/Facebook", owner: "External", fallback: "None", boundary: "Social links, footer" },
];

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Integration</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Fallback</TableHead>
            <TableHead>Data boundary</TableHead>
            <TableHead>URL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INTEGRATIONS.map((it) => (
            <TableRow key={it.key}>
              <TableCell className="font-medium">{it.integration}</TableCell>
              <TableCell>{it.owner}</TableCell>
              <TableCell>{it.fallback}</TableCell>
              <TableCell className="whitespace-normal">{it.boundary}</TableCell>
              <TableCell>
                <form action={async (fd) => { await saveSettings(fd); }} className="flex items-center gap-2">
                  <input type="hidden" name="key" value={it.key} />
                  <Input name="url" defaultValue={settings[it.key]?.url ?? ""} className="w-56" placeholder="https://…" aria-label={`${it.integration} URL`} />
                  <Button type="submit" variant="outline">Save</Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}