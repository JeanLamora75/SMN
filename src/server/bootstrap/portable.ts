import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { Client } from "pg";
import { acquirePgArchive, PG_ARCHIVE } from "./archive";

// SMN gère UNIQUEMENT son propre cluster sous LocalAppData. Le système ou
// l'autre application ne sont jamais interrogés, adoptés ou arrêtés.
const PORT = 55432;
const VERSION = 1;
type ManagedConfig = { version: number; pgBin: string; cluster: string; port: number; user: string; encryptedPassword: string };
function privateRoot(): string {
  const base = process.env.LOCALAPPDATA;
  if (process.platform !== "win32" || !base) throw new Error("windows-required");
  return path.join(base, "ScrumMasterNotebook");
}
function configPath(): string { return path.join(privateRoot(), "runtime.json"); }
async function run(exe: string, args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (b) => { out += String(b); if (out.length > 15000) child.kill(); });
    child.stderr.on("data", (b) => { err += String(b); if (err.length > 15000) child.kill(); });
    child.on("error", reject);
    child.on("close", code => {
      // Ne jamais remonter stdout/stderr PG : peuvent contenir des détails privés.
      if (code === 0) resolve(out.trim());
      else reject(new Error("managed-process-failed:" + path.basename(exe)));
    });
    child.stdin.end(input);
  });
}
async function dpapi(value: string, decrypt = false): Promise<string> {
  // Le secret passe uniquement par stdin, jamais par les arguments, le dépôt ou les logs.
  const script = decrypt
    ? "$ErrorActionPreference='Stop'; $v=[Console]::In.ReadToEnd(); $raw=[Convert]::FromBase64String($v.Trim()); $data=[Security.Cryptography.ProtectedData]::Unprotect($raw,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Text.Encoding]::UTF8.GetString($data))"
    : "$ErrorActionPreference='Stop'; $v=[Console]::In.ReadToEnd(); $raw=[Text.Encoding]::UTF8.GetBytes($v); $data=[Security.Cryptography.ProtectedData]::Protect($raw,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($data))";
  return run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], value);
}
async function portInUse(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const s = net.connect({ host: "127.0.0.1", port });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => { s.destroy(); resolve(false); });
    s.setTimeout(1000, () => { s.destroy(); resolve(true); });
  });
}
async function loadManaged(): Promise<ManagedConfig | null> {
  try {
    const parsed = JSON.parse(await readFile(configPath(), "utf8")) as ManagedConfig;
    const root = privateRoot();
    // Aucune valeur provenant d'une base, d'une URL ou de l'utilisateur.
    if (parsed.version !== VERSION || parsed.port !== PORT || parsed.user !== "smn_owner" ||
        parsed.pgBin !== path.join(root, "pgsql", "bin") ||
        parsed.cluster !== path.join(root, "data") ||
        typeof parsed.encryptedPassword !== "string") throw new Error("managed-config-invalid");
    return parsed;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw new Error("managed-config-invalid");
  }
}
async function statusIsOwned(config: ManagedConfig): Promise<boolean> {
  try { await run(path.join(config.pgBin, "pg_ctl.exe"), ["-D", config.cluster, "status"]); return true; }
  catch { return false; }
}
async function ensureRunning(config: ManagedConfig): Promise<void> {
  if (await statusIsOwned(config)) return;
  if (await portInUse(config.port)) throw new Error("managed-port-occupied");
  const log = path.join(privateRoot(), "postgres.log");
  await run(path.join(config.pgBin, "pg_ctl.exe"), [
    "-D", config.cluster, "-l", log, "-o", "-h 127.0.0.1 -p " + config.port, "-w", "start",
  ]);
}
function buildUri(user: string, password: string, port: number): string {
  return "postgresql://" + encodeURIComponent(user) + ":" + encodeURIComponent(password) +
    "@127.0.0.1:" + port + "/smn";
}
async function validateOwner(uri: string): Promise<void> {
  const u = new URL(uri);
  u.pathname = "/postgres";
  const client = new Client({ connectionString: u.toString(), connectionTimeoutMillis: 3500 });
  try {
    await client.connect();
    const r = await client.query<{ v: string; username: string }>(
      "SELECT current_setting('server_version_num') AS v, current_user AS username");
    if (Math.floor(Number(r.rows[0]?.v) / 10000) !== 18 || r.rows[0]?.username !== "smn_owner") {
      throw new Error("managed-cluster-unrecognized");
    }
  } finally { await client.end().catch(() => undefined); }
}
// Read-only first launch never downloads or creates a database.
export function canOfferPortable(): boolean {
  return process.platform === "win32" && !!process.env.LOCALAPPDATA;
}
export async function existingManagedUri(): Promise<string | null> {
  if (!canOfferPortable()) return null;
  const cfg = await loadManaged();
  if (!cfg) return null;
  await ensureRunning(cfg);
  const password = await dpapi(cfg.encryptedPassword, true);
  const uri = buildUri(cfg.user, password, cfg.port);
  await validateOwner(uri);
  return uri;
}
export async function prepareManaged(onProgress: (step: string) => void): Promise<string> {
  if (!canOfferPortable()) throw new Error("windows-required");
  if (process.env.SMN_DATABASE_URL) throw new Error("manual-connection-configured");
  onProgress("Recherche d'une installation SMN existante");
  const existing = await existingManagedUri();
  if (existing) return existing;
  const root = privateRoot();
  // Si un cluster existe sans manifeste privé valide, jamais de réinit.
  if (existsSync(path.join(root, "data"))) throw new Error("managed-cluster-needs-recovery");
  if (await portInUse(PORT)) throw new Error("managed-port-occupied");
  await mkdir(root, { recursive: true, mode: 0o700 });
  const archive = path.join(root, PG_ARCHIVE);
  const bundle = path.join(process.cwd(), "runtime", "postgres", PG_ARCHIVE);
  onProgress("Préparation des composants PostgreSQL — le premier lancement peut prendre quelques minutes");
  const verifiedArchive = await acquirePgArchive(archive, existsSync(bundle) ? bundle : undefined);
  const pgRoot = path.join(root, "pgsql");
  if (!existsSync(path.join(pgRoot, "bin", "initdb.exe"))) {
    // Limiter la longueur des chemins internes de la distribution Windows EDB.
    // Certains fichiers d’archive dépasseraient MAX_PATH sous un LocalAppData profond.
    const tmp = path.join(os.tmpdir(), "smnp-" + randomBytes(4).toString("hex"));
    await mkdir(tmp, { recursive: false });
    try {
      await run("tar.exe", ["-xf", verifiedArchive, "-C", tmp]);
      const { readdir } = await import("node:fs/promises");
      const dirs = await readdir(tmp);
      const actual = dirs.includes("pgsql") ? path.join(tmp, "pgsql") : tmp;
      if (!existsSync(path.join(actual, "bin", "initdb.exe")) ||
          !existsSync(path.join(actual, "bin", "pg_ctl.exe"))) throw new Error("postgres-runtime-invalid");
      await rename(actual, pgRoot);
    } finally { await rm(tmp, { recursive: true, force: true }); }
  }
  const password = randomBytes(32).toString("hex");
  const pwFile = path.join(root, ".init-password-" + process.pid);
  onProgress("Création d'une instance PostgreSQL privée à SMN");
  await writeFile(pwFile, password + "\n", { mode: 0o600, flag: "wx" });
  try {
    await run(path.join(pgRoot, "bin", "initdb.exe"), [
      "-D", path.join(root, "data"), "-U", "smn_owner",
      "-A", "scram-sha-256", "--pwfile", pwFile, "--encoding", "UTF8", "--no-instructions",
    ]);
  } finally { await rm(pwFile, { force: true }); }
  // Le secret durable est protégé par DPAPI CurrentUser ; pas de secret en clair sur disque.
  const cfg: ManagedConfig = {
    version: VERSION, pgBin: path.join(pgRoot, "bin"), cluster: path.join(root, "data"),
    port: PORT, user: "smn_owner", encryptedPassword: await dpapi(password),
  };
  const pending = configPath() + ".new";
  await writeFile(pending, JSON.stringify(cfg), { mode: 0o600, flag: "wx" });
  await rename(pending, configPath());
  onProgress("Démarrage de la base dédiée et vérification");
  await ensureRunning(cfg);
  const uri = buildUri(cfg.user, password, cfg.port);
  await validateOwner(uri);
  return uri;
}
