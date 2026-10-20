#!/usr/bin/env node
// Préconditions non sensibles. Le contrôle de connexion est réalisé par la page serveur.
const major = Number(process.versions.node.split(".")[0]);
if (major !== 24) {
  console.error("SMN requiert Node.js 24 LTS. Version détectée : " + process.versions.node);
  process.exitCode = 1;
} else {
  console.log("Node.js 24 LTS détecté.");
}
console.log("Configuration PostgreSQL : à renseigner localement (SMN_DATABASE_URL).");
console.log("Le diagnostic PostgreSQL détaillé est disponible sur http://127.0.0.1:3000.");
