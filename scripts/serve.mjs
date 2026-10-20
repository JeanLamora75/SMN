#!/usr/bin/env node
// Démarre Next.js sur un port dédié, identique en développement et production.
// Passer les arguments séparément évite toute interpolation shell et toute fuite de secrets.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveSmnPort } from "./port-config.mjs";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "start" || process.argv.length !== 3) {
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

  console.log(`SMN : http://127.0.0.1:${port} (port configurable avec SMN_PORT)`);
  const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
  const child = spawn(
    process.execPath,
    [nextCli, mode, "--hostname", "127.0.0.1", "--port", String(port)],
    { stdio: "inherit", shell: false },
  );
  child.on("error", () => {
    console.error("Impossible de démarrer Next.js. Vérifiez pnpm install et la disponibilité du port SMN.");
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  });
}
