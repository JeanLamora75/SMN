export type ConnectionSettings =
  | { ok: true; uri: string }
  | { ok: false; status: "configuration-missing" | "configuration-invalid" };

// Les paramètres supplémentaires des URL peuvent être interprétés par pg
// comme des options de connexion. Ne transmettre que l'URL validée sans option.
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
      !!parsed.hash ||
      !!parsed.search ||
      !/^\d{0,5}$/.test(parsed.port)
    ) return { ok: false, status: "configuration-invalid" };
    // Ne jamais inclure l'URL réelle dans un journal ou une réponse HTTP.
    return { ok: true, uri: parsed.toString() };
  } catch {
    return { ok: false, status: "configuration-invalid" };
  }
}
