// Smoke test du paquet distribué : aucun PostgreSQL n'est créé par un GET.
// Les composants sont déjà copiés ; utiliser le node.exe embarqué.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import {auditWindowsDistribution} from "./distribution-package-policy.mjs";
if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("Smoke autonome réservé au runner Windows");
}
const root = path.resolve(process.env.SMN_PACKAGE_DIR || path.join(process.cwd(), "_package", "SMN-Windows"));
for (const file of ["runtime/node/node.exe", "app/server.js", "Demarrer SMN.bat", "runtime/launcher.mjs", "runtime/maintenance/office-dirs.mjs", "runtime/maintenance/update-transaction.mjs", "app/recover-admin.mjs", "app/distribution-version.json"]) {
  assert.ok(existsSync(path.join(root, file)), "Fichier manquant du paquet : " + file);
}
for(const file of [
 "app/maintenance/windows/update-contract.mjs",
 "app/maintenance/windows/distribution-layout.mjs",
 "app/maintenance/windows/unpack-update.mjs",
 "app/maintenance/windows/import-update.mjs",
 "app/maintenance/windows/verify-staged-update.mjs",
 "app/maintenance/windows/update-apply.mjs",
 "app/maintenance/windows/update-transaction.mjs",
 "app/maintenance/windows/schema-update-policy.mjs",
 "app/maintenance/windows/update-backup-policy.mjs",
 "app/maintenance/windows/verify-delivery.mjs",
]) assert.ok(existsSync(path.join(root,file)), "Composant de maintenance Windows absent : "+file);
for(const file of [
 "app/prisma/baseline/v33/schema.sql",
 "app/prisma/baseline/v32/schema.sql",
 "app/prisma/migrations/20261101_smn_dashboard_slots_additive/migration.sql",
 "app/prisma/migrations/20261108_smn416_chart_styles/migration.sql",
 "app/prisma/migrations/20261109_smn39_privacy_receipt/migration.sql",
 "app/prisma/migrations/20261109_smn40_member_delete_guard/migration.sql",
]){
 assert.ok(existsSync(path.join(root,file)),"Required installation SQL missing: "+file);
}
for (const forbidden of [".env",".settings-key","postgres-connection.json","runtime.json","postgres.log"]) {
  assert.equal(existsSync(path.join(root,forbidden)),false,
    "Un fichier de configuration sensible a été inclus dans le paquet : "+forbidden);
}
const manifestPath=path.join(root,"app",".next","server","middleware-manifest.json");
if(existsSync(manifestPath)) {
 const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
 console.log("Routes du proxy standalone : "+JSON.stringify(Object.keys(manifest.middleware??{})));
} else console.log("ATTENTION : manifeste proxy absent du paquet standalone");
const layout=await auditWindowsDistribution(root);
console.log("PASS: distribution minimaliste : "+layout.fileCount+" fichiers");
const isolatedHome = await mkdtemp(path.join(os.tmpdir(), "smn-portable-ci-"));
const newStorage=path.join(root, "data", "postgres");
assert.equal(existsSync(path.join(root, "server.js")), false, "Le serveur doit être isolé dans app/");
assert.equal(existsSync(path.join(root, "node.exe")), false, "Node.js doit être isolé dans runtime/node/");
assert.ok(existsSync(path.join(root, "updates")), "Le staging updates doit être séparé des données");
for (const privateFile of [".env",".env.local",".settings-key","runtime.json","postgres-connection.json"]) {
  assert.equal(existsSync(path.join(root,"app",privateFile)), false, "Configuration privée incluse dans app : "+privateFile);
}
assert.equal(existsSync(newStorage), false, "Le paquet de distribution ne doit contenir aucune base PostgreSQL préinitialisée");
const recoveryProbe=spawnSync(path.join(root,"runtime","node","node.exe"),[path.join(root,"app","recover-admin.mjs")],{
  cwd:root,windowsHide:true,encoding:"utf8",stdio:["pipe","pipe","pipe"],
  env:{...process.env,SMN_DATABASE_URL:""},
});
assert.notEqual(recoveryProbe.status,0,"Sans terminal interactif, la récupération doit échouer");
assert.match(recoveryProbe.stderr??"",/Ouvrez un terminal interactif Windows/,
  "Le script de récupération autonome doit charger ses dépendances et refuser la saisie non interactive");

const port = 3003;
const base = "http://127.0.0.1:" + port;
let server;
let blockedPostgresPort;
function fetchTimed(url, options = {}) {
  return fetch(url, { signal: AbortSignal.timeout(10000), ...options });
}
try {
  let serverOutput = "";
  server = spawn(path.join(root, "runtime", "node", "node.exe"), [path.join(root, "app", "server.js")], {
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
      const response = await fetchTimed(base, { signal: AbortSignal.timeout(1000) });
      const html = await response.text();
      if (response.ok && html.includes("Scrum Master Notebook")) { ready = true; break; }
    } catch { /* attente */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(ready, true, "Le serveur livré ne répond pas");
  const welcome = await fetchTimed(base + "/welcome");
  assert.equal(welcome.status, 200);
  assert.match(await welcome.text(), /Installer Scrum Master Notebook/);
  const status = await fetchTimed(base + "/api/bootstrap");
  assert.equal(status.status, 200);
  assert.equal((await status.json()).status, "idle");
  assert.equal((await fetchTimed(base + "/app", { redirect: "manual" })).status, 307);

  if (process.env.SMN_FULL_INSTALL_TEST === "true") {
    const setCookie = status.headers.get("set-cookie") ?? "";
    const match = /smn-local-setup=([a-f0-9]{64})/.exec(setCookie);
    assert.ok(match, "Session d'amorçage manquante");
    // Simuler une tentative précédente interrompue après création du dossier,
    // exactement comme le retour de recette SMN-12.
    const testRecovery = process.env.SMN_RECOVERY_TEST === "true";
    const initialData = path.join(newStorage, "data");
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
    const start = await fetchTimed(base + "/api/bootstrap", {
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
        const poll = await (await fetchTimed(base + "/api/bootstrap")).json();
        if (poll.status === "failed") {
          assert.equal(poll.error, "managed-cluster-needs-recovery");
          blocked = true;
          break;
        }
      }
      assert.equal(blocked, true, "Le dossier interrompu doit rester intact sans accord explicite");
      assert.equal(await readFile(path.join(initialData, "ancien-essai.txt"), "utf8"), "donnees-preservees");
      const retry = await fetchTimed(base + "/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": base,
          "Cookie": "smn-local-setup=" + match[1] },
        body: JSON.stringify({ ...payload, recoverPartial: true }),
      });
      assert.equal(retry.status, 202, "La reprise confirmée doit être acceptée");
    }
    let done = false;
    let lastStep = "";
    const deadline = Date.now() + 600000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      let poll;
      try { poll = await (await fetchTimed(base + "/api/bootstrap")).json(); }
      catch { throw new Error("Suivi de préparation indisponible ; dernière étape : " + lastStep); }
      const step = `${poll.status}: ${poll.step} (${poll.progress}%)`;
      if (step !== lastStep) { console.log("Préparation Windows : " + step); lastStep = step; }
      if (poll.status === "failed") throw new Error("Installation Windows échouée : " + poll.error);
      if (poll.status === "complete") { done = true; break; }
    }
    assert.equal(done, true, "La préparation a dépassé dix minutes ; dernière étape : " + lastStep);
    if (portFallback) {
      const cfg = JSON.parse(await readFile(
        path.join(isolatedHome, "ScrumMasterNotebook", "runtime.json"), "utf8"));
      assert.equal(cfg.version, 2, "Les nouvelles installations doivent enregistrer un manifeste v2");
      assert.equal(cfg.cluster, path.join(newStorage, "data"));
      assert.notEqual(cfg.port, 55432, "SMN doit utiliser un autre port PostgreSQL si 55432 est interdit");
      console.log("PASS : port PostgreSQL automatiquement remplacé et persisté : " + cfg.port);
    }
    if (testRecovery) {
      const backups = path.join(newStorage, "recovery");
      const entries = await readdir(backups);
      assert.equal(entries.length, 1, "Une seule archive est attendue");
      assert.equal(await readFile(path.join(backups, entries[0], "ancien-essai.txt"), "utf8"), "donnees-preservees");
      console.log("PASS : l'ancienne tentative est archivée sans suppression avant la nouvelle installation.");
    }
    const diag = await (await fetchTimed(base + "/api/diagnostic")).json();
    assert.equal(diag.status, "initialized");
    const privatePage = await fetchTimed(base + "/app", { redirect: "manual" });
    assert.equal(privatePage.status, 307);
    const loginUrl = new URL(privatePage.headers.get("location"), base);
    assert.equal(loginUrl.pathname, "/login");
    const loginPage = await fetchTimed(loginUrl, { redirect: "manual" });
    assert.equal(loginPage.status, 200);
    const html = await loginPage.text();
    assert.match(html, /Scrum Master/);
    assert.match(html, /Notebook/);
    assert.match(html, /smn-login-heading/);
    const restrictedWelcome = await fetchTimed(base + "/welcome", {redirect:"manual"});
    assert.ok([307,308,404].includes(restrictedWelcome.status),
      "Après installation /welcome doit rediriger ou répondre 404, sans streamer le formulaire");
    if([307,308].includes(restrictedWelcome.status)) {
      const destination = new URL(restrictedWelcome.headers.get("location")??"",base);
      assert.equal(destination.pathname,"/","L'assistant fermé doit rediriger vers l'accueil");
    }
    const restrictedHtml = await restrictedWelcome.text();
    assert.doesNotMatch(restrictedHtml,/Installer Scrum Master Notebook|smn-local-setup|<form[^>]*>/,
      "Le formulaire d'installation ne doit plus être envoyé");
    console.log("PASS : installation Express complète dans une base Windows isolée.");
  } else {
    console.log("PASS : page d'accueil et assistant accessibles sans base implicite.");
  }

 } finally {
  if (blockedPostgresPort?.listening) {
    await new Promise(resolve => blockedPostgresPort.close(resolve));
  }
  const smnRoot = path.join(isolatedHome, "ScrumMasterNotebook");
  const ctl = path.join(newStorage, "pgsql", "bin", "pg_ctl.exe");
  if (existsSync(ctl) && existsSync(path.join(newStorage, "data"))) {
    spawnSync(ctl, ["-D", path.join(newStorage, "data"), "-m", "fast", "-w", "stop"], {
      windowsHide: true, stdio: "ignore",
    });
  }
  if (server?.pid) {
    const taskkill = spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    if (taskkill.status !== 0) server.kill();
  }
  // The test deliberately creates a disposable cluster in the distribution tree.
  // Remove it before upload; never ship a test database or its secrets.
  await rm(newStorage, { recursive: true, force: true, maxRetries: 8, retryDelay: 600 });
  await rm(isolatedHome, { recursive: true, force: true, maxRetries: 8, retryDelay: 600 });
}
