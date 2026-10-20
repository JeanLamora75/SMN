import "server-only";
import type { Diagnostic } from "@/server/installation/diagnostic";
import { diagnoseInstallation } from "@/server/installation/diagnostic";
import { parseConnectionSettings } from "@/server/db/config";
import { probePostgres } from "@/server/db/connection";

export async function currentInstallationDiagnostic(): Promise<Diagnostic> {
  const settings = parseConnectionSettings(process.env.SMN_DATABASE_URL);
  if (!settings.ok) {
    return { status: settings.status, canEnterSetup: false };
  }
  return diagnoseInstallation(() => probePostgres(settings.uri));
}
