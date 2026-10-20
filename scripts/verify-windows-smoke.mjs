#!/usr/bin/env node
// Smoke HTTP multiplateforme du démarrage développement, sans base ni secrets.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const env = { ...process.env, SMN_PORT: "3003", SMN_DATABASE_URL: "" };
const child = spawn(process.execPath, ["scripts/serve.mjs", "dev"], {
  env, stdio: "ignore", shell: false,
});
child.on("error", () => undefined);
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error("pnpm dev s'est arrêté pendant le lancement.");
    try {
      const page = await fetch("http://127.0.0.1:3003/");
      if (page.status === 200) { ready = true; break; }
    } catch { /* attendre Next */ }
    await pause(500);
  }
  assert.equal(ready, true, "SMN ne répond pas sur 3003.");
  const response = await fetch("http://127.0.0.1:3003/api/diagnostic");
  assert.equal((await response.json()).status, "configuration-missing");
  assert.equal((await fetch("http://127.0.0.1:3003/app")).status, 404);
  assert.equal((await fetch("http://127.0.0.1:3003/setup")).status, 404);
  console.log("Smoke démarrage dev sur Windows/Linux réussi (sans PostgreSQL).");
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
}
