#!/usr/bin/env node
// Smoke HTTP multiplateforme du démarrage développement, sans base ni secrets.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const port = 3003;
const listening = () => new Promise((resolve) => {
  const socket = net.createConnection({ host: "127.0.0.1", port });
  socket.once("connect", () => { socket.destroy(); resolve(true); });
  socket.once("error", () => { socket.destroy(); resolve(false); });
  socket.setTimeout(1000, () => { socket.destroy(); resolve(true); });
});
assert.equal(await listening(), false, "Le port 3003 est occupé avant le smoke test, test non isolé.");
const env = { ...process.env, SMN_PORT: String(port), SMN_DATABASE_URL: "" };
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
  const privateResponse = await fetch("http://127.0.0.1:3003/app", { redirect: "manual" });
  assert.equal(privateResponse.status, 307);
  assert.equal(new URL(privateResponse.headers.get("location"), "http://127.0.0.1:3003").pathname, "/login");
  assert.equal((await fetch("http://127.0.0.1:3003/setup")).status, 404);
  assert.equal(child.exitCode, null, "Le serveur démarré doit rester vivant pendant les vérifications.");
  console.log("Smoke démarrage dev sur Windows/Linux réussi (sans PostgreSQL).");
} finally {
  if (child.exitCode === null) {
    if (process.platform === "win32" && child.pid) {
      const result = spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { encoding: "utf8" });
      if (result.status !== 0) child.kill();
    } else child.kill("SIGTERM");
  }
  for (let i = 0; i < 50 && await listening(); i++) await pause(200);
  assert.equal(await listening(), false, "Le port 3003 reste occupé après arrêt du smoke test.");
}
