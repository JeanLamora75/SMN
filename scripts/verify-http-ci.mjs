#!/usr/bin/env node
// Validation destructive autorisée UNIQUEMENT sur PostgreSQL 18 éphémère GitHub Actions.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { Client } from "pg";
import { randomBytes, randomUUID, scryptSync, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const uri = process.env.SMN_TEST_DATABASE_URL;
if (process.env.CI !== "true" || process.env.GITHUB_ACTIONS !== "true" || !uri || !/^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(uri)) {
  throw new Error("Exécution interdite hors de GitHub Actions sur la base éphémère smn_ci.");
}
const base = "http://127.0.0.1:3003";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function portBusy(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => { socket.destroy(); resolve(false); });
    socket.setTimeout(1000, () => { socket.destroy(); resolve(true); });
  });
}
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
  if (child.exitCode === null) child.kill("SIGTERM");
  for (let i = 0; i < 30 && child.exitCode === null; i++) await pause(200);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    for (let i = 0; i < 20 && child.exitCode === null; i++) await pause(100);
  }
  assert.notEqual(child.exitCode, null, "Un processus de test est resté actif après arrêt.");
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
  assert.equal(await portBusy(3003), false, "Port 3003 déjà occupé avant lancement du serveur de test");
  app = launch("start", 3003, { SMN_DATABASE_URL: uri });
  await waitHttp(3003, app);
  let r = await get("/api/diagnostic");
  let data = await r.json();
  assert.equal(data.status, "virgin");
  assert.equal(data.canEnterSetup, true);
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await get("/setup")).status, 200);
  const privateResponse = await get("/app", { redirect: "manual" });
  assert.equal(privateResponse.status, 307);
  assert.equal(new URL(privateResponse.headers.get("location"), base).pathname, "/login");
  const french = await (await get("/", { headers: { "Accept-Language": "fr-FR" } })).text();
  assert.match(french, /<html lang="fr"/);
  assert.match(french, /Base SMN vierge/);
  assert.match(french, /href="\/welcome"/);
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

  try {
    await withDb(async (c) => {
      await c.query("CREATE TABLE public.smn_installation (id text PRIMARY KEY, state text, schema_version int)");
    await c.query("CREATE TABLE public._prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz)");
    await c.query("INSERT INTO public.smn_installation VALUES ('singleton','initialized',1)");
    await c.query("INSERT INTO public._prisma_migrations VALUES ('fixture',now(),null)");
    });
    data = await (await get("/api/diagnostic")).json();
    assert.equal(data.status, "installation-incomplete");
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
    assert.notEqual(forbidden.exitCode, null, "Le serveur reste actif sur le port interdit " + port);
    assert.notEqual(forbidden.exitCode, 0, "Port réservé accepté : " + port);
    assert.equal(await portBusy(port), false, "SMN ne doit pas écouter sur le port réservé " + port);
    await stop(forbidden);
  }
  // SMN-14 — vérifier un vrai login HTTP sur une fixture construite
  // EXCLUSIVEMENT dans smn_ci, la base jetable du runner GitHub Actions.
  const schemaSql = await readFile("prisma/migrations/20261020_smn12_initial/migration.sql", "utf8");
  const salt = randomBytes(16);
  const digest = scryptSync("admin", salt, 64);
  const hash = "scrypt:1:" + salt.toString("hex") + ":" + digest.toString("hex");
  await withDb(async client => {
    await client.query("BEGIN");
    try {
      await client.query(`CREATE TABLE public._prisma_migrations (
        id varchar(36) PRIMARY KEY, checksum varchar(64) NOT NULL,
        finished_at timestamptz, migration_name varchar(255) NOT NULL,
        logs text, rolled_back_at timestamptz, started_at timestamptz NOT NULL DEFAULT now(),
        applied_steps_count integer NOT NULL DEFAULT 0)`);
      await client.query(schemaSql);
      await client.query("INSERT INTO public.smn_installation(id,state,schema_version,mode) VALUES('singleton','initialized',1,'scrum')");
      await client.query("INSERT INTO public.smn_product(id,installation_id,name) VALUES('product','singleton','Produit de recette CI')");
      await client.query("INSERT INTO public.smn_team(id,installation_id,product_id,name) VALUES('team','singleton','product','Equipe CI')");
      await client.query("INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password) VALUES($2,'singleton','admin','admin@localhot.com','admin',$1,true)", [hash,randomUUID()]);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES('ci-version',$1,now(),'20261020_smn12_initial',1)`,
        [createHash("sha256").update(schemaSql).digest("hex")]);
      await client.query("COMMIT");
    } catch(error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
  try {
    const postAuth = (route, input, cookie, origin = base) => get(route, {
      method: "POST", redirect: "manual",
      headers: { "Content-Type": "application/json", Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(input),
    });
    assert.equal((await (await get("/api/diagnostic")).json()).status, "initialized");
    assert.equal((await get("/login")).status, 200);
    assert.equal((await get("/api/auth/me")).status, 401);
    assert.equal((await postAuth("/api/auth/login", {identity:"admin",password:"admin"}, "", "http://evil.example")).status, 403);
    const wrong = await postAuth("/api/auth/login", {identity:"admin",password:"wrong"});
    const missing = await postAuth("/api/auth/login", {identity:"missing",password:"wrong"});
    assert.equal(wrong.status, 401);
    assert.equal(missing.status, 401);
    assert.deepEqual(await wrong.json(), await missing.json(), "Échecs uniformes sans énumération");
    const login = await postAuth("/api/auth/login", {identity:"admin",password:"admin"});
    assert.equal(login.status, 200);
    assert.equal((await login.json()).mustChangePassword, true);
    function tokenCookie(response) {
      const raw = response.headers.get("set-cookie") ?? "";
      assert.match(raw, /HttpOnly/i);
      assert.match(raw, /SameSite=Strict/i);
      const match = /smn_session=([a-f0-9]{64})/.exec(raw);
      assert.ok(match);
      return "smn_session=" + match[1];
    }
    const original = tokenCookie(login);
    const beforeChange = await get("/app", { headers: { Cookie: original }, redirect:"manual" });
    assert.equal(beforeChange.status, 307);
    assert.equal(new URL(beforeChange.headers.get("location"), base).pathname, "/change-password");
    assert.equal((await postAuth("/api/auth/change-password",
      { currentPassword:"wrong",newPassword:"nouveau2026" }, original)).status, 400);
    const changed = await postAuth("/api/auth/change-password",
      { currentPassword:"admin",newPassword:"nouveau2026" }, original);
    assert.equal(changed.status, 200);
    const replacement = tokenCookie(changed);
    assert.notEqual(replacement, original);
    assert.equal((await get("/api/auth/me", { headers:{Cookie:original} })).status, 401);
    const privatePage = await get("/app", { headers:{Cookie:replacement},redirect:"manual" });
    assert.equal(privatePage.status, 200);
    const privateHtml = await privatePage.text();
    assert.match(privateHtml, /Vue d.ensemble/);
    assert.match(privateHtml, /Produit de recette CI/);
    assert.match(privateHtml, /Equipe CI/);
    assert.match(privateHtml, /Aucun sprint enregistr/);
    assert.doesNotMatch(privateHtml, /admin@localhot.com/);
    assert.doesNotMatch(privateHtml, /Story Points.*>0</);
    // Gestion des comptes : seuls les administrateurs authentifiés peuvent agir.
    assert.equal((await get("/api/admin/accounts")).status,403);
    assert.equal((await postAuth("/api/admin/accounts",{
      username:"intrus",email:"intrus@example.test",role:"admin",password:"pilot1234",
    })).status,403);
    const adminPage=await get("/app/admin/users",{headers:{Cookie:replacement},redirect:"manual"});
    assert.equal(adminPage.status,200);
    assert.match(await adminPage.text(),/Administration des utilisateurs/);
    const newUser={username:"pilote",email:"pilote@example.test",role:"user",password:"pilot1234"};
    assert.equal((await postAuth("/api/admin/accounts",newUser,replacement,"http://evil.example")).status,403);
    const created=await postAuth("/api/admin/accounts",newUser,replacement);
    assert.equal(created.status,201);
    const createdBody=await created.json();
    const userId=createdBody.account.id;
    assert.equal(createdBody.account.role,"user");
    assert.equal(JSON.stringify(createdBody).includes("password_hash"),false);
    assert.equal(JSON.stringify(createdBody).includes("pilot1234"),false);
    const dupe=await postAuth("/api/admin/accounts",
      {...newUser,username:"PILOTE",email:"different@example.test"},replacement);
    assert.equal(dupe.status,409);
    const listed=await get("/api/admin/accounts",{headers:{Cookie:replacement}});
    assert.equal(listed.status,200);
    assert.equal((await listed.json()).accounts.length,2);
    const userLogin=await postAuth("/api/auth/login",{identity:"pilote",password:"pilot1234"});
    assert.equal(userLogin.status,200);
    const userCookie=tokenCookie(userLogin);
    assert.equal((await get("/api/admin/accounts",{headers:{Cookie:userCookie}})).status,403);
    assert.equal((await postAuth("/api/admin/accounts",{...newUser,username:"bad"},userCookie)).status,403);
    const userChanged=await postAuth("/api/auth/change-password",
      {currentPassword:"pilot1234",newPassword:"piloteChange2026"},userCookie);
    assert.equal(userChanged.status,200);
    const userReady=tokenCookie(userChanged);
    const rejectedPage=await get("/app/admin/users",{headers:{Cookie:userReady},redirect:"manual"});
    assert.equal(rejectedPage.status,307);
    assert.equal(new URL(rejectedPage.headers.get("location"),base).pathname,"/app");
    assert.equal((await get("/api/admin/accounts",{headers:{Cookie:userReady}})).status,403);
    const userDashboard=await get("/app",{headers:{Cookie:userReady},redirect:"manual"});
    assert.equal(userDashboard.status,200);
    const userHtml=await userDashboard.text();
    assert.match(userHtml,/Produit de recette CI/);
    assert.match(userHtml,/Equipe CI/);
    assert.match(userHtml,/Vue d.ensemble/);
    assert.doesNotMatch(userHtml,/Comptes utilisateurs/);
    assert.doesNotMatch(userHtml,/admin@localhot.com/);

    const forbiddenEdit=await postAuth("/api/admin/accounts",{...newUser,username:"not_allowed"},userReady);
    assert.equal(forbiddenEdit.status,403);
    const patchAccount=(id,fields,cookie= replacement,origin=base)=>
      get("/api/admin/accounts/"+id,{
        method:"PATCH",redirect:"manual",
        headers:{"Content-Type":"application/json",Origin:origin,Cookie:cookie},
        body:JSON.stringify(fields),
      });
    assert.equal((await patchAccount(userId,{role:"admin",isActive:true},userReady)).status,403);
    const promoted=await patchAccount(userId,{role:"admin",isActive:true});
    assert.equal(promoted.status,200);
    assert.equal((await get("/api/auth/me",{headers:{Cookie:userReady}})).status,401,
      "Ancienne session utilisateur révoquée après changement de rôle");
    const disabled=await patchAccount(userId,{role:"user",isActive:false});
    assert.equal(disabled.status,200);
    assert.equal((await postAuth("/api/auth/login",{identity:"pilote",password:"piloteChange2026"})).status,401);
    const selfId=(await (await get("/api/admin/accounts",{headers:{Cookie:replacement}})).json()).accounts
      .find(a=>a.username==="admin").id;
    assert.equal((await patchAccount(selfId,{role:"user",isActive:false})).status,409);
    console.log("SMN-15 : création, unicité, refus simple utilisateur, session révoquée et désactivation vérifiés.");
    assert.equal((await postAuth("/api/auth/activity", {}, replacement, "http://invalid.example")).status, 403);
    assert.equal((await postAuth("/api/auth/activity", {}, replacement)).status, 200);
    assert.equal((await postAuth("/api/auth/logout", {}, replacement)).status, 200);
    assert.equal((await get("/api/auth/me", { headers:{Cookie:replacement} })).status, 401);
    assert.equal((await postAuth("/api/auth/login", {identity:"admin",password:"admin"})).status, 401);
    assert.equal((await postAuth("/api/auth/login", {identity:"admin@localhot.com",password:"nouveau2026"})).status, 200);
    console.log("SMN-14 : auth, rotation, déconnexion, refus CSRF et ACL HTTP PostgreSQL vérifiés.");
  } finally {
    await withDb(async client => {
      for (const table of ["smn_account","smn_team","smn_product","smn_installation","_prisma_migrations"]) {
        await client.query("DROP TABLE IF EXISTS public." + table + " CASCADE");
      }
    });
  }
  await stop(app);
  app = undefined;
  assert.equal(await portBusy(3010), false, "Port 3010 non libéré avant la reprise");
  alt = launch("start", 3010, { SMN_DATABASE_URL: uri });
  await waitHttp(3010, alt);
  assert.equal((await fetch("http://127.0.0.1:3010/")).status, 200);
  await stop(alt);
  alt = undefined;
  const invalid = launch("start", 3010, {
    SMN_DATABASE_URL: "postgresql://nobody:invalid@127.0.0.1:5432/lmn24",
  });
  alt = invalid;
  await waitHttp(3010, alt);
  const invalidDiagnostic = await (await fetch("http://127.0.0.1:3010/api/diagnostic")).json();
  assert.equal(invalidDiagnostic.status, "configuration-invalid");
  assert.equal((await fetch("http://127.0.0.1:3010/setup")).status, 404);
  console.log("SMN-11 : HTTP, diagnostics PG, langues, headers, routes et ports réussis.");
} finally {
  await stop(app);
  await stop(alt);
}
