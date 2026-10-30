import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Client } from "pg";
import { acquirePgArchive, PG_ARCHIVE } from "./archive";
import { encryptSetting, decryptSetting, readPrivateFile } from "./settings";
import { archiveIncompleteCluster } from "./recovery";
import { classifyPostgresStartupLog } from "./postgres-startup";
import { canBindLoopback, selectLoopbackPort } from "./managed-port";
import { runManagedProcess as run } from "./managed-process";

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

async function loadManaged(): Promise<ManagedConfig | null> {
  try {
    const privateBytes=await readPrivateFile("runtime.json");
    if (!privateBytes) return null;
    const parsed = JSON.parse(privateBytes.toString("utf8")) as ManagedConfig;
    const root = privateRoot();
    // Aucune valeur provenant d'une base, d'une URL ou de l'utilisateur.
    if (parsed.version !== VERSION || !Number.isInteger(parsed.port) || parsed.port < 1024 || parsed.port > 65535 || parsed.user !== "smn_owner" ||
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
async function saveManagedRuntime(config: ManagedConfig): Promise<void> {
  const filename = configPath();
  const pending = filename + ".port-" + randomBytes(5).toString("hex");
  await writeFile(pending, JSON.stringify(config), { mode: 0o600, flag: "wx" });
  try { await rename(pending, filename); }
  finally { await rm(pending, { force: true }).catch(() => undefined); }
}

async function ensureRunning(config: ManagedConfig): Promise<ManagedConfig> {
  if (await statusIsOwned(config)) return config;
  const logfile = path.join(privateRoot(), "postgres.log");
  let lastPortFailure = "managed-pg-no-bindable-port";
  // Un port inaccessible sous Windows n'est pas nécessairement "occupé" :
  // Hyper-V, WSL ou une règle du poste peuvent le réserver sans listener.
  // Faire un vrai bind loopback avant de lancer pg_ctl, puis si nécessaire
  // demander un autre port au système, SANS toucher aux ports d'autres apps.
  for (let attempt = 0; attempt < 5; attempt++) {
    const port = attempt === 0 ? config.port : await selectLoopbackPort();
    if (!await canBindLoopback(port)) {
      lastPortFailure = "managed-pg-no-bindable-port";
      continue;
    }
    const candidate = { ...config, port };
    // Enregistrer le port AVANT le démarrage, pour retrouver le bon
    // emplacement même en cas de redémarrage abrupt de l'applicatif.
    if (port !== config.port) await saveManagedRuntime(candidate);
    const oldLength = (await stat(logfile).catch(() => null))?.size ?? 0;
    try {
      await run(path.join(config.pgBin, "pg_ctl.exe"), [
        "-D", config.cluster, "-l", logfile,
        "-o", "-h 127.0.0.1 -p " + port, "-w", "start",
      ]);
    } catch {
      let recent = "";
      try {
        const bytes = await readFile(logfile);
        recent = bytes.subarray(bytes.length >= oldLength ? oldLength : 0).toString("utf8");
      } catch { /* Aucun détail de journal envoyé au navigateur */ }
      const reason = classifyPostgresStartupLog(recent);
      if (reason === "managed-pg-bind-denied" || reason === "managed-pg-port-in-use") {
        lastPortFailure = reason;
        if (attempt < 4) continue;
      }
      throw new Error(reason);
    }
    const password = await decryptSetting(candidate.encryptedPassword);
    await validateOwner(buildUri(candidate.user, password, port));
    return candidate;
  }
  throw new Error(lastPortFailure);
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
/** Create only the application's dedicated database during an explicitly approved setup.
 * PostgreSQL initdb creates the maintenance database, not the SMN database. */
async function createManagedDatabase(uri:string):Promise<void>{
 const maintenance=new URL(uri);
 maintenance.pathname="/postgres";
 const client=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 try{
  await client.connect();
  const existing=await client.query<{exists:boolean}>(
   "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='smn') AS exists");
  if(existing.rows[0]?.exists)throw Error("database-already-present");
  await client.query('CREATE DATABASE smn OWNER smn_owner');
 }finally{await client.end().catch(()=>undefined);}
}

// Read-only first launch never downloads or creates a database.
export function canOfferPortable(): boolean {
  return process.platform === "win32" && !!process.env.LOCALAPPDATA;
}
export async function existingManagedUri(): Promise<string | null> {
  if (!canOfferPortable()) return null;
  const cfg = await loadManaged();
  if (!cfg) return null;
  const running = await ensureRunning(cfg);
  const password = await decryptSetting(running.encryptedPassword);
  const uri = buildUri(running.user, password, running.port);
  await validateOwner(uri);
  return uri;
}
export async function prepareManaged(onProgress: (step: string) => void, recoveryApproved = false): Promise<string> {
  if (!canOfferPortable()) throw new Error("windows-required");
  if (process.env.SMN_DATABASE_URL) throw new Error("manual-connection-configured");
  onProgress("Recherche d'une installation SMN existante");
  const existing = await existingManagedUri();
  if (existing) return existing;
  const root = privateRoot();
  // Une ancienne tentative peut avoir créé le dossier data avant que le
  // manifeste de connexion ait été écrit (SMN-12). N'y toucher que sur
  // confirmation distincte ; l'ancien dossier est ARCHIVÉ, jamais supprimé.
  const partial = existsSync(path.join(root, "data"));
  if (partial && !recoveryApproved) throw new Error("managed-cluster-needs-recovery");
  // Le bind du port sera choisi et testé juste avant le démarrage de pg_ctl.
  if (partial) {
    if (existsSync(configPath())) throw new Error("managed-config-invalid");
    const ctl = path.join(root, "pgsql", "bin", "pg_ctl.exe");
    if (existsSync(ctl)) {
      // Code 0 = cluster en cours d'exécution : ne jamais l'archiver.
      try {
        await run(ctl, ["-D", path.join(root, "data"), "status"]);
        throw new Error("managed-cluster-running");
      } catch (error) {
        if (error instanceof Error && error.message === "managed-cluster-running") throw error;
        if (!(error instanceof Error && error.message === "managed-process-failed:pg_ctl.exe"))
          throw new Error("managed-cluster-unsafe");
      }
    }
    onProgress("Conservation de la tentative précédente dans une sauvegarde");
    await archiveIncompleteCluster(root);
  }
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
  // Le secret durable est chiffré dans le profil Windows. La clé locale doit rester privée ; aucun mot de passe n'est écrit en clair.
  const cfg: ManagedConfig = {
    version: VERSION, pgBin: path.join(pgRoot, "bin"), cluster: path.join(root, "data"),
    port: PORT, user: "smn_owner", encryptedPassword: await encryptSetting(password),
  };
  const pending = configPath() + ".new-" + randomBytes(8).toString("hex");
  try {
    await writeFile(pending, JSON.stringify(cfg), { mode: 0o600, flag: "wx" });
    await rename(pending, configPath());
  } finally { await rm(pending, { force: true }).catch(() => undefined); }
  onProgress("Démarrage de la base dédiée et vérification");
  const running = await ensureRunning(cfg);
  const uri = buildUri(running.user, password, running.port);
  await validateOwner(uri);
  await createManagedDatabase(uri);
  return uri;
}
