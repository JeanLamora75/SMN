#!/usr/bin/env node
import { resolveSmnPort } from "./port-config.mjs";

// Diagnostic CLI volontairement sans secret ni modification de base.
// La connexion réelle est effectuée uniquement par le diagnostic web.
const major = Number(process.versions.node.split(".")[0]);
if (major !== 24) {
  console.error("SMN requiert Node.js 24 LTS. Version détectée : " + process.versions.node);
  process.exitCode = 1;
} else {
  console.log("Node.js 24 LTS détecté.");
}
try {
  const port = resolveSmnPort();
  console.log(`URL prévue : http://127.0.0.1:${port}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Port SMN invalide.");
  process.exitCode = 1;
}
console.log(process.env.SMN_DATABASE_URL
  ? "SMN_DATABASE_URL : présente, connexion non encore contrôlée. Lancez pnpm dev pour consulter le diagnostic PostgreSQL réel."
  : "SMN_DATABASE_URL : absente. La base SMN sera créée par le futur installateur SMN-12 après confirmation.");
