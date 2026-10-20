#!/usr/bin/env node
// Service Next uniquement sur loopback ; ne jamais transférer les identifiants par URL.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveSmnPort } from "./port-config.mjs";

const mode = process.argv[2];
if (!["dev", "start"].includes(mode) || process.argv.length !== 3) {
  console.error("Usage : pnpm dev ou pnpm start.");
  process.exitCode = 1;
} else {
  let port;
  try {
    port = resolveSmnPort();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Configuration de port invalide.");
    process.exit(1);
  }

  // Ne pas annoncer « prêt » avant la véritable disponibilité de Next.
  console.log(`SMN : démarrage demandé sur http://127.0.0.1:${port} (Next confirmera la disponibilité)`);
  const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
  const child = spawn(
    process.execPath,
    [nextCli, mode, "--hostname", "127.0.0.1", "--port", String(port)],
    { stdio: "inherit", shell: false },
  );
  const stop = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  child.on("error", () => {
    console.error("Impossible de démarrer Next.js. Vérifiez pnpm install et la disponibilité du port SMN.");
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  });
}
