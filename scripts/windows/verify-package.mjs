// Smoke test du paquet distribué : aucun PostgreSQL n'est créé par un GET.
// Les composants sont déjà copiés ; utiliser le node.exe embarqué.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import net from "node:net";
import path from "node:path";
if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("Smoke autonome réservé au runner Windows");
}
const root = path.resolve(process.env.SMN_PACKAGE_DIR || path.join(process.cwd(), "_package", "SMN-Windows"));
for (const file of ["node.exe", "server.js", "Demarrer SMN.cmd", "launch-portable.mjs"]) {
  assert.ok(existsSync(path.join(root, file)), "Fichier manquant du paquet : " + file);
}
const isolatedHome = await mkdtemp(path.join(os.tmpdir(), "smn-portable-ci-"));
const port = 3003;
const base = "http://127.0.0.1:" + port;
let server;
let blockedPostgresPort;
try {
  let serverOutput = "";
  server = spawn(path.join(root, "node.exe"), [path.join(root, "server.js")], {
    cwd: root, stdio: ["ignore","pipe","pipe"], windowsHide: true, shell: false,
    env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port),
      SMN_DATABASE_URL: "", SMN_SETUP_TOKEN: "", LOCALAPPDATA: isolatedHome },
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
  assert.equal((await fetch(base + "/app", { redirect: "manual" })).status, 307);

  if (process.env.SMN_FULL_INSTALL_TEST === "true") {
    const setCookie = status.headers.get("set-cookie") ?? "";
    const match = /smn-local-setup=([a-f0-9]{64})/.exec(setCookie);
    assert.ok(match, "Session d'amorçage manquante");
    // Simuler une tentative précédente interrompue après création du dossier,
    // exactement comme le retour de recette SMN-12.
    const testRecovery = process.env.SMN_RECOVERY_TEST === "true";
    const initialData = path.join(isolatedHome, "ScrumMasterNotebook", "data");
    if (testRecovery) {
      await mkdir(initialData, { recursive: true });
      await writeFile(path.join(initialData, "PG_VERSION"), "18");
      await writeFile(path.join(initialData, "ancien-essai.txt"), "donnees-preservees");
    }
    const portFallback = process.env.SMN_PORT_FALLBACK_TEST === "true";
    if (portFallback) {
      blockedPostgresPort = net.createServer();
      try {
        await new Promise((resolve, reject) => {
          blockedPostgresPort.once("error", reject);
          blockedPostgresPort.listen(55432, "127.0.0.1", resolve);
        });
      } catch {
        // Un port déjà réservé par Windows exerce exactement le même cas.
      }
    }
    const payload = { dbMode: "portable", mode: "scrum", product: "SMN pilote CI", team: "Équipe Windows CI",
      password: "MonMotDePasseTest2026", confirmed: true };
    const start = await fetch(base + "/api/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": base, "Cookie": "smn-local-setup=" + match[1] },
      body: JSON.stringify(payload),
    });
    const begun = await start.json();
    assert.equal(start.status, 202, "Amorçage non démarré : " + JSON.stringify(begun));
    if (testRecovery) {
      let blocked = false;
      for (let i = 0; i < 40; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const poll = await (await fetch(base + "/api/bootstrap")).json();
        if (poll.status === "failed") {
          assert.equal(poll.error, "managed-cluster-needs-recovery");
          blocked = true;
          break;
        }
      }
      assert.equal(blocked, true, "Le dossier interrompu doit rester intact sans accord explicite");
      assert.equal(await readFile(path.join(initialData, "ancien-essai.txt"), "utf8"), "donnees-preservees");
      const retry = await fetch(base + "/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": base,
          "Cookie": "smn-local-setup=" + match[1] },
        body: JSON.stringify({ ...payload, recoverPartial: true }),
      });
      assert.equal(retry.status, 202, "La reprise confirmée doit être acceptée");
    }
    let done = false;
    let lastStep = "";
    for (let i = 0; i < 300; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const poll = await (await fetch(base + "/api/bootstrap")).json();
      const step = `${poll.status}: ${poll.step} (${poll.progress}%)`;
      if (step !== lastStep) { console.log("Préparation Windows : " + step); lastStep = step; }
      if (poll.status === "failed") throw new Error("Installation Windows échouée : " + poll.error);
      if (poll.status === "complete") { done = true; break; }
    }
    assert.equal(done, true, "La préparation a dépassé dix minutes ; dernière étape : " + lastStep);
    if (portFallback) {
      const cfg = JSON.parse(await readFile(
        path.join(isolatedHome, "ScrumMasterNotebook", "runtime.json"), "utf8"));
      assert.notEqual(cfg.port, 55432, "SMN doit utiliser un autre port PostgreSQL si 55432 est interdit");
      console.log("PASS : port PostgreSQL automatiquement remplacé et persisté : " + cfg.port);
    }
    if (testRecovery) {
      const backups = path.join(isolatedHome, "ScrumMasterNotebook", "recovery");
      const entries = await readdir(backups);
      assert.equal(entries.length, 1, "Une seule archive est attendue");
      assert.equal(await readFile(path.join(backups, entries[0], "ancien-essai.txt"), "utf8"), "donnees-preservees");
      console.log("PASS : l'ancienne tentative est archivée sans suppression avant la nouvelle installation.");
    }
    const diag = await (await fetch(base + "/api/diagnostic")).json();
    assert.equal(diag.status, "initialized");
    const privatePage = await fetch(base + "/app", { redirect: "manual" });
    assert.equal(privatePage.status, 307);
    assert.equal(new URL(privatePage.headers.get("location"), base).pathname, "/login");
    assert.equal((await fetch(base + "/welcome")).status, 404);
    console.log("PASS : installation Express complète dans une base Windows isolée.");
  } else {
    console.log("PASS : page d'accueil et assistant accessibles sans base implicite.");
  }

 } finally {
  if (blockedPostgresPort?.listening) {
    await new Promise(resolve => blockedPostgresPort.close(resolve));
  }
  const smnRoot = path.join(isolatedHome, "ScrumMasterNotebook");
  const ctl = path.join(smnRoot, "pgsql", "bin", "pg_ctl.exe");
  if (existsSync(ctl) && existsSync(path.join(smnRoot, "data"))) {
    spawnSync(ctl, ["-D", path.join(smnRoot, "data"), "-m", "fast", "-w", "stop"], {
      windowsHide: true, stdio: "ignore",
    });
  }
  if (server?.pid) {
    const taskkill = spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    if (taskkill.status !== 0) server.kill();
  }
  await rm(isolatedHome, { recursive: true, force: true, maxRetries: 8, retryDelay: 600 });
}
