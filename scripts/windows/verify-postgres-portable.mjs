// Preuve P0 sur un environnement GitHub Actions Windows isolé.
// Aucun accès à un PostgreSQL installé par l'utilisateur.
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, rm, readdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { acquirePgArchive } from "./postgres-archive.mjs";

if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true" || process.env.CI !== "true") {
  throw new Error("P0 réservé au runner Windows GitHub Actions");
}
const root = await mkdtemp(path.join(os.tmpdir(), "smn-p0-"));
const binDir = path.join(root, "pg");
const cluster = path.join(root, "data");
const log = path.join(root, "postgres.log");
const pwfile = path.join(root, "pw.tmp");
const port = "55437";
const args = (prog, a) => new Promise((resolve, reject) => {
  const p = spawn(prog, a, { stdio: "ignore", windowsHide: true, shell: false });
  p.on("error", reject);
  p.on("close", (code) => code === 0 ? resolve() : reject(new Error(path.basename(prog) + " returned " + code)));
});
let ctl;
let started = false;
try {
  const zip = await acquirePgArchive(path.join(root, "pg.zip"));
  await mkdir(binDir, { recursive: true });
  await args("tar.exe", ["-xf", zip, "-C", binDir]);
  const listing = await readdir(binDir);
  const home = listing.includes("pgsql") ? path.join(binDir, "pgsql") : binDir;
  const bin = path.join(home, "bin");
  ctl = path.join(bin, "pg_ctl.exe");
  await args(path.join(bin, "postgres.exe"), ["--version"]);
  await writeFile(pwfile, "SMN-P0-unique-test-password-2026\n", { mode: 0o600 });
  await args(path.join(bin, "initdb.exe"), [
    "-D", cluster, "-U", "smn_owner", "-A", "scram-sha-256",
    "--pwfile", pwfile, "--encoding", "UTF8", "--no-instructions",
  ]);
  await args(ctl, ["-D", cluster, "-o", "-h 127.0.0.1 -p " + port, "-l", log, "-w", "start"]);
  started = true;
  await args(path.join(bin, "pg_isready.exe"), ["-h", "127.0.0.1", "-p", port, "-U", "smn_owner"]);
  console.log("SMN P0 PASS: PostgreSQL portable 18.6, initdb, pg_ctl, pg_isready sans service Windows.");
} finally {
  if (started) await args(ctl, ["-D", cluster, "-m", "fast", "-w", "stop"]).catch(() => undefined);
  await rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 500 });
}
