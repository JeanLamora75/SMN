import "server-only";
import type { Diagnostic } from "@/server/installation/diagnostic";
import { diagnoseInstallation } from "@/server/installation/diagnostic";
import { parseConnectionSettings } from "@/server/db/config";
import { probePostgres } from "@/server/db/connection";
import { existingManagedUri, canOfferPortable } from "@/server/bootstrap/portable";
import { loadExistingUri } from "@/server/bootstrap/settings";

export async function currentInstallationDiagnostic(): Promise<Diagnostic> {
  const settings = parseConnectionSettings(process.env.SMN_DATABASE_URL);
  if (!settings.ok) {
    if (settings.status === "configuration-missing" && canOfferPortable()) {
      try {
        const existing = await loadExistingUri();
        if (existing) return diagnoseInstallation(() => probePostgres(existing));
        const uri = await existingManagedUri();
        if (uri) return diagnoseInstallation(() => probePostgres(uri));
      } catch {
        return { status: "connection-error", canEnterSetup: false };
      }
    }
    return { status: settings.status, canEnterSetup: false };
  }
  return diagnoseInstallation(() => probePostgres(settings.uri));
}
