// Smoke test du paquet distribué : aucun PostgreSQL n'est créé par un GET.
// Les composants sont déjà copiés ; utiliser le node.exe embarqué.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("Smoke autonome réservé au runner Windows");
}
const root = path.resolve(process.env.SMN_PACKAGE_DIR || path.join(process.cwd(), "_package", "SMN-Windows"));
for (const file of ["node.exe", "server.js", "Demarrer SMN.cmd", "launch-portable.mjs"]) {
  assert.ok(existsSync(path.join(root, file)), "Fichier manquant du paquet : " + file);
}
const port = 3003;
const base = "http://127.0.0.1:" + port;
let server;
try {
  let serverOutput = "";
  server = spawn(path.join(root, "node.exe"), [path.join(root, "server.js")], {
    cwd: root, stdio: ["ignore","pipe","pipe"], windowsHide: true, shell: false,
    env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port),
      SMN_DATABASE_URL: "", SMN_SETUP_TOKEN: "" },
  });
  server.stdout.on("data", b => { serverOutput = (serverOutput + String(b)).slice(-2200); });
  server.stderr.on("data", b => { serverOutput = (serverOutput + String(b)).slice(-2200); });
  server.on("error", e => { serverOutput = e.message; });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error("Le paquet a quitté avant de démarrer : " + serverOutput);
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1000) });
      const html = await response.text();
      if (response.ok && html.includes("Scrum Master Notebook")) { ready = true; break; }
    } catch { /* attente */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(ready, true, "Le serveur livré ne répond pas");
  const welcome = await fetch(base + "/welcome");
  assert.equal(welcome.status, 200);
  assert.match(await welcome.text(), /Installer Scrum Master Notebook/);
  const status = await fetch(base + "/api/bootstrap");
  assert.equal(status.status, 200);
  assert.equal((await status.json()).status, "idle");
  assert.equal((await fetch(base + "/app")).status, 404);
  console.log("PASS : paquet autonome ouvre l'accueil et l'assistant sans installation de base implicite.");
} finally {
  if (server?.pid) {
    const taskkill = spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    if (taskkill.status !== 0) server.kill();
  }
}
