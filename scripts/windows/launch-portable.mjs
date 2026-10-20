// Lanceur du paquet Windows SMN : double-clic, sans Node ni pnpm installé.
// La fenêtre peut être fermée pour arrêter le serveur web local.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "win32") throw new Error("Windows x64 requis");
const root = path.dirname(fileURLToPath(import.meta.url));
const server = path.join(root, "server.js");
const url = "http://127.0.0.1:3003";
if (!existsSync(server)) throw new Error("SMN incomplet : server.js absent.");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function listening() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    const html = await response.text();
    return response.status === 200 && html.includes("Scrum Master Notebook");
  } catch { return false; }
}
function browser() {
  const p = spawn("cmd.exe", ["/c", "start", '""', url], {
    windowsHide: true, detached: true, stdio: "ignore", shell: false,
  });
  p.on("error", () => console.error("Ouvrez " + url + " dans votre navigateur."));
  p.unref();
}
if (await listening()) {
  browser();
} else {
  const child = spawn(process.execPath, [server], {
    cwd: root, env: { ...process.env, PORT: "3003", HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
    stdio: "inherit", windowsHide: false, shell: false,
  });
  child.on("error", e => console.error("Impossible de lancer le serveur SMN : " + e.message));
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) break;
    if (await listening()) { ready = true; browser(); break; }
    await sleep(500);
  }
  if (!ready) {
    console.error("SMN n'est pas disponible sur le port 3003. Vérifiez qu'il est libre.");
    child.kill();
    process.exitCode = 1;
  } else {
    console.log("SMN est ouvert dans votre navigateur sur " + url);
    console.log("Fermez cette fenêtre pour arrêter le serveur web.");
    process.on("SIGINT", () => child.kill("SIGINT"));
    process.on("SIGTERM", () => child.kill("SIGTERM"));
    await new Promise(resolve => child.once("exit", resolve));
  }
}
