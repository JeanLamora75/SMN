export type ConnectionSettings =
  | { ok: true; uri: string }
  | { ok: false; status: "configuration-missing" | "configuration-invalid" };

// Une URL ne peut jamais désigner arbitrairement une base tierce (ex : LMN24).
export function parseConnectionSettings(raw: string | undefined): ConnectionSettings {
  if (!raw?.trim()) return { ok: false, status: "configuration-missing" };
  try {
    const parsed = new URL(raw);
    const database = decodeURIComponent(parsed.pathname.slice(1));
    const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
    if (
      !["postgresql:", "postgres:"].includes(parsed.protocol) ||
      !localHosts.has(parsed.hostname) ||
      !/^smn(?:_[a-zA-Z0-9_]+)?$/.test(database) ||
      !parsed.username ||
      parsed.hash
    ) {
      return { ok: false, status: "configuration-invalid" };
    }
    return { ok: true, uri: raw };
  } catch {
    return { ok: false, status: "configuration-invalid" };
  }
}
