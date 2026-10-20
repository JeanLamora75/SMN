#!/usr/bin/env node
// Validation destructive autorisée UNIQUEMENT sur PostgreSQL 18 éphémère GitHub Actions.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { Client } from "pg";

const uri = process.env.SMN_TEST_DATABASE_URL;
if (process.env.CI !== "true" || !uri || new URL(uri).pathname !== "/smn_ci") {
  throw new Error("Exécution interdite hors de GitHub Actions sur la base éphémère smn_ci.");
}
const base = "http://127.0.0.1:3003";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function launch(mode, port, overrides = {}) {
  const env = { ...process.env, ...overrides, SMN_PORT: String(port) };
  const child = spawn(process.execPath, ["scripts/serve.mjs", mode], {
    env, stdio: "ignore", shell: false,
  });
  child.on("error", () => undefined);
  return child;
}
async function stop(child) {
  if (!child) return;
  if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
  for (let i = 0; i < 30 && child.exitCode === null; i++) await pause(200);
}
async function waitHttp(port, child) {
  for (let i = 0; i < 90; i++) {
    if (child.exitCode !== null) throw new Error("Le serveur s'est arrêté avant de répondre.");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.status === 200) return;
    } catch { /* le serveur démarre encore */ }
    await pause(500);
  }
  throw new Error("Délai de démarrage HTTP dépassé.");
}
async function get(path, options = {}) {
  return fetch(base + path, { cache: "no-store", ...options });
}
async function withDb(fn) {
  const client = new Client({ connectionString: uri });
  try {
    await client.connect();
    return await fn(client);
  } finally { await client.end().catch(() => undefined); }
}

let app;
let alt;
try {
  app = launch("start", 3003, { SMN_DATABASE_URL: uri });
  await waitHttp(3003, app);
  let r = await get("/api/diagnostic");
  let data = await r.json();
  assert.equal(data.status, "virgin");
  assert.equal(data.canEnterSetup, true);
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await get("/setup")).status, 200);
  assert.equal((await get("/app")).status, 404);
  const french = await (await get("/", { headers: { "Accept-Language": "fr-FR" } })).text();
  assert.match(french, /<html lang="fr"/);
  assert.match(french, /Base SMN vierge/);
  assert.match(french, /href="\/setup"/);
  const english = await (await get("/", { headers: { "Accept-Language": "en-US" } })).text();
  assert.match(english, /<html lang="en"/);
  assert.match(english, /An empty SMN database/);

  await withDb((c) => c.query("CREATE VIEW public.foreign_view AS SELECT 1 AS value"));
  try {
    data = await (await get("/api/diagnostic")).json();
    assert.equal(data.status, "schema-incompatible");
    assert.equal((await get("/setup")).status, 404);
    assert.doesNotMatch(await (await get("/")).text(), /href="\/setup"/);
  } finally {
    await withDb((c) => c.query("DROP VIEW IF EXISTS public.foreign_view"));
  }

  await withDb(async (c) => {
    await c.query("CREATE TABLE public.smn_installation (id text PRIMARY KEY, state text, schema_version int)");
    await c.query("CREATE TABLE public._prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz)");
    await c.query("INSERT INTO public.smn_installation VALUES ('singleton','initialized',1)");
    await c.query("INSERT INTO public._prisma_migrations VALUES ('fixture',now(),null)");
  });
  try {
    data = await (await get("/api/diagnostic")).json();
    assert.equal(data.status, "initialized");
    assert.equal((await get("/setup")).status, 404);
    await withDb((c) => c.query("UPDATE public._prisma_migrations SET finished_at=null"));
    data = await (await get("/api/diagnostic")).json();
    assert.equal(data.status, "installation-incomplete");
    assert.equal((await get("/setup")).status, 404);
  } finally {
    await withDb(async (c) => {
      await c.query("DROP TABLE IF EXISTS public._prisma_migrations");
      await c.query("DROP TABLE IF EXISTS public.smn_installation");
    });
  }

  // Sur port occupé, le second lanceur doit refuser sans port alternatif.
  const conflicting = launch("start", 3003, { SMN_DATABASE_URL: uri });
  for (let i = 0; i < 50 && conflicting.exitCode === null; i++) await pause(200);
  assert.notEqual(conflicting.exitCode, null, "Port occupé : le second serveur doit s'arrêter.");
  assert.notEqual(conflicting.exitCode, 0);
  for (const port of [3000, 3001, 3002]) {
    const forbidden = launch("start", port, { SMN_DATABASE_URL: uri });
    for (let i = 0; i < 25 && forbidden.exitCode === null; i++) await pause(100);
    assert.notEqual(forbidden.exitCode, 0, "Port réservé accepté : " + port);
    await stop(forbidden);
  }
  await stop(app);
  app = undefined;
  alt = launch("start", 3010, { SMN_DATABASE_URL: uri });
  await waitHttp(3010, alt);
  assert.equal((await fetch("http://127.0.0.1:3010/")).status, 200);
  console.log("SMN-11 : HTTP, diagnostics PG, langues, headers et ports réussis.");
} finally {
  await stop(app);
  await stop(alt);
}
