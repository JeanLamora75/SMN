# SMN-11 — Blind Hunter, deuxième revue indépendante

**Instantané :** `7f691688540330341fbf1260743d153521b2a66c`, au 20/10/2026. Cette deuxième revue examine les changements applicatifs et la configuration après les correctifs des premières revues. Aucun résultat de la première revue n'est fourni pour préserver l'indépendance. Les seules exclusions sont les grands fichiers de dépendances verrouillées et les journaux de revue (inchangés dans la logique métier).

**Consigne :** Relecteur BMAD Blind Hunter : conduire une revue du CONTENU. Chercher en premier ce qui manque, sans se limiter aux erreurs. Calculer le seuil N = min(floor(sqrt(kB)+1), 10), indiquer le calcul puis produire au moins N constats, ou davantage si nécessaire. Sortie : liste Markdown des constats avec emplacements précis, sans gravité ni classement. Ne pas lancer d'autres agents ni modifier GitHub/Jira. Le diff complet des fichiers applicatifs est reproduit ci-dessous.

===== BEGIN DIFF =====
diff --git a/.github/workflows/verify-i0.yml b/.github/workflows/verify-i0.yml
new file mode 100644
index 0000000..68a4462
--- /dev/null
+++ b/.github/workflows/verify-i0.yml
@@ -0,0 +1,92 @@
+name: Vérification I0
+
+on:
+  push:
+    branches: ["dev/bmad-i0-20261020", "main"]
+  pull_request:
+    branches: ["main", "docs/bmad-sprint-readiness-20261019"]
+
+permissions:
+  contents: read
+
+jobs:
+  linux-postgres:
+    runs-on: ubuntu-latest
+    services:
+      postgres:
+        image: postgres:18
+        env:
+          POSTGRES_USER: smn_ci
+          POSTGRES_PASSWORD: smn_ci_ephemeral_test
+          POSTGRES_DB: smn_ci
+        ports: ["5432:5432"]
+        options: >-
+          --health-cmd "pg_isready -U smn_ci -d smn_ci"
+          --health-interval 10s
+          --health-timeout 5s
+          --health-retries 5
+    env:
+      SMN_TEST_DATABASE_URL: postgresql://smn_ci:smn_ci_ephemeral_test@127.0.0.1:5432/smn_ci
+      SMN_DATABASE_URL: postgresql://smn_ci:smn_ci_ephemeral_test@127.0.0.1:5432/smn_ci
+      NEXT_TELEMETRY_DISABLED: "1"
+    steps:
+      - uses: actions/checkout@v4
+        with:
+          persist-credentials: false
+      - uses: actions/setup-node@v4
+        with:
+          node-version: "24"
+      - uses: pnpm/action-setup@v4
+        with:
+          version: "12.10.0"
+          run_install: false
+      - name: Installer exclusivement les versions verrouillées
+        run: pnpm install --frozen-lockfile
+      - name: Lint
+        run: pnpm lint
+      - name: Tests unitaires et intégration PG réelle
+        run: pnpm test
+      - name: Typecheck
+        run: pnpm typecheck
+      - name: Diagnostic de port et de prérequis
+        run: |
+          pnpm run doctor
+          SMN_PORT=3010 pnpm run doctor
+          if SMN_PORT=3000 pnpm run doctor; then
+            echo "SMN a accepté un port réservé."
+            exit 1
+          fi
+      - name: Build de production
+        run: pnpm build
+      - name: HTTP production et diagnostics PostgreSQL
+        run: node scripts/verify-http-ci.mjs
+
+  windows-smoke:
+    runs-on: windows-latest
+    env:
+      NEXT_TELEMETRY_DISABLED: "1"
+    steps:
+      - uses: actions/checkout@v4
+        with:
+          persist-credentials: false
+      - uses: actions/setup-node@v4
+        with:
+          node-version: "24"
+      - uses: pnpm/action-setup@v4
+        with:
+          version: "12.10.0"
+          run_install: false
+      - name: Installer les dépendances (Windows sans élévation)
+        run: pnpm install --frozen-lockfile
+      - name: Test de langage, ports et règles (PG réel explicitement ignoré hors CI DB)
+        run: pnpm test
+        env:
+          CI: "false"
+      - name: Typecheck et build Windows
+        run: |
+          pnpm typecheck
+          pnpm build
+      - name: Diagnostiquer les prérequis
+        run: pnpm run doctor
+      - name: Démarrer Next en mode dev sous Windows
+        run: node scripts/verify-windows-smoke.mjs

diff --git a/eslint.config.mjs b/eslint.config.mjs
new file mode 100644
index 0000000..69f6e82
--- /dev/null
+++ b/eslint.config.mjs
@@ -0,0 +1,7 @@
+import { defineConfig, globalIgnores } from "eslint/config";
+import nextVitals from "eslint-config-next/core-web-vitals";
+
+export default defineConfig([
+  ...nextVitals,
+  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),
+]);

diff --git a/next.config.ts b/next.config.ts
new file mode 100644
index 0000000..2f6491c
--- /dev/null
+++ b/next.config.ts
@@ -0,0 +1,7 @@
+import type { NextConfig } from "next";
+
+const nextConfig: NextConfig = {
+  reactStrictMode: true,
+};
+
+export default nextConfig;

diff --git a/package.json b/package.json
new file mode 100644
index 0000000..e344d4d
--- /dev/null
+++ b/package.json
@@ -0,0 +1,39 @@
+{
+  "name": "scrum-master-notebook",
+  "version": "0.1.0",
+  "private": true,
+  "engines": {
+    "node": ">=24 <25"
+  },
+  "packageManager": "pnpm@12.10.0",
+  "scripts": {
+    "dev": "node scripts/serve.mjs dev",
+    "build": "next build",
+    "start": "node scripts/serve.mjs start",
+    "lint": "eslint .",
+    "test": "tsx --test tests/*.test.ts tests/*.test.mjs",
+    "typecheck": "tsc --noEmit",
+    "doctor": "node scripts/doctor.mjs"
+  },
+  "dependencies": {
+    "@prisma/adapter-pg": "7.0.0",
+    "@prisma/client": "7.0.0",
+    "better-auth": "1.4.5",
+    "bootstrap": "5.3.8",
+    "next": "16.0.0",
+    "pg": "8.16.3",
+    "react": "19.2.0",
+    "react-dom": "19.2.0"
+  },
+  "devDependencies": {
+    "@types/node": "24.9.1",
+    "@types/pg": "8.15.5",
+    "@types/react": "19.2.2",
+    "@types/react-dom": "19.2.2",
+    "eslint": "9.39.1",
+    "eslint-config-next": "16.0.0",
+    "prisma": "7.0.0",
+    "tsx": "4.20.6",
+    "typescript": "5.9.3"
+  }
+}

diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
new file mode 100644
index 0000000..9447115
--- /dev/null
+++ b/pnpm-workspace.yaml
@@ -0,0 +1,14 @@
+# Politique stricte pnpm 12 : approbation explicite des seuls hooks attendus.
+allowBuilds:
+  "@prisma/engines": true
+  "esbuild": true
+  "prisma": true
+  "sharp": true
+  "unrs-resolver": true
+# Compatibilité avec les versions plus anciennes de pnpm.
+onlyBuiltDependencies:
+  - "@prisma/engines"
+  - "esbuild"
+  - "prisma"
+  - "sharp"
+  - "unrs-resolver"

diff --git a/prisma.config.ts b/prisma.config.ts
new file mode 100644
index 0000000..4d4dcf6
--- /dev/null
+++ b/prisma.config.ts
@@ -0,0 +1,9 @@
+import { defineConfig } from "prisma/config";
+
+// La génération/application des migrations est réservée à SMN-12.
+// Ne jamais déduire une URL de connexion depuis DATABASE_URL (risque LMN24).
+export default defineConfig({
+  schema: "prisma/schema.prisma",
+  migrations: { path: "prisma/migrations" },
+  datasource: { url: process.env.SMN_DATABASE_URL || "" },
+});

diff --git a/prisma/schema.prisma b/prisma/schema.prisma
new file mode 100644
index 0000000..a54f014
--- /dev/null
+++ b/prisma/schema.prisma
@@ -0,0 +1,18 @@
+// Contrat de la future installation (SMN-12). Aucun migrate automatique dans SMN-11.
+generator client {
+  provider = "prisma-client"
+  output   = "../src/generated/prisma"
+}
+
+datasource db {
+  provider = "postgresql"
+}
+
+model SmnInstallation {
+  id            String   @id
+  state         String
+  schemaVersion Int      @map("schema_version")
+  createdAt     DateTime @default(now()) @map("created_at")
+
+  @@map("smn_installation")
+}

diff --git a/scripts/doctor.mjs b/scripts/doctor.mjs
new file mode 100644
index 0000000..3ab528c
--- /dev/null
+++ b/scripts/doctor.mjs
@@ -0,0 +1,22 @@
+#!/usr/bin/env node
+import { resolveSmnPort } from "./port-config.mjs";
+
+// Diagnostic CLI volontairement sans secret ni modification de base.
+// La connexion réelle est effectuée uniquement par le diagnostic web.
+const major = Number(process.versions.node.split(".")[0]);
+if (major !== 24) {
+  console.error("SMN requiert Node.js 24 LTS. Version détectée : " + process.versions.node);
+  process.exitCode = 1;
+} else {
+  console.log("Node.js 24 LTS détecté.");
+}
+try {
+  const port = resolveSmnPort();
+  console.log(`URL prévue : http://127.0.0.1:${port}`);
+} catch (error) {
+  console.error(error instanceof Error ? error.message : "Port SMN invalide.");
+  process.exitCode = 1;
+}
+console.log(process.env.SMN_DATABASE_URL
+  ? "SMN_DATABASE_URL : présente, connexion non encore contrôlée. Lancez pnpm dev pour consulter le diagnostic PostgreSQL réel."
+  : "SMN_DATABASE_URL : absente. La base SMN sera créée par le futur installateur SMN-12 après confirmation.");

diff --git a/scripts/port-config.mjs b/scripts/port-config.mjs
new file mode 100644
index 0000000..a280d03
--- /dev/null
+++ b/scripts/port-config.mjs
@@ -0,0 +1,18 @@
+// Configuration locale unique des ports web SMN. Aucune lecture de secrets.
+export const DEFAULT_SMN_PORT = 3003;
+export const RESERVED_PORTS = Object.freeze([3000, 3001, 3002]);
+
+export function resolveSmnPort(raw = process.env.SMN_PORT) {
+  if (raw === undefined || raw === "") return DEFAULT_SMN_PORT;
+  if (!/^[0-9]+$/.test(raw)) {
+    throw new Error("SMN_PORT doit contenir un numéro de port entier (1024 à 65535).");
+  }
+  const port = Number(raw);
+  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) {
+    throw new Error("SMN_PORT doit être compris entre 1024 et 65535.");
+  }
+  if (RESERVED_PORTS.includes(port)) {
+    throw new Error("Les ports 3000, 3001 et 3002 sont réservés à l'autre projet. Choisissez un autre port.");
+  }
+  return port;
+}

diff --git a/scripts/serve.mjs b/scripts/serve.mjs
new file mode 100644
index 0000000..4d9e7a0
--- /dev/null
+++ b/scripts/serve.mjs
@@ -0,0 +1,40 @@
+#!/usr/bin/env node
+// Service Next uniquement sur loopback ; ne jamais transférer les identifiants par URL.
+import { spawn } from "node:child_process";
+import { fileURLToPath } from "node:url";
+import { resolveSmnPort } from "./port-config.mjs";
+
+const mode = process.argv[2];
+if (!["dev", "start"].includes(mode) || process.argv.length !== 3) {
+  console.error("Usage : pnpm dev ou pnpm start.");
+  process.exitCode = 1;
+} else {
+  let port;
+  try {
+    port = resolveSmnPort();
+  } catch (error) {
+    console.error(error instanceof Error ? error.message : "Configuration de port invalide.");
+    process.exit(1);
+  }
+
+  // Ne pas annoncer « prêt » avant la véritable disponibilité de Next.
+  console.log(`SMN : démarrage demandé sur http://127.0.0.1:${port} (Next confirmera la disponibilité)`);
+  const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
+  const child = spawn(
+    process.execPath,
+    [nextCli, mode, "--hostname", "127.0.0.1", "--port", String(port)],
+    { stdio: "inherit", shell: false },
+  );
+  const stop = (signal) => {
+    if (!child.killed) child.kill(signal);
+  };
+  process.on("SIGINT", () => stop("SIGINT"));
+  process.on("SIGTERM", () => stop("SIGTERM"));
+  child.on("error", () => {
+    console.error("Impossible de démarrer Next.js. Vérifiez pnpm install et la disponibilité du port SMN.");
+    process.exitCode = 1;
+  });
+  child.on("exit", (code, signal) => {
+    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
+  });
+}

diff --git a/scripts/verify-http-ci.mjs b/scripts/verify-http-ci.mjs
new file mode 100644
index 0000000..54093f4
--- /dev/null
+++ b/scripts/verify-http-ci.mjs
@@ -0,0 +1,130 @@
+#!/usr/bin/env node
+// Validation destructive autorisée UNIQUEMENT sur PostgreSQL 18 éphémère GitHub Actions.
+import assert from "node:assert/strict";
+import { spawn } from "node:child_process";
+import { Client } from "pg";
+
+const uri = process.env.SMN_TEST_DATABASE_URL;
+if (process.env.CI !== "true" || !uri || new URL(uri).pathname !== "/smn_ci") {
+  throw new Error("Exécution interdite hors de GitHub Actions sur la base éphémère smn_ci.");
+}
+const base = "http://127.0.0.1:3003";
+const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
+function launch(mode, port, overrides = {}) {
+  const env = { ...process.env, ...overrides, SMN_PORT: String(port) };
+  const child = spawn(process.execPath, ["scripts/serve.mjs", mode], {
+    env, stdio: "ignore", shell: false,
+  });
+  child.on("error", () => undefined);
+  return child;
+}
+async function stop(child) {
+  if (!child) return;
+  if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
+  for (let i = 0; i < 30 && child.exitCode === null; i++) await pause(200);
+}
+async function waitHttp(port, child) {
+  for (let i = 0; i < 90; i++) {
+    if (child.exitCode !== null) throw new Error("Le serveur s'est arrêté avant de répondre.");
+    try {
+      const response = await fetch(`http://127.0.0.1:${port}/`);
+      if (response.status === 200) return;
+    } catch { /* le serveur démarre encore */ }
+    await pause(500);
+  }
+  throw new Error("Délai de démarrage HTTP dépassé.");
+}
+async function get(path, options = {}) {
+  return fetch(base + path, { cache: "no-store", ...options });
+}
+async function withDb(fn) {
+  const client = new Client({ connectionString: uri });
+  try {
+    await client.connect();
+    return await fn(client);
+  } finally { await client.end().catch(() => undefined); }
+}
+
+let app;
+let alt;
+try {
+  app = launch("start", 3003, { SMN_DATABASE_URL: uri });
+  await waitHttp(3003, app);
+  let r = await get("/api/diagnostic");
+  let data = await r.json();
+  assert.equal(data.status, "virgin");
+  assert.equal(data.canEnterSetup, true);
+  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
+  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
+  assert.equal((await get("/setup")).status, 200);
+  assert.equal((await get("/app")).status, 404);
+  const french = await (await get("/", { headers: { "Accept-Language": "fr-FR" } })).text();
+  assert.match(french, /<html lang="fr"/);
+  assert.match(french, /Base SMN vierge/);
+  assert.match(french, /href="\/setup"/);
+  const english = await (await get("/", { headers: { "Accept-Language": "en-US" } })).text();
+  assert.match(english, /<html lang="en"/);
+  assert.match(english, /An empty SMN database/);
+
+  await withDb((c) => c.query("CREATE VIEW public.foreign_view AS SELECT 1 AS value"));
+  try {
+    data = await (await get("/api/diagnostic")).json();
+    assert.equal(data.status, "schema-incompatible");
+    assert.equal((await get("/setup")).status, 404);
+    assert.doesNotMatch(await (await get("/")).text(), /href="\/setup"/);
+  } finally {
+    await withDb((c) => c.query("DROP VIEW IF EXISTS public.foreign_view"));
+  }
+
+  await withDb(async (c) => {
+    await c.query("CREATE TABLE public.smn_installation (id text PRIMARY KEY, state text, schema_version int)");
+    await c.query("CREATE TABLE public._prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz)");
+    await c.query("INSERT INTO public.smn_installation VALUES ('singleton','initialized',1)");
+    await c.query("INSERT INTO public._prisma_migrations VALUES ('fixture',now(),null)");
+  });
+  try {
+    data = await (await get("/api/diagnostic")).json();
+    assert.equal(data.status, "initialized");
+    assert.equal((await get("/setup")).status, 404);
+    await withDb((c) => c.query("UPDATE public._prisma_migrations SET finished_at=null"));
+    data = await (await get("/api/diagnostic")).json();
+    assert.equal(data.status, "installation-incomplete");
+    assert.equal((await get("/setup")).status, 404);
+  } finally {
+    await withDb(async (c) => {
+      await c.query("DROP TABLE IF EXISTS public._prisma_migrations");
+      await c.query("DROP TABLE IF EXISTS public.smn_installation");
+    });
+  }
+
+  // Sur port occupé, le second lanceur doit refuser sans port alternatif.
+  const conflicting = launch("start", 3003, { SMN_DATABASE_URL: uri });
+  for (let i = 0; i < 50 && conflicting.exitCode === null; i++) await pause(200);
+  assert.notEqual(conflicting.exitCode, null, "Port occupé : le second serveur doit s'arrêter.");
+  assert.notEqual(conflicting.exitCode, 0);
+  for (const port of [3000, 3001, 3002]) {
+    const forbidden = launch("start", port, { SMN_DATABASE_URL: uri });
+    for (let i = 0; i < 25 && forbidden.exitCode === null; i++) await pause(100);
+    assert.notEqual(forbidden.exitCode, 0, "Port réservé accepté : " + port);
+    await stop(forbidden);
+  }
+  await stop(app);
+  app = undefined;
+  alt = launch("start", 3010, { SMN_DATABASE_URL: uri });
+  await waitHttp(3010, alt);
+  assert.equal((await fetch("http://127.0.0.1:3010/")).status, 200);
+  await stop(alt);
+  alt = undefined;
+  const invalid = launch("start", 3010, {
+    SMN_DATABASE_URL: "postgresql://nobody:invalid@127.0.0.1:5432/lmn24",
+  });
+  alt = invalid;
+  await waitHttp(3010, alt);
+  const invalidDiagnostic = await (await fetch("http://127.0.0.1:3010/api/diagnostic")).json();
+  assert.equal(invalidDiagnostic.status, "configuration-invalid");
+  assert.equal((await fetch("http://127.0.0.1:3010/setup")).status, 404);
+  console.log("SMN-11 : HTTP, diagnostics PG, langues, headers, routes et ports réussis.");
+} finally {
+  await stop(app);
+  await stop(alt);
+}

diff --git a/scripts/verify-windows-smoke.mjs b/scripts/verify-windows-smoke.mjs
new file mode 100644
index 0000000..efa9c87
--- /dev/null
+++ b/scripts/verify-windows-smoke.mjs
@@ -0,0 +1,30 @@
+#!/usr/bin/env node
+// Smoke HTTP multiplateforme du démarrage développement, sans base ni secrets.
+import assert from "node:assert/strict";
+import { spawn } from "node:child_process";
+
+const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
+const env = { ...process.env, SMN_PORT: "3003", SMN_DATABASE_URL: "" };
+const child = spawn(process.execPath, ["scripts/serve.mjs", "dev"], {
+  env, stdio: "ignore", shell: false,
+});
+child.on("error", () => undefined);
+try {
+  let ready = false;
+  for (let i = 0; i < 120; i++) {
+    if (child.exitCode !== null) throw new Error("pnpm dev s'est arrêté pendant le lancement.");
+    try {
+      const page = await fetch("http://127.0.0.1:3003/");
+      if (page.status === 200) { ready = true; break; }
+    } catch { /* attendre Next */ }
+    await pause(500);
+  }
+  assert.equal(ready, true, "SMN ne répond pas sur 3003.");
+  const response = await fetch("http://127.0.0.1:3003/api/diagnostic");
+  assert.equal((await response.json()).status, "configuration-missing");
+  assert.equal((await fetch("http://127.0.0.1:3003/app")).status, 404);
+  assert.equal((await fetch("http://127.0.0.1:3003/setup")).status, 404);
+  console.log("Smoke démarrage dev sur Windows/Linux réussi (sans PostgreSQL).");
+} finally {
+  if (child.exitCode === null) child.kill("SIGTERM");
+}

diff --git a/src/app/api/diagnostic/route.ts b/src/app/api/diagnostic/route.ts
new file mode 100644
index 0000000..b8a8d85
--- /dev/null
+++ b/src/app/api/diagnostic/route.ts
@@ -0,0 +1,11 @@
+import { NextResponse } from "next/server";
+import { currentInstallationDiagnostic } from "@/server/installation/current";
+
+export const dynamic = "force-dynamic";
+
+export async function GET() {
+  const diagnostic = await currentInstallationDiagnostic();
+  return NextResponse.json(diagnostic, {
+    headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" },
+  });
+}

diff --git a/src/app/app/page.tsx b/src/app/app/page.tsx
new file mode 100644
index 0000000..c596860
--- /dev/null
+++ b/src/app/app/page.tsx
@@ -0,0 +1,8 @@
+import { notFound } from "next/navigation";
+import { canVisitPrivate } from "@/server/access-policy";
+
+export default function PrivatePage() {
+  if (!canVisitPrivate()) notFound();
+  // Impossible pour SMN-11 : l'authentification sera introduite par SMN-14.
+  notFound();
+}

diff --git a/src/app/globals.css b/src/app/globals.css
new file mode 100644
index 0000000..5ce061e
--- /dev/null
+++ b/src/app/globals.css
@@ -0,0 +1,7 @@
+:root { color-scheme: light; }
+body { min-height: 100vh; background: #f5f7fb; color: #15233b; }
+.smn-page { max-width: 870px; }
+.smn-mark { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 14px; background: #154d8d; color: #fff; font-weight: 800; letter-spacing: .03em; }
+.smn-panel { border: 1px solid #d9e2ee; border-radius: 18px; background: #fff; box-shadow: 0 14px 42px rgba(15,32,57,.06); }
+.smn-subtitle { color: #51617a; }
+code { overflow-wrap: anywhere; }

diff --git a/src/app/layout.tsx b/src/app/layout.tsx
new file mode 100644
index 0000000..378aac1
--- /dev/null
+++ b/src/app/layout.tsx
@@ -0,0 +1,19 @@
+import "bootstrap/dist/css/bootstrap.min.css";
+import "./globals.css";
+import type { Metadata } from "next";
+import type { ReactNode } from "react";
+import { browserLanguage } from "@/lib/messages";
+
+export const metadata: Metadata = {
+  title: "Scrum Master Notebook",
+  description: "Démarrage et diagnostic de l'installation locale SMN",
+};
+
+export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
+  const lang = await browserLanguage();
+  return (
+    <html lang={lang}>
+      <body>{children}</body>
+    </html>
+  );
+}

diff --git a/src/app/not-found.tsx b/src/app/not-found.tsx
new file mode 100644
index 0000000..6e0d7a3
--- /dev/null
+++ b/src/app/not-found.tsx
@@ -0,0 +1,13 @@
+import Link from "next/link";
+
+export default function NotFoundPage() {
+  return (
+    <main className="smn-page container py-5">
+      <div className="smn-panel p-4">
+        <h1 className="h3">Accès indisponible / Access unavailable</h1>
+        <p>L&apos;accès est refusé ou la page n&apos;existe pas. / Access is denied or this page does not exist.</p>
+        <Link href="/" className="btn btn-outline-primary">Accueil / Home</Link>
+      </div>
+    </main>
+  );
+}

diff --git a/src/app/page.tsx b/src/app/page.tsx
new file mode 100644
index 0000000..f2af930
--- /dev/null
+++ b/src/app/page.tsx
@@ -0,0 +1,45 @@
+import Link from "next/link";
+import { browserLanguage, translations } from "@/lib/messages";
+import { currentInstallationDiagnostic } from "@/server/installation/current";
+import { canVisitSetup } from "@/server/access-policy";
+
+export const dynamic = "force-dynamic";
+
+export default async function HomePage() {
+  const [diagnostic, lang] = await Promise.all([
+    currentInstallationDiagnostic(),
+    browserLanguage(),
+  ]);
+  const en = lang === "en";
+  const status = translations[lang][diagnostic.status];
+
+  return (
+    <main className="smn-page container py-5">
+      <header className="d-flex align-items-center gap-3 mb-5">
+        <span className="smn-mark">SMN</span>
+        <div>
+          <h1 className="h3 mb-1">Scrum Master Notebook</h1>
+          <p className="smn-subtitle mb-0">{en ? "Local startup & requirements" : "Démarrage local et prérequis"}</p>
+        </div>
+      </header>
+      <section className="smn-panel p-4 p-md-5" aria-labelledby="diagnostic-heading">
+        <h2 id="diagnostic-heading" className="h4 mb-3">{en ? "Installation diagnostics" : "Diagnostic de l'installation"}</h2>
+        <p role="status" className="lead">{status}</p>
+        <p className="smn-subtitle">
+          {en
+            ? "No database or account is created when the server starts. Private routes are blocked until secure login is implemented."
+            : "Le démarrage ne crée aucune base ni aucun compte. Les pages privées restent protégées jusqu'à la livraison de l'authentification."}
+        </p>
+        <div className="d-flex flex-wrap gap-2 mt-4">
+          <Link className="btn btn-outline-primary" href="/">{en ? "Retry diagnostics" : "Relancer le diagnostic"}</Link>
+          {canVisitSetup(diagnostic) && (
+            <Link className="btn btn-primary" href="/setup">
+              {en ? "Prepare installation" : "Préparer l'installation"}
+            </Link>
+          )}
+        </div>
+      </section>
+      <p className="small smn-subtitle mt-4">{en ? "I0 / SMN-11 — prerequisite checks only" : "I0 / SMN-11 — contrôle des prérequis uniquement"}</p>
+    </main>
+  );
+}

diff --git a/src/app/setup/page.tsx b/src/app/setup/page.tsx
new file mode 100644
index 0000000..c996e1e
--- /dev/null
+++ b/src/app/setup/page.tsx
@@ -0,0 +1,27 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+import { currentInstallationDiagnostic } from "@/server/installation/current";
+import { canVisitSetup } from "@/server/access-policy";
+import { browserLanguage } from "@/lib/messages";
+
+export const dynamic = "force-dynamic";
+
+export default async function SetupPage() {
+  const diagnostic = await currentInstallationDiagnostic();
+  if (!canVisitSetup(diagnostic)) notFound();
+  const en = (await browserLanguage()) === "en";
+  return (
+    <main className="smn-page container py-5">
+      <div className="smn-panel p-4">
+        <h1 className="h3">{en ? "Prepare your installation" : "Préparer votre installation"}</h1>
+        <p>{en ? "Your dedicated SMN database is empty." : "Votre base de données SMN dédiée est vierge."}</p>
+        <p className="smn-subtitle">
+          {en
+            ? "The guided setup, database creation and administrator account will be implemented in SMN-12. No installation changes are made here."
+            : "L'assistant, la création de la base et du compte administrateur seront livrés dans SMN-12. Cette page ne modifie rien."}
+        </p>
+        <Link href="/" className="btn btn-outline-primary">{en ? "Back to diagnostics" : "Retour au diagnostic"}</Link>
+      </div>
+    </main>
+  );
+}

diff --git a/src/lib/language.ts b/src/lib/language.ts
new file mode 100644
index 0000000..69e7b5d
--- /dev/null
+++ b/src/lib/language.ts
@@ -0,0 +1,21 @@
+export type Language = "fr" | "en";
+
+// La préférence explicite de l'utilisateur prime sur l'ordre des langues
+// non supportées. q=0 signifie langue refusée, jamais langue préférée.
+export function negotiateLanguage(acceptLanguage: string | null | undefined): Language {
+  if (!acceptLanguage) return "fr";
+  const supported: { lang: Language; q: number; order: number }[] = [];
+  for (const [order, part] of acceptLanguage.toLowerCase().split(",").entries()) {
+    const [tag, ...params] = part.trim().split(";");
+    const language = tag.split("-")[0];
+    if (language !== "fr" && language !== "en") continue;
+    let q = 1;
+    for (const p of params) {
+      const m = /^\s*q=([0-9]+(?:\.[0-9]+)?)\s*$/.exec(p);
+      if (m) q = Number(m[1]);
+    }
+    if (q > 0 && q <= 1) supported.push({ lang: language, q, order });
+  }
+  supported.sort((a, b) => b.q - a.q || a.order - b.order);
+  return supported[0]?.lang ?? "fr";
+}

diff --git a/src/lib/messages.ts b/src/lib/messages.ts
new file mode 100644
index 0000000..00f496c
--- /dev/null
+++ b/src/lib/messages.ts
@@ -0,0 +1,37 @@
+import "server-only";
+import { headers } from "next/headers";
+import { negotiateLanguage } from "./language";
+import type { Language } from "./language";
+import type { DiagnosticStatus } from "@/server/installation/diagnostic";
+
+export type { Language } from "./language";
+export async function browserLanguage(): Promise<Language> {
+  return negotiateLanguage((await headers()).get("accept-language"));
+}
+
+export const translations: Record<Language, Record<DiagnosticStatus, string>> = {
+  fr: {
+    "configuration-missing": "La connexion à la base SMN n'est pas encore configurée.",
+    "configuration-invalid": "Le paramétrage SMN doit désigner une base dédiée sur PostgreSQL local.",
+    "database-missing": "La base SMN n'existe pas encore : elle sera créée par le futur installateur après confirmation.",
+    "connection-error": "Connexion PostgreSQL impossible. Vérifiez le service et les paramètres locaux, puis réessayez.",
+    "permissions-insufficient": "Le compte PostgreSQL ne possède pas les accès nécessaires pour vérifier cette installation.",
+    "server-version-unsupported": "Version de PostgreSQL non qualifiée pour SMN I0 : vérifiez la version 18 avant l'installation.",
+    virgin: "Base SMN vierge détectée. Vous pouvez consulter la préparation de l'installation.",
+    initialized: "Installation SMN existante : une authentification sera nécessaire pour accéder aux données.",
+    "schema-incompatible": "Le schéma de la base n'est pas reconnu ; aucune modification ne sera appliquée automatiquement.",
+    "installation-incomplete": "L'installation paraît partielle. Aucun accès métier n'est autorisé.",
+  },
+  en: {
+    "configuration-missing": "The SMN database connection has not been configured.",
+    "configuration-invalid": "SMN must target a dedicated local PostgreSQL database.",
+    "database-missing": "The SMN database does not exist yet. The upcoming installer will request confirmation before creating it.",
+    "connection-error": "Could not connect to PostgreSQL. Check the local service and settings, then retry.",
+    "permissions-insufficient": "The PostgreSQL account lacks the permissions required to inspect this installation.",
+    "server-version-unsupported": "This PostgreSQL version has not been qualified for SMN I0. Check for version 18.",
+    virgin: "An empty SMN database was detected. You can review the installation preparation.",
+    initialized: "An existing SMN installation was found. Authentication will be required to access data.",
+    "schema-incompatible": "The database schema is not recognized. No automatic changes will be applied.",
+    "installation-incomplete": "The installation appears incomplete. Private data access remains blocked.",
+  },
+};

diff --git a/src/server/access-policy.ts b/src/server/access-policy.ts
new file mode 100644
index 0000000..4cc2b49
--- /dev/null
+++ b/src/server/access-policy.ts
@@ -0,0 +1,11 @@
+import type { Diagnostic } from "./installation/diagnostic";
+
+// Aucun dispositif de session n'est livré dans SMN-11 : refus par défaut.
+// L'autorisation réelle ne sera ouverte qu'après SMN-12/SMN-14.
+export function canVisitSetup(diagnostic: Diagnostic): boolean {
+  return diagnostic.status === "virgin" && diagnostic.canEnterSetup;
+}
+
+export function canVisitPrivate(): boolean {
+  return false;
+}

diff --git a/src/server/db/config.ts b/src/server/db/config.ts
new file mode 100644
index 0000000..6ae1830
--- /dev/null
+++ b/src/server/db/config.ts
@@ -0,0 +1,27 @@
+export type ConnectionSettings =
+  | { ok: true; uri: string }
+  | { ok: false; status: "configuration-missing" | "configuration-invalid" };
+
+// Les paramètres supplémentaires des URL peuvent être interprétés par pg
+// comme des options de connexion. Ne transmettre que l'URL validée sans option.
+export function parseConnectionSettings(raw: string | undefined): ConnectionSettings {
+  if (!raw?.trim()) return { ok: false, status: "configuration-missing" };
+  try {
+    const parsed = new URL(raw);
+    const database = decodeURIComponent(parsed.pathname.slice(1));
+    const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
+    if (
+      !["postgresql:", "postgres:"].includes(parsed.protocol) ||
+      !localHosts.has(parsed.hostname) ||
+      !/^smn(?:_[a-zA-Z0-9_]+)?$/.test(database) ||
+      !parsed.username ||
+      !!parsed.hash ||
+      !!parsed.search ||
+      !/^\d{0,5}$/.test(parsed.port)
+    ) return { ok: false, status: "configuration-invalid" };
+    // Ne jamais inclure l'URL réelle dans un journal ou une réponse HTTP.
+    return { ok: true, uri: parsed.toString() };
+  } catch {
+    return { ok: false, status: "configuration-invalid" };
+  }
+}

diff --git a/src/server/db/connection.ts b/src/server/db/connection.ts
new file mode 100644
index 0000000..176d66a
--- /dev/null
+++ b/src/server/db/connection.ts
@@ -0,0 +1,5 @@
+import "server-only";
+
+// Garder le verrou server-only aux points d'entrée Next ; le probe technique
+// est indépendant et exécuté directement par les tests intégrés PostgreSQL.
+export { probePostgres } from "./probe";

diff --git a/src/server/db/probe.ts b/src/server/db/probe.ts
new file mode 100644
index 0000000..8ba82b0
--- /dev/null
+++ b/src/server/db/probe.ts
@@ -0,0 +1,84 @@
+// Adaptateur PostgreSQL directement testable (sans side effect server-only de Next).
+import { Client } from "pg";
+import type { Snapshot } from "../installation/diagnostic";
+
+// Chaque diagnostic lit un instantané cohérent, sans aucune écriture.
+export async function probePostgres(uri: string): Promise<Snapshot> {
+  const client = new Client({
+    connectionString: uri,
+    connectionTimeoutMillis: 2500,
+    query_timeout: 2500,
+    statement_timeout: 2500,
+    application_name: "smn-diagnostic",
+  });
+  let transaction = false;
+  try {
+    await client.connect();
+    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
+    transaction = true;
+    const version = await client.query<{ version: string }>(
+      "SELECT current_setting('server_version_num') AS version",
+    );
+    const rights = await client.query<{ can_use: boolean; can_create: boolean }>(
+      "SELECT has_schema_privilege(current_user, 'public', 'USAGE') AS can_use, has_schema_privilege(current_user, 'public', 'CREATE') AS can_create",
+    );
+    const schemaUsage = rights.rows[0]?.can_use === true;
+    const schemaCreate = rights.rows[0]?.can_create === true;
+    const serverVersion = Number(version.rows[0]?.version);
+    if (!schemaUsage) {
+      return { schemaUsage: false, schemaCreate, serverVersion, tables: [] };
+    }
+    // Inclure aussi les vues, séquences, tables étrangères, schémas privés,
+    // fonctions et types utilisateur ; pas seulement les tables de public.
+    const objects = await client.query<{ name: string }>(`
+      SELECT n.nspname || '.' || c.relname || ':' || c.relkind::text AS name
+      FROM pg_catalog.pg_class c
+      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
+      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
+        AND n.nspname NOT LIKE 'pg_toast%'
+        AND n.nspname NOT LIKE 'pg_temp%'
+        AND c.relkind IN ('r','p','v','m','S','f')
+      UNION ALL
+      SELECT n.nspname || '.<schema>' AS name
+      FROM pg_catalog.pg_namespace n
+      WHERE n.nspname NOT IN ('public', 'pg_catalog', 'information_schema')
+        AND n.nspname NOT LIKE 'pg_%'
+      UNION ALL
+      SELECT n.nspname || '.' || p.proname || ':function' AS name
+      FROM pg_catalog.pg_proc p
+      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
+      WHERE n.nspname = 'public'
+      UNION ALL
+      SELECT n.nspname || '.' || t.typname || ':type' AS name
+      FROM pg_catalog.pg_type t
+      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
+      WHERE n.nspname = 'public' AND t.typtype IN ('d','e','r','m')
+    `);
+    const tables = objects.rows.map((row) => row.name);
+    const marker = "public.smn_installation:r";
+    const history = "public._prisma_migrations:r";
+    if (!tables.includes(marker) || tables.some((name) => name !== marker && name !== history)) {
+      return { schemaUsage, schemaCreate, serverVersion, tables };
+    }
+    const perms = await client.query<{ installation: boolean; migrations: boolean }>(
+      "SELECT has_table_privilege(current_user, 'public.smn_installation', 'SELECT') AS installation, CASE WHEN to_regclass('public._prisma_migrations') IS NOT NULL THEN has_table_privilege(current_user, 'public._prisma_migrations', 'SELECT') ELSE false END AS migrations",
+    );
+    const tableRead = perms.rows[0]?.installation === true;
+    const migrationsRead = perms.rows[0]?.migrations === true;
+    if (!tableRead || (tables.includes(history) && !migrationsRead)) {
+      return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead };
+    }
+    const installations = await client.query<{
+      id: string; state: string; schema_version: number;
+    }>("SELECT id, state, schema_version FROM public.smn_installation LIMIT 2");
+    const migrations = tables.includes(history)
+      ? (await client.query<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>(
+          "SELECT migration_name, finished_at, rolled_back_at FROM public._prisma_migrations",
+        )).rows
+      : [];
+    return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead, installations: installations.rows, migrations };
+  } finally {
+    if (transaction) await client.query("ROLLBACK").catch(() => undefined);
+    await client.end().catch(() => undefined);
+  }
+}

diff --git a/src/server/installation/current.ts b/src/server/installation/current.ts
new file mode 100644
index 0000000..8de8154
--- /dev/null
+++ b/src/server/installation/current.ts
@@ -0,0 +1,13 @@
+import "server-only";
+import type { Diagnostic } from "@/server/installation/diagnostic";
+import { diagnoseInstallation } from "@/server/installation/diagnostic";
+import { parseConnectionSettings } from "@/server/db/config";
+import { probePostgres } from "@/server/db/connection";
+
+export async function currentInstallationDiagnostic(): Promise<Diagnostic> {
+  const settings = parseConnectionSettings(process.env.SMN_DATABASE_URL);
+  if (!settings.ok) {
+    return { status: settings.status, canEnterSetup: false };
+  }
+  return diagnoseInstallation(() => probePostgres(settings.uri));
+}

diff --git a/src/server/installation/diagnostic.ts b/src/server/installation/diagnostic.ts
new file mode 100644
index 0000000..e318ea2
--- /dev/null
+++ b/src/server/installation/diagnostic.ts
@@ -0,0 +1,98 @@
+// Domaine pur : classification prudente, indépendant de Next, Prisma et du pilote SQL.
+export type DiagnosticStatus =
+  | "configuration-missing"
+  | "configuration-invalid"
+  | "database-missing"
+  | "connection-error"
+  | "permissions-insufficient"
+  | "server-version-unsupported"
+  | "virgin"
+  | "initialized"
+  | "schema-incompatible"
+  | "installation-incomplete";
+
+export type Diagnostic = Readonly<{ status: DiagnosticStatus; canEnterSetup: boolean }>;
+export type Migration = Readonly<{
+  migration_name: string;
+  finished_at: Date | null;
+  rolled_back_at: Date | null;
+}>;
+export type Snapshot = Readonly<{
+  schemaUsage: boolean;
+  schemaCreate?: boolean;
+  // Numéro de version PostgreSQL (server_version_num) : vérifié par le probe réel.
+  serverVersion?: number;
+  // Objets qualifiés par schéma et type : public.smn_installation:r
+  tables: readonly string[];
+  tableRead?: boolean;
+  migrationsRead?: boolean;
+  migrations?: readonly Migration[];
+  installations?: readonly { id: string; state: string; schema_version: number }[];
+}>;
+export type DiagnosticProbe = () => Promise<Snapshot>;
+
+function result(status: DiagnosticStatus): Diagnostic {
+  return { status, canEnterSetup: status === "virgin" };
+}
+
+// La compatibilité de la version 1 décrit uniquement le marqueur I0.
+// SMN-12 doit enregistrer explicitement ses objets et migrations ; aucun schéma
+// ultérieur ne peut devenir compatible par simple incrément de schema_version.
+const SUPPORTED_SCHEMAS: Readonly<Record<number, ReadonlySet<string>>> = {
+  1: new Set(["public.smn_installation:r", "public._prisma_migrations:r"]),
+};
+
+export function classifyDatabaseError(error: unknown): DiagnosticStatus {
+  const code =
+    typeof error === "object" && error !== null && "code" in error
+      ? (error as { code?: unknown }).code
+      : undefined;
+  if (code === "3D000") return "database-missing";
+  if (code === "42501") return "permissions-insufficient";
+  if (["42P01", "42703", "42883", "3F000", "42P07", "42809"].includes(String(code))) {
+    return "schema-incompatible";
+  }
+  return "connection-error";
+}
+
+export function classifySnapshot(snapshot: Snapshot): Diagnostic {
+  if (!snapshot.schemaUsage) return result("permissions-insufficient");
+  // Qualification I0 réalisée sur PostgreSQL 18 : aucun faux « prêt »
+  // pour une version serveur encore non qualifiée.
+  if (snapshot.serverVersion !== undefined && Math.floor(snapshot.serverVersion / 10000) !== 18) {
+    return result("server-version-unsupported");
+  }
+  const names = new Set(snapshot.tables);
+  const marker = "public.smn_installation:r";
+  const history = "public._prisma_migrations:r";
+  if (!names.has(marker)) {
+    if (names.size === 0) {
+      return result(snapshot.schemaCreate === false ? "permissions-insufficient" : "virgin");
+    }
+    return result(names.size === 1 && names.has(history) ? "installation-incomplete" : "schema-incompatible");
+  }
+  if ([...names].some((name) => name !== marker && name !== history)) return result("schema-incompatible");
+  if (!snapshot.tableRead) return result("permissions-insufficient");
+  const records = snapshot.installations;
+  if (!records || records.length !== 1 || records[0].id !== "singleton") {
+    return result("installation-incomplete");
+  }
+  const policy = SUPPORTED_SCHEMAS[records[0].schema_version];
+  if (!policy || [...names].some((name) => !policy.has(name))) return result("schema-incompatible");
+  if (records[0].state !== "initialized") return result("installation-incomplete");
+  if (!names.has(history) || !snapshot.migrationsRead || !snapshot.migrations?.length) {
+    return result("installation-incomplete");
+  }
+  if (snapshot.migrations.some((m) => !m.finished_at || !!m.rolled_back_at)) {
+    return result("installation-incomplete");
+  }
+  return result("initialized");
+}
+
+export async function diagnoseInstallation(probe: DiagnosticProbe): Promise<Diagnostic> {
+  try {
+    return classifySnapshot(await probe());
+  } catch (error) {
+    return result(classifyDatabaseError(error));
+  }
+}

diff --git a/tests/access-guards.test.ts b/tests/access-guards.test.ts
new file mode 100644
index 0000000..5c88417
--- /dev/null
+++ b/tests/access-guards.test.ts
@@ -0,0 +1,22 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import { canVisitSetup, canVisitPrivate } from "../src/server/access-policy";
+import type { DiagnosticStatus } from "../src/server/installation/diagnostic";
+
+describe("SMN-11 — refus côté serveur sans authentification", () => {
+  const states: DiagnosticStatus[] = [
+    "configuration-missing", "configuration-invalid", "database-missing",
+    "connection-error", "permissions-insufficient", "server-version-unsupported",
+    "virgin", "initialized", "schema-incompatible", "installation-incomplete",
+  ];
+  for (const status of states) {
+    it("route setup pour l'état " + status, () => {
+      const isVirgin = status === "virgin";
+      assert.equal(canVisitSetup({ status, canEnterSetup: isVirgin }), isVirgin);
+      assert.equal(canVisitPrivate(), false);
+    });
+  }
+  it("refuse setup si le diagnostic n'autorise pas le parcours", () => {
+    assert.equal(canVisitSetup({ status: "virgin", canEnterSetup: false }), false);
+  });
+});

diff --git a/tests/installation-diagnostic.test.ts b/tests/installation-diagnostic.test.ts
new file mode 100644
index 0000000..9affdce
--- /dev/null
+++ b/tests/installation-diagnostic.test.ts
@@ -0,0 +1,71 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import { classifySnapshot, diagnoseInstallation, type Snapshot } from "../src/server/installation/diagnostic";
+import { parseConnectionSettings } from "../src/server/db/config";
+
+const names = ["public.smn_installation:r", "public._prisma_migrations:r"];
+const virgin: Snapshot = { schemaUsage: true, schemaCreate: true, serverVersion: 180006, tables: [] };
+const valid: Snapshot = {
+  ...virgin, tables: names, tableRead: true, migrationsRead: true,
+  installations: [{ id: "singleton", state: "initialized", schema_version: 1 }],
+  migrations: [{ migration_name: "fixture_migration", finished_at: new Date(), rolled_back_at: null }],
+};
+
+describe("SMN-11 — diagnostic sans mutation", () => {
+  it("reconnaît une base vierge sous PostgreSQL 18", async () => {
+    assert.deepEqual(await diagnoseInstallation(async () => virgin), { status: "virgin", canEnterSetup: true });
+  });
+  it("reconnaît une installation versionnée avec migrations réussies", () => {
+    assert.equal(classifySnapshot(valid).status, "initialized");
+    assert.equal(classifySnapshot(valid).canEnterSetup, false);
+  });
+  it("refuse les objets étrangers, y compris vues, séquences et autres schémas", () => {
+    for (const name of ["public.articles:r", "public.vue:v", "public.sequence:S", "other.orders:r", "other.<schema>"]) {
+      assert.equal(classifySnapshot({ ...virgin, tables: [name] }).status, "schema-incompatible");
+    }
+    assert.equal(classifySnapshot({ ...virgin, tables: ["public._prisma_migrations:r"] }).status, "installation-incomplete");
+    assert.equal(classifySnapshot({ ...valid, tables: [...names, "public.unexpected_view:v"], tableRead: false }).status, "schema-incompatible");
+  });
+  it("refuse les installations partielles et versions futures inconnues", () => {
+    assert.equal(classifySnapshot({ ...valid, migrations: [] }).status, "installation-incomplete");
+    assert.equal(classifySnapshot({ ...valid, migrations: [{ migration_name: "x", finished_at: null, rolled_back_at: null }] }).status, "installation-incomplete");
+    assert.equal(classifySnapshot({ ...valid, tables: ["public.smn_installation:r"] }).status, "installation-incomplete");
+    assert.equal(classifySnapshot({ ...valid, installations: [] }).status, "installation-incomplete");
+    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "pending", schema_version: 1 }] }).status, "installation-incomplete");
+    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 2 }] }).status, "schema-incompatible");
+    assert.equal(classifySnapshot({ ...valid, tables: [...names, "public.users:r"] }).status, "schema-incompatible");
+  });
+  it("distingue permissions de lecture et capacité future de création", () => {
+    assert.equal(classifySnapshot({ ...virgin, schemaUsage: false }).status, "permissions-insufficient");
+    assert.equal(classifySnapshot({ ...virgin, schemaCreate: false }).status, "permissions-insufficient");
+    assert.equal(classifySnapshot({ ...valid, tableRead: false }).status, "permissions-insufficient");
+    assert.equal(classifySnapshot({ ...valid, schemaCreate: false }).status, "initialized");
+  });
+  it("rejette un PostgreSQL hors version qualifiée", () => {
+    assert.equal(classifySnapshot({ ...virgin, serverVersion: 170006 }).status, "server-version-unsupported");
+  });
+  it("classe les échecs SQL sans révéler leurs détails", async () => {
+    for (const [code, expected] of [
+      ["3D000", "database-missing"], ["42501", "permissions-insufficient"],
+      ["42703", "schema-incompatible"], ["42P01", "schema-incompatible"],
+      ["28P01", "connection-error"], ["ECONNREFUSED", "connection-error"], ["ETIMEDOUT", "connection-error"],
+    ]) {
+      const failure = Object.assign(new Error("password=secret-should-not-leak"), { code });
+      const diagnosed = await diagnoseInstallation(async () => { throw failure; });
+      assert.equal(diagnosed.status, expected);
+      assert.equal(JSON.stringify(diagnosed).includes("secret"), false);
+      assert.equal(diagnosed.canEnterSetup, false);
+    }
+  });
+  it("rejette les URL non locales, d'autres bases ou avec options", () => {
+    for (const invalid of [
+      "bad-uri", "postgresql://local:pass@localhost:5432/lmn24",
+      "postgresql://local:pass@remote.example:5432/smn",
+      "postgresql://local:pass@localhost:5432/smn?host=remote.example",
+      "postgresql://local:pass@localhost:5432/smn?sslmode=disable",
+    ]) assert.deepEqual(parseConnectionSettings(invalid), { ok: false, status: "configuration-invalid" });
+    assert.deepEqual(parseConnectionSettings(undefined), { ok: false, status: "configuration-missing" });
+    assert.equal(parseConnectionSettings("postgresql://local:pass@localhost:5432/smn").ok, true);
+    assert.equal(parseConnectionSettings("postgresql://local:pass@[::1]:5432/smn_test").ok, true);
+  });
+});

diff --git a/tests/language.test.ts b/tests/language.test.ts
new file mode 100644
index 0000000..9d54abb
--- /dev/null
+++ b/tests/language.test.ts
@@ -0,0 +1,17 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import { negotiateLanguage } from "../src/lib/language";
+
+describe("SMN-11 — langue et préférences du navigateur", () => {
+  it("choisit français par défaut", () => {
+    assert.equal(negotiateLanguage(null), "fr");
+    assert.equal(negotiateLanguage("de-DE"), "fr");
+  });
+  it("respecte anglais, français et les coefficients", () => {
+    assert.equal(negotiateLanguage("en-US,en;q=0.9,fr;q=0.8"), "en");
+    assert.equal(negotiateLanguage("de-DE,de;q=0.8,en;q=0.7"), "en");
+    assert.equal(negotiateLanguage("en;q=0,fr;q=0.8"), "fr");
+    assert.equal(negotiateLanguage("en;q=0"), "fr");
+    assert.equal(negotiateLanguage("en;q=0.3,fr-FR;q=0.9"), "fr");
+  });
+});

diff --git a/tests/port-config.test.mjs b/tests/port-config.test.mjs
new file mode 100644
index 0000000..d2d85e9
--- /dev/null
+++ b/tests/port-config.test.mjs
@@ -0,0 +1,26 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import { DEFAULT_SMN_PORT, RESERVED_PORTS, resolveSmnPort } from "../scripts/port-config.mjs";
+
+describe("SMN-11 — coexistence des serveurs locaux", () => {
+  it("utilise 3003 par défaut, hors des ports réservés", () => {
+    assert.equal(resolveSmnPort(undefined), 3003);
+    assert.equal(DEFAULT_SMN_PORT, 3003);
+    assert.equal(RESERVED_PORTS.includes(resolveSmnPort(undefined)), false);
+  });
+  it("accepte un port personnalisé non réservé sans changer la valeur par défaut", () => {
+    assert.equal(resolveSmnPort("3010"), 3010);
+    assert.equal(resolveSmnPort("3003"), 3003);
+    assert.equal(resolveSmnPort(""), DEFAULT_SMN_PORT);
+  });
+  it("rejette les ports 3000 à 3002 déjà attribués à l'autre projet", () => {
+    for (const port of RESERVED_PORTS) {
+      assert.throws(() => resolveSmnPort(String(port)), /réservés/);
+    }
+  });
+  it("rejette les numéros invalides, partiels ou non autorisés", () => {
+    for (const value of ["0", "80", "65536", "3003x", "-3003", "3003.5", " 3003", "Infinity"]) {
+      assert.throws(() => resolveSmnPort(value));
+    }
+  });
+});

diff --git a/tests/postgres-integration.test.ts b/tests/postgres-integration.test.ts
new file mode 100644
index 0000000..ed48112
--- /dev/null
+++ b/tests/postgres-integration.test.ts
@@ -0,0 +1,114 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import { Client } from "pg";
+import { diagnoseInstallation } from "../src/server/installation/diagnostic";
+import { parseConnectionSettings } from "../src/server/db/config";
+import { probePostgres } from "../src/server/db/probe";
+
+// Tests avec écritures de FIXTURES : interdits sur les bases personnelles.
+// Seul le service smn_ci éphémère du runner CI est autorisé.
+const ci = process.env.CI === "true";
+const uri = ci ? process.env.SMN_TEST_DATABASE_URL : undefined;
+if (ci && (!uri || !parseConnectionSettings(uri).ok || new URL(uri).pathname !== "/smn_ci")) {
+  throw new Error("CI : base temporaire smn_ci obligatoire, sans base utilisateur.");
+}
+
+async function withConnection<T>(fn: (client: Client) => Promise<T>): Promise<T> {
+  assert.ok(uri);
+  const client = new Client({ connectionString: uri });
+  try {
+    await client.connect();
+    return await fn(client);
+  } finally {
+    await client.end().catch(() => undefined);
+  }
+}
+
+describe("SMN-11 — probe PostgreSQL réel (CI et base éphémère exclusivement)", { skip: !ci }, () => {
+  it("appelle le véritable probe sur une base vide", async () => {
+    assert.ok(uri);
+    const snapshot = await probePostgres(uri);
+    assert.equal(snapshot.schemaUsage, true);
+    assert.equal(snapshot.schemaCreate, true);
+    assert.equal(Math.floor((snapshot.serverVersion ?? 0) / 10000), 18);
+    assert.deepEqual(snapshot.tables, []);
+    assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "virgin");
+  });
+
+  it("rejette une vue et un schéma étranger au lieu de classifier virgin", async () => {
+    assert.ok(uri);
+    await withConnection(async (client) => {
+      await client.query("CREATE VIEW public.other_view AS SELECT 1 AS value");
+      await client.query("CREATE SCHEMA untrusted_data");
+    });
+    try {
+      const snapshot = await probePostgres(uri);
+      assert.ok(snapshot.tables.includes("public.other_view:v"));
+      assert.ok(snapshot.tables.includes("untrusted_data.<schema>"));
+      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "schema-incompatible");
+    } finally {
+      await withConnection(async (client) => {
+        await client.query("DROP VIEW IF EXISTS public.other_view");
+        await client.query("DROP SCHEMA IF EXISTS untrusted_data");
+      });
+    }
+  });
+
+  it("différencie installation complète, migration échouée et schéma incorrect", async () => {
+    assert.ok(uri);
+    await withConnection(async (client) => {
+      await client.query("CREATE TABLE public.smn_installation (id text PRIMARY KEY, state text, schema_version int)");
+      await client.query("CREATE TABLE public._prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz)");
+      await client.query("INSERT INTO public.smn_installation VALUES ('singleton', 'initialized', 1)");
+      await client.query("INSERT INTO public._prisma_migrations VALUES ('fixture_migration', now(), null)");
+    });
+    try {
+      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "initialized");
+      await withConnection(async (client) => {
+        await client.query("UPDATE public._prisma_migrations SET finished_at = null");
+      });
+      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "installation-incomplete");
+      await withConnection(async (client) => {
+        await client.query("ALTER TABLE public.smn_installation DROP COLUMN schema_version");
+      });
+      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "schema-incompatible");
+    } finally {
+      await withConnection(async (client) => {
+        await client.query("DROP TABLE IF EXISTS public._prisma_migrations");
+        await client.query("DROP TABLE IF EXISTS public.smn_installation");
+      });
+    }
+  });
+
+  it("identifie l'absence de droits CREATE du compte local restreint", async () => {
+    assert.ok(uri);
+    const settings = new URL(uri);
+    const username = "smn_ci_restricted";
+    await withConnection(async (client) => {
+      await client.query(`CREATE ROLE ${username} LOGIN PASSWORD 'temporary-ci-test-password'`);
+      await client.query(`GRANT CONNECT ON DATABASE smn_ci TO ${username}`);
+      await client.query(`GRANT USAGE ON SCHEMA public TO ${username}`);
+    });
+    try {
+      settings.username = username;
+      settings.password = "temporary-ci-test-password";
+      const snapshot = await probePostgres(settings.toString());
+      assert.equal(snapshot.schemaUsage, true);
+      assert.equal(snapshot.schemaCreate, false);
+      assert.equal((await diagnoseInstallation(() => probePostgres(settings.toString()))).status, "permissions-insufficient");
+    } finally {
+      await withConnection(async (client) => {
+        await client.query(`REVOKE USAGE ON SCHEMA public FROM ${username}`);
+        await client.query(`REVOKE CONNECT ON DATABASE smn_ci FROM ${username}`);
+        await client.query(`DROP ROLE IF EXISTS ${username}`);
+      });
+    }
+  });
+
+  it("classe la base absente sans créer de base", async () => {
+    assert.ok(uri);
+    const url = new URL(uri);
+    url.pathname = "/smn_database_missing";
+    assert.equal((await diagnoseInstallation(() => probePostgres(url.toString()))).status, "database-missing");
+  });
+});

diff --git a/tsconfig.json b/tsconfig.json
new file mode 100644
index 0000000..d3b92a0
--- /dev/null
+++ b/tsconfig.json
@@ -0,0 +1,21 @@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "lib": ["dom", "dom.iterable", "esnext"],
+    "allowJs": true,
+    "skipLibCheck": true,
+    "strict": true,
+    "noEmit": true,
+    "esModuleInterop": true,
+    "module": "esnext",
+    "moduleResolution": "bundler",
+    "resolveJsonModule": true,
+    "isolatedModules": true,
+    "jsx": "react-jsx",
+    "incremental": true,
+    "plugins": [{ "name": "next" }],
+    "paths": { "@/*": ["./src/*"] }
+  },
+  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
+  "exclude": ["node_modules"]
+}

===== END DIFF =====
