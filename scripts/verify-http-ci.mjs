#!/usr/bin/env node
// Validation destructive autorisée UNIQUEMENT sur PostgreSQL 18 éphémère GitHub Actions.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { request as httpRequest } from "node:http";
import { Client } from "pg";
import { randomBytes, randomUUID, scryptSync, createHash } from "node:crypto";
import { readFile,mkdtemp,rm,readdir } from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {execFileSync} from "node:child_process";

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
function rawStatus(path, headers) {
  // Fetch remplace Host ; la sonde doit transmettre le vrai Host falsifié.
  return new Promise((resolve, reject) => {
    const request = httpRequest(new URL(path, base), { headers, timeout: 5000 }, response => {
      response.resume();
      response.once("end", () => resolve(response.statusCode));
      response.once("error", reject);
    });
    request.once("timeout", () => request.destroy(new Error("Délai de sonde HTTP dépassé")));
    request.once("error", reject);
    request.end();
  });
}
async function withDb(fn) {
  const client = new Client({ connectionString: uri });
  try {
    await client.connect();
    return await fn(client);
  } finally { await client.end().catch(() => undefined); }
}

const backupRoot=await mkdtemp(join(tmpdir(),"smn-backup-ci-"));
let app;
let alt;
try {
  assert.equal(await portBusy(3003), false, "Port 3003 déjà occupé avant lancement du serveur de test");
  app = launch("start", 3003, { SMN_DATABASE_URL: uri,SMN_BACKUP_DIR:backupRoot });
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
  assert.match(french, /href="#smn-main"/);
  assert.match(french, /id="smn-main"/);
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
    // SMN-26 : les documents privés ne répondent jamais à une URL anonyme.
    const noDoc=await get("/api/documents/unknown/download");
    assert.equal(noDoc.status,404);
    assert.match(noDoc.headers.get("cache-control")??"",/no-store/);
    assert.equal((await get("/api/dashboard")).status,403);
    assert.deepEqual(await (await get("/api/dashboard")).json(),{error:"forbidden"});
    assert.equal((await get("/api/dashboard",{headers:{Cookie:original}})).status,403);
    async function verifyDashboard(cookie) {
      const response=await get("/api/dashboard",{headers:{Cookie:cookie}});
      assert.equal(response.status,200);
      assert.match(response.headers.get("cache-control")??"",/no-store/);
      const projection=await response.json();
      assert.deepEqual(projection,{
        context:{productId:"product",product:"Produit de recette CI",teamId:"team",team:"Equipe CI",mode:"scrum"},
        currentCycle:null,pendingCycles:[],objectives:[],metrics:[],events:[],attention:[],
      },"Projection collective explicite, sans champ individuel ni coordonnées");
      assert.doesNotMatch(JSON.stringify(projection),/email|password|absence|capacity|username|is_active/i);
    }
    const beforeChange = await get("/app", { headers: { Cookie: original }, redirect:"manual" });
    assert.equal(beforeChange.status, 307);
    assert.equal(new URL(beforeChange.headers.get("location"), base).pathname, "/change-password");
    assert.equal((await postAuth("/api/auth/change-password",
      { currentPassword:"wrong",newPassword:"nouveau2026" }, original)).status, 400);
    const changed = await postAuth("/api/auth/change-password",
      { currentPassword:"admin",newPassword:"nouveau2026" }, original);
    assert.equal(changed.status, 200);
    const replacement = tokenCookie(changed);
    // SMN-18 — contrôle de la configuration sur le véritable serveur et PostgreSQL CI.
    const patchSettings=(settings,cookie=replacement,origin=base)=>get("/api/admin/settings",{
      method:"PATCH",redirect:"manual",
      headers:{"Content-Type":"application/json",Origin:origin,...(cookie?{Cookie:cookie}:{})},
      body:JSON.stringify(settings),
    });
    assert.equal((await get("/api/admin/audit")).status,403);
    assert.equal((await get("/api/admin/backups")).status,403);
    assert.equal((await get("/api/admin/settings")).status,403);
    assert.equal((await patchSettings({locale:"en",theme:"dark",referenceCountry:"DE",revision:0},"")).status,403);
    assert.equal((await get("/app/admin/settings",{headers:{Cookie:replacement},redirect:"manual"})).status,200);
    const firstAudit=await get("/api/admin/audit",{headers:{Cookie:replacement}});
    assert.equal(firstAudit.status,200);
    assert.match(firstAudit.headers.get("cache-control")??"",/no-store/);
    assert.ok(Array.isArray((await firstAudit.json()).entries));
    assert.equal((await get("/app/admin/audit",{headers:{Cookie:replacement},redirect:"manual"})).status,200);
    // Identities of team members are independent from login accounts and protected by RBAC.
    assert.equal((await get("/api/admin/members")).status,403);
    assert.equal((await postAuth("/api/admin/members",{teamId:"team",count:5,requestId:randomUUID()},"")).status,403);
    assert.equal((await get("/app/admin/members",{headers:{Cookie:replacement},redirect:"manual"})).status,200);
    const initialRoster=await get("/api/admin/members",{headers:{Cookie:replacement}});
    assert.equal(initialRoster.status,200);
    const initialRosterData=await initialRoster.json();
    assert.equal(initialRosterData.team.id,"team");
    assert.equal(initialRosterData.members.length,0);
    const quickCreate=(body,cookie=replacement)=>postAuth("/api/admin/members",body,cookie);
    const requestId=randomUUID();
    assert.equal((await quickCreate({teamId:"team",count:2,requestId})).status,400);
    assert.equal((await quickCreate({teamId:"wrong",count:5,requestId})).status,404);
    const firstRosterCreate=await quickCreate({teamId:"team",count:5,requestId});
    assert.equal(firstRosterCreate.status,201);
    const rosterCreated=await firstRosterCreate.json();
    assert.equal(rosterCreated.created,true);
    assert.equal(rosterCreated.members.length,5);
    assert.deepEqual(rosterCreated.members.map(m=>m.agileRole),
      ["scrum_master","product_owner","developer","developer","developer"]);
    assert.ok(rosterCreated.members.every(m=>m.isProvisional&&m.contractPercent===100&&
      m.allocationPercent===100&&m.rolePercent===100&&m.contributionPercent===100&&
      m.developmentCapacityJh===null));
    const repeated=await quickCreate({teamId:"team",count:5,requestId});
    assert.equal(repeated.status,200);
    assert.equal((await repeated.json()).created,false);
    assert.equal((await quickCreate({teamId:"team",count:5,requestId:randomUUID()})).status,409);
    const rosterAfter=await (await get("/api/admin/members",{headers:{Cookie:replacement}})).json();
    assert.equal(rosterAfter.members.length,5);
    assert.deepEqual(rosterAfter.members.map(m=>m.memberNumber),[1,2,3,4,5]);
    assert.equal((await withDb(async c=>(await c.query(
     "SELECT count(*)::int AS count FROM public.smn_member WHERE installation_id='singleton'"
    )).rows[0].count)),5);
    assert.equal((await withDb(async c=>(await c.query(
     "SELECT count(*)::int AS count FROM public.smn_member_assignment"
    )).rows[0].count)),5);
    // Profil central enrichi : mise à jour de la personne sans affectation ou compte supplémentaire.
    const originalMember=rosterAfter.members[1];
    const profileUrl="/api/admin/members/"+encodeURIComponent(originalMember.id);
    const patchProfile=(body,cookie=replacement)=>get(profileUrl,{
      method:"PATCH",redirect:"manual",
      headers:{"Content-Type":"application/json",Origin:base,...(cookie?{Cookie:cookie}:{})},
      body:JSON.stringify(body),
    });
    const assignmentsBefore=await withDb(async client=>(await client.query(
      "SELECT id,start_on::text AS start_on,agile_role FROM public.smn_member_assignment WHERE member_id=$1",
      [originalMember.id]
    )).rows);
    assert.equal((await patchProfile({
      displayName:"Camille Martin",email:"invalid-email",revision:0
    })).status,400);
    const profileUpdated=await patchProfile({
      displayName:"Camille Martin",email:"camille@example.org",revision:0
    });
    assert.equal(profileUpdated.status,200);
    const savedProfile=(await profileUpdated.json()).member;
    assert.equal(savedProfile.id,originalMember.id);
    assert.equal(savedProfile.isProvisional,false);
    assert.equal(savedProfile.email,"camille@example.org");
    assert.equal(savedProfile.revision,1);
    const staleProfile=await patchProfile({
      displayName:"Ancienne version",email:"other@example.org",revision:0
    });
    assert.equal(staleProfile.status,409);
    const removedEmail=await patchProfile({
      displayName:"Camille Martin",email:null,revision:1
    });
    assert.equal(removedEmail.status,200);
    assert.equal((await removedEmail.json()).member.email,null);
    const membersAfterProfile=await (await get("/api/admin/members",{headers:{Cookie:replacement}})).json();
    assert.equal(membersAfterProfile.members.length,5);
    assert.equal(membersAfterProfile.members[1].displayName,"Camille Martin");
    assert.equal(membersAfterProfile.members[1].isProvisional,false);
    assert.equal(membersAfterProfile.members[1].email,null);
    assert.equal(membersAfterProfile.members[1].developmentCapacityJh,null);
    const assignmentsAfter=await withDb(async client=>(await client.query(
      "SELECT id,start_on::text AS start_on,agile_role FROM public.smn_member_assignment WHERE member_id=$1",
      [originalMember.id]
    )).rows);
    assert.deepEqual(assignmentsAfter,assignmentsBefore);
    const accountsAfter=await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS count FROM public.smn_account WHERE installation_id='singleton'"
    )).rows[0].count);
    assert.equal(accountsAfter,1);
    // Dated assignment: append without altering initial effective records.
    const memberWithRoles=rosterAfter.members[0];
    const versionUrl="/api/admin/members/"+encodeURIComponent(memberWithRoles.id)+"/assignment";
    const getVersions=(cookie=replacement)=>get(versionUrl,{headers:{...(cookie?{Cookie:cookie}:{})}});
    const postVersion=(body,cookie=replacement)=>postAuth(versionUrl,body,cookie);
    assert.equal((await getVersions("")).status,403);
    const firstVersions=await getVersions();
    assert.equal(firstVersions.status,200);
    const assignmentBefore=await firstVersions.json();
    assert.equal(assignmentBefore.teamId,"team");
    assert.equal(assignmentBefore.versions.length,1);
    assert.equal(assignmentBefore.versions[0].shares.scrumMaster,100);
    const effectiveFrom=assignmentBefore.today;
    const updateRoles={memberId:memberWithRoles.id,teamId:"team",effectiveFrom,
      revision:1,contractPercent:100,allocationPercent:80,contributionPercent:75,
      shares:{scrumMaster:20,productOwner:0,developer:80}};
    assert.equal((await postVersion({...updateRoles,teamId:"second-team"})).status,404);
    assert.equal((await postVersion({...updateRoles,shares:{scrumMaster:20,productOwner:0,developer:70}})).status,400);
    assert.equal((await postVersion({...updateRoles,contractPercent:70})).status,400);
    const savedTerms=await postVersion(updateRoles);
    assert.equal(savedTerms.status,200);
    assert.equal((await savedTerms.json()).revision,2);
    assert.equal((await postVersion(updateRoles)).status,409);
    const historicalVersions=await (await getVersions()).json();
    assert.equal(historicalVersions.versions.length,2);
    assert.equal(historicalVersions.versions[0].shares.scrumMaster,100);
    assert.equal(historicalVersions.versions[1].shares.developer,80);
    assert.equal(historicalVersions.versions[1].contributionPercent,75);
    assert.equal(historicalVersions.current.shares.developer,80);
    assert.equal(historicalVersions.current.developerShare,0.8);
    const rosterWithRoles=await (await get("/api/admin/members",{headers:{Cookie:replacement}})).json();
    assert.equal(rosterWithRoles.members[0].allocationPercent,80);
    assert.equal(rosterWithRoles.members[0].roleShares.scrumMaster,20);
    assert.equal(rosterWithRoles.members[0].developmentCapacityJh,null);
    assert.equal((await withDb(async client=>(await client.query(
     "SELECT count(*)::int AS count FROM public.smn_member_assignment_version WHERE assignment_id=$1",
     [assignmentBefore.assignmentId]
    )).rows[0].count)),2);
    // Availability is absent until explicitly saved; suggested Mon-Fri is not actual absence/capacity data.
    const locationPath=id=>"/api/admin/members/"+encodeURIComponent(id)+"/location";
    const locationRead=(id,cookie=replacement,suffix="")=>get(locationPath(id)+suffix,{
      headers:cookie?{Cookie:cookie}:{}});
    const locationWrite=(id,payload,cookie=replacement)=>
      postAuth(locationPath(id),payload,cookie);
    assert.equal((await locationRead(memberWithRoles.id,"")).status,403);
    const locationInitial=await (await locationRead(memberWithRoles.id)).json();
    assert.equal(locationInitial.configured,false);
    assert.equal(locationInitial.effective,null);
    assert.equal(locationInitial.display,null);
    assert.equal(locationInitial.regionalHolidayAuto,false);
    assert.equal(locationInitial.holidayDataAvailable,false);
    const initialLocation={countryIso2:"FR",region:"Île-de-France",city:"Paris",
      timeZone:"Europe/Paris",effectiveFrom:locationInitial.today,revision:0};
    assert.equal((await locationWrite(memberWithRoles.id,{
      ...initialLocation,countryIso2:"XXX"
    })).status,400);
    assert.equal((await locationWrite(memberWithRoles.id,{
      ...initialLocation,timeZone:"Mars/Olympus_Mons"
    })).status,400);
    const savedLocation=await locationWrite(memberWithRoles.id,initialLocation);
    assert.equal(savedLocation.status,201);
    assert.equal((await savedLocation.json()).revision,1);
    assert.equal((await locationWrite(memberWithRoles.id,initialLocation)).status,409);
    const memberLocation=(await (await locationRead(memberWithRoles.id)).json());
    assert.equal(memberLocation.current.countryIso2,"FR");
    assert.equal(memberLocation.current.timeZone,"Europe/Paris");
    assert.equal(memberLocation.versions.length,1);
    const dstYear=Number(locationInitial.today.slice(0,4))+1;
    const marchEnd=new Date(Date.UTC(dstYear,2,31));
    marchEnd.setUTCDate(marchEnd.getUTCDate()-marchEnd.getUTCDay());
    const dstDay=marchEnd.toISOString().slice(0,10);
    const beforeDst=dstDay+"T00:30:00Z",afterDst=dstDay+"T01:30:00Z";
    const before=(await (await locationRead(memberWithRoles.id,replacement,
      "?at="+encodeURIComponent(beforeDst))).json()).display;
    const after=(await (await locationRead(memberWithRoles.id,replacement,
      "?at="+encodeURIComponent(afterDst))).json()).display;
    assert.equal(before.parts.hour,"01");
    assert.equal(after.parts.hour,"03");
    assert.equal(after.utc,afterDst.slice(0,-1)+".000Z");
    const switchDate=new Date(locationInitial.today+"T00:00:00Z");
    switchDate.setUTCDate(switchDate.getUTCDate()+7);
    const futureLocationDate=switchDate.toISOString().slice(0,10);
    assert.equal((await locationWrite(memberWithRoles.id,{
      ...initialLocation,revision:1,effectiveFrom:futureLocationDate,
      countryIso2:"CA",region:"Québec",city:"Montréal",timeZone:"America/Toronto"
    })).status,201);
    const oldLocation=(await (await locationRead(memberWithRoles.id,replacement,
      "?onDate="+locationInitial.today)).json());
    const newLocation=(await (await locationRead(memberWithRoles.id,replacement,
      "?onDate="+futureLocationDate)).json());
    assert.equal(oldLocation.effective.countryIso2,"FR");
    assert.equal(newLocation.effective.countryIso2,"CA");
    assert.equal(oldLocation.versions.length,2);
    assert.equal(oldLocation.current.countryIso2,"FR");
    assert.equal((await withDb(async c=>(await c.query(
     "SELECT count(*)::int AS count FROM public.smn_member_location WHERE member_id=$1",
     [memberWithRoles.id]
    )).rows[0].count)),2);
    const calendarPath=id=>"/api/admin/members/"+encodeURIComponent(id)+"/calendar";
    const calendarRead=(id,cookie=replacement,suffix="")=>get(calendarPath(id)+suffix,{
      headers:cookie?{Cookie:cookie}:{}});
    const calendarWrite=(id,payload,cookie=replacement)=>
      postAuth(calendarPath(id),payload,cookie);
    assert.equal((await calendarRead(memberWithRoles.id,"")).status,403);
    const calendarBefore=await (await calendarRead(memberWithRoles.id)).json();
    assert.equal(calendarBefore.configured,false);
    assert.equal(calendarBefore.current,null);
    assert.equal(calendarBefore.day.status,"missing");
    assert.equal(calendarBefore.day.absenceDays,null);
    assert.equal(calendarBefore.day.developmentCapacityJh,null);
    assert.deepEqual(calendarBefore.suggestedWeek.map(d=>Number(d.morning)+Number(d.afternoon)),
      [2,2,2,2,2,0,0]);
    const dates=calendarBefore.suggestedWeek.map(d=>({...d}));
    dates[2].afternoon=false;dates[4].morning=false;dates[4].afternoon=false;
    const savedWeek=await calendarWrite(memberWithRoles.id,{
      action:"weekly",revision:0,effectiveFrom:calendarBefore.today,days:dates
    });
    assert.equal(savedWeek.status,201);
    assert.equal((await savedWeek.json()).revision,1);
    assert.equal((await calendarWrite(memberWithRoles.id,{
      action:"weekly",revision:0,effectiveFrom:calendarBefore.today,days:dates
    })).status,409);
    const firstCalendar=await (await calendarRead(memberWithRoles.id)).json();
    assert.equal(firstCalendar.configured,true);
    assert.equal(firstCalendar.weeks.length,1);
    assert.equal(firstCalendar.contractPercent,100);
    assert.equal(firstCalendar.day.developmentCapacityJh,null);
    const saturday=new Date(calendarBefore.today+"T00:00:00Z");
    const daysUntilSaturday=(6-saturday.getUTCDay()+7)%7;
    saturday.setUTCDate(saturday.getUTCDate()+daysUntilSaturday);
    const saturdayDate=saturday.toISOString().slice(0,10);
    const savedException=await calendarWrite(memberWithRoles.id,{
      action:"exception",revision:0,onDate:saturdayDate,
      morning:true,afternoon:false,note:"Permanence"
    });
    assert.equal(savedException.status,201);
    const exceptionDay=await (await calendarRead(memberWithRoles.id,replacement,
      "?onDate="+saturdayDate)).json();
    assert.equal(exceptionDay.day.status,"configured");
    assert.equal(exceptionDay.day.source,"exception");
    assert.deepEqual(exceptionDay.day.slots,{morning:true,afternoon:false});
    assert.equal(exceptionDay.day.absenceDays,null);
    assert.equal(exceptionDay.day.developmentCapacityJh,null);
    const tomorrow=new Date(calendarBefore.today+"T00:00:00Z");
    tomorrow.setUTCDate(tomorrow.getUTCDate()+7);
    const futureFrom=tomorrow.toISOString().slice(0,10);
    const futureDays=dates.map(d=>({...d,morning:false,afternoon:false}));
    assert.equal((await calendarWrite(memberWithRoles.id,{
      action:"weekly",revision:1,effectiveFrom:futureFrom,days:futureDays
    })).status,201);
    const afterFuture=await (await calendarRead(memberWithRoles.id)).json();
    assert.equal(afterFuture.weeks.length,2);
    assert.equal(afterFuture.current.revision,1);
    assert.equal(afterFuture.day.source,"weekly");
    assert.equal(afterFuture.exceptions.length,1);
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS count FROM public.smn_member_calendar_week WHERE member_id=$1",
      [memberWithRoles.id]
    )).rows[0].count)),2);
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS count FROM public.smn_member_calendar_exception WHERE member_id=$1",
      [memberWithRoles.id]
    )).rows[0].count)),1);
    const lifecyclePath=id=>"/api/admin/members/"+encodeURIComponent(id)+"/lifecycle";
    const lifecycleRead=(id,cookie=replacement)=>get(lifecyclePath(id),{
      headers:cookie?{Cookie:cookie}:{}});
    const lifecycleWrite=(id,payload,cookie=replacement)=>
      postAuth(lifecyclePath(id),payload,cookie);
    assert.equal((await lifecycleRead(memberWithRoles.id,"")).status,403);
    const inspection=(await (await lifecycleRead(memberWithRoles.id)).json());
    assert.equal(inspection.assignments.length,1);
    assert.equal(inspection.canDelete,false);
    assert.ok(inspection.referenceCount>0);
    const firstAssignment=inspection.assignments[0];
    assert.equal((await lifecycleWrite(memberWithRoles.id,{
     action:"close",assignmentId:firstAssignment.id,endOn:"2020-01-01",revision:0
    })).status,400);
    const ended=await lifecycleWrite(memberWithRoles.id,{
     action:"close",assignmentId:firstAssignment.id,endOn:inspection.today,revision:0
    });
    assert.equal(ended.status,200);
    assert.equal((await ended.json()).activeCount,4);
    assert.equal((await lifecycleWrite(memberWithRoles.id,{
     action:"delete",confirmation:"SUPPRIMER",revision:1
    })).status,409);
    const archived=await lifecycleWrite(memberWithRoles.id,{action:"archive",revision:1});
    assert.equal(archived.status,200);
    const rosterArchived=await (await get("/api/admin/members",{
     headers:{Cookie:replacement}})).json();
    assert.equal(rosterArchived.members[0].archived,true);
    assert.equal(rosterArchived.members.length,5);
    const restore=await lifecycleWrite(memberWithRoles.id,{action:"reactivate",revision:2});
    assert.equal(restore.status,200);
    const afterRestore=await (await lifecycleRead(memberWithRoles.id)).json();
    assert.equal(afterRestore.archived,false);
    assert.equal(afterRestore.assignments[0].endOn,inspection.today);
    assert.equal(afterRestore.memberId,memberWithRoles.id);
    // A closure with two remaining members must warn without blocking.
    for(const index of [2,3]){
      const person=rosterAfter.members[index];
      const state=await (await lifecycleRead(person.id)).json();
      const result=await lifecycleWrite(person.id,{
       action:"close",assignmentId:state.assignments[0].id,
       endOn:state.today,revision:0
      });
      assert.equal(result.status,200);
      const saved=await result.json();
      if(index===3){
       assert.equal(saved.activeCount,2);
       assert.equal(saved.warning,"team-below-three");
      }
    }
    const preserved=await withDb(async c=>(await c.query(
     "SELECT count(*)::int AS count FROM public.smn_member_assignment_version WHERE assignment_id=$1",
     [firstAssignment.id]
    )).rows[0].count);
    assert.equal(preserved,2);
    const history=await withDb(async c=>(await c.query(
     "SELECT count(*)::int AS count FROM public.smn_member_lifecycle_event WHERE member_id=$1",
     [memberWithRoles.id]
    )).rows[0].count);
    assert.equal(history,3);
    // SMN-48: country catalog is independent from holiday files.
    const countriesUrl="/api/admin/countries";
    const countriesGet=(cookie=replacement)=>get(countriesUrl,{headers:cookie?{Cookie:cookie}:{}});
    const countriesPost=(input,cookie=replacement)=>postAuth(countriesUrl,input,cookie);
    assert.equal((await countriesGet("")).status,403);
    // Le catalogue v30 ne doit pas effectuer de lectures ni de mutations en schéma v15.
    // Ses parcours positifs sont couverts par les contrats d'entreprise v31.
    const seeded=await countriesGet();
    assert.equal(seeded.status,503);
    assert.deepEqual(await seeded.json(),{error:"service-unavailable"});
    assert.equal((await countriesPost({code:"NL",name:"Pays-Bas"})).status,503);
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS count FROM public.smn_country WHERE code='NL'"
    )).rows[0].count)),0);
    const initialBackupStatus=await get("/api/admin/backups",{headers:{Cookie:replacement}});
    assert.equal(initialBackupStatus.status,200);
    assert.equal((await initialBackupStatus.json()).needsRecoveryPhrase,true);
    assert.equal((await get("/app/admin/backups",{headers:{Cookie:replacement},redirect:"manual"})).status,200);
    const backupRequest=(input,cookie=replacement)=>postAuth("/api/admin/backups",input,cookie);
    assert.equal((await backupRequest({}, "")).status,403);
    const tooShort=await backupRequest({recoveryPhrase:"short"});
    assert.equal(tooShort.status,503);
    assert.equal((await tooShort.json()).status,"failed");
    let backupToolReady=false;
    try{
      backupToolReady=/\b18\.\d+\b/.test(execFileSync("pg_dump",["--version"],
        {encoding:"utf8",timeout:3000}));
    }catch{ /* la qualification positive exige pg_dump 18 */ }
    if(backupToolReady){
      const recoveryPhrase="Une phrase de récupération longue pour la recette 2026 !";
      const created=await backupRequest({recoveryPhrase});
      assert.equal(created.status,201);
      const payload=await created.json();
      assert.equal(payload.status,"success");
      assert.equal(payload.documentCount,0);
      const folder=join(backupRoot,"packages",payload.id);
      const index=JSON.parse(await readFile(join(folder,"index.json"),"utf8"));
      assert.equal(index.version,1);
      assert.equal(index.id,payload.id);
      assert.equal(index.recovery.kdf,"scrypt");
      assert.equal(JSON.stringify(index).includes(recoveryPhrase),false);
      const database=await readFile(join(folder,"database.pgcustom.enc"));
      assert.ok(database.length>0);
      assert.doesNotMatch(database.toString("utf8"),/password_hash|admin@localhot.com/);
      assert.equal((await get("/api/admin/backups",{headers:{Cookie:replacement}})).status,200);
      const again=await backupRequest({});
      assert.equal(again.status,201,"La phrase initiale n'est pas redemandée");
      assert.notEqual((await again.json()).id,payload.id);
    }else{
      console.log("SMN-30 : vérification du chemin d'échec sans pg_dump 18 ; sauvegarde réelle non attestée dans ce runner.");
    }
    const settingsInitialResponse=await get("/api/admin/settings",{headers:{Cookie:replacement}});
    assert.equal(settingsInitialResponse.status,200);
    const settingsInitial=(await settingsInitialResponse.json()).settings;
    assert.deepEqual({
      locale:settingsInitial.locale,theme:settingsInitial.theme,palette:settingsInitial.palette,
      referenceCountry:settingsInitial.referenceCountry,revision:settingsInitial.revision,
      mode:settingsInitial.mode,product:settingsInitial.product,
    },{locale:"fr",theme:"light",palette:"ocean",referenceCountry:null,revision:0,
      mode:"scrum",product:"Produit de recette CI"});
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT schema_version FROM public.smn_installation WHERE id='singleton'"
    )).rows[0].schema_version)),26);
    // SMN-20 — registre de configuration strictement privé aux administrateurs.
    const readChecklist=async(cookie=replacement)=>{
      const response=await get("/api/admin/configuration-tasks",{headers:{Cookie:cookie}});
      assert.equal(response.status,200);
      return response.json();
    };
    const patchTask=(input,cookie=replacement,origin=base)=>get("/api/admin/configuration-tasks",{
      method:"PATCH",redirect:"manual",
      headers:{"Content-Type":"application/json",Origin:origin,...(cookie?{Cookie:cookie}:{})},
      body:JSON.stringify(input),
    });
    assert.equal((await get("/api/admin/configuration-tasks")).status,403);
    assert.equal((await patchTask({key:"display-preferences",status:"done"},"")).status,403);
    assert.equal((await patchTask({key:"display-preferences",status:"done"},replacement,"http://evil.test")).status,403);
    assert.equal((await patchTask({key:"fake",status:"done"})).status,400);
    assert.deepEqual((await readChecklist()).tasks.map(x=>x.status),["todo","todo","todo"]);
    assert.equal((await patchTask({key:"display-preferences",status:"ignored"})).status,200);
    assert.equal((await readChecklist()).tasks[2].status,"ignored");
    const currentValues=()=>withDb(async client=>(await client.query(
      "SELECT locale,theme,reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'"
    )).rows[0]);
    const baseValues=await currentValues();
    const rejected=await patchSettings({...baseValues,locale:"en",theme:"dark",
      referenceCountry:"DE",revision:0,product:"produit falsifié"});
    assert.equal(rejected.status,400);
    assert.equal((await patchSettings({locale:"en",theme:"dark",referenceCountry:"DE",revision:0},
      replacement,"http://attacker.invalid")).status,403);
    assert.deepEqual(await currentValues(),baseValues,"Refus API : aucune préférence écrite");
    const updated=await patchSettings({locale:"en",theme:"dark",referenceCountry:"DE",revision:0});
    assert.equal(updated.status,200);
    const payload=await updated.json();
    assert.equal(payload.settings.palette,"ocean");
    assert.equal(payload.changed,true);
    assert.equal(payload.settings.revision,1);
    assert.equal(payload.settings.mode,"scrum");
    assert.equal(payload.settings.product,"Produit de recette CI");
    assert.deepEqual((await readChecklist()).tasks.map(x=>x.status),["done","todo","ignored"],
      "Le pays est détecté, la tâche ignorée reste ignorée et aucune autre réussite n'est inventée");
    assert.equal((await patchSettings({locale:"fr",theme:"light",referenceCountry:null,revision:0})).status,409);
    const noChange=await patchSettings({locale:"en",theme:"dark",referenceCountry:"DE",revision:1});
    assert.equal(noChange.status,200);
    assert.equal((await noChange.json()).changed,false);
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS n FROM public.smn_general_settings_audit"
    )).rows[0].n)),1);
    assert.deepEqual((await withDb(async client=>(await client.query(
      "SELECT name FROM public.smn_product WHERE id='product'"
    )).rows[0])),{name:"Produit de recette CI"});
    // SMN-24 : palette validée en serveur, migration additive et relecture SSR.
    const badPalette=await patchSettings({locale:"en",theme:"dark",palette:"#000000",
      referenceCountry:"DE",revision:1});
    assert.equal(badPalette.status,400);
    assert.deepEqual(await currentValues(),{
      locale:"en",theme:"dark",reference_country:"DE",revision:1,
    },"Palette interdite : aucune modification enregistrée");
    const selected=await patchSettings({locale:"en",theme:"dark",palette:"forest",
      referenceCountry:"DE",revision:1});
    assert.equal(selected.status,200);
    assert.equal((await selected.json()).settings.palette,"forest");
    const persisted=await get("/api/admin/settings",{headers:{Cookie:replacement}});
    assert.equal((await persisted.json()).settings.palette,"forest");
    const darkPage=await get("/app",{headers:{Cookie:replacement},redirect:"manual"});
    assert.match(await darkPage.text(),/data-bs-theme="dark"[^>]*data-smn-palette="forest"/);
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT mode FROM public.smn_installation WHERE id='singleton'"
    )).rows[0].mode)),"scrum");
    // Force an audit failure to prove rollback of the preference update.
    await withDb(async client=>{
      await client.query(`CREATE FUNCTION public.smn_ci_reject_settings_audit() RETURNS trigger
        LANGUAGE plpgsql AS $smn$ BEGIN RAISE EXCEPTION 'ci-audit-failure'; END; $smn$`);
      await client.query(`CREATE TRIGGER smn_ci_audit_failure BEFORE INSERT ON public.smn_general_settings_audit
        FOR EACH ROW EXECUTE FUNCTION public.smn_ci_reject_settings_audit()`);
    });
    try {
      const beforeFailure=await currentValues();
      const failed=await patchSettings({locale:"fr",theme:"light",referenceCountry:"FR",revision:2});
      assert.equal(failed.status,503);
      assert.deepEqual(await currentValues(),beforeFailure,"Echec d'audit : mise à jour atomiquement annulée");
    }finally{
      await withDb(async client=>{
        await client.query("DROP TRIGGER IF EXISTS smn_ci_audit_failure ON public.smn_general_settings_audit");
        await client.query("DROP FUNCTION IF EXISTS public.smn_ci_reject_settings_audit()");
      });
    }
    assert.equal((await get("/api/diagnostic").then(x=>x.json())).status,"initialized");

    // SMN-17 : phrase préparée uniquement par admin avec preuve du secret actuel.
    assert.equal((await get("/app/security",{headers:{Cookie:replacement},redirect:"manual"})).status,200);
    const phrase="Sauvegarde de secours CI distincte 2026 !";
    const prepare={currentPassword:"nouveau2026",recoveryPhrase:phrase};
    assert.equal((await postAuth("/api/auth/recovery-phrase",prepare,"")).status,401);
    assert.equal((await postAuth("/api/auth/recovery-phrase",{...prepare,currentPassword:"faux"},replacement)).status,400);
    assert.equal((await postAuth("/api/auth/recovery-phrase",prepare,replacement,"http://invalid.example")).status,403);
    assert.equal((await postAuth("/api/auth/recovery-phrase",prepare,replacement)).status,200);
    const recoveryRow=await withDb(async client=>(await client.query(
      "SELECT phrase_hash FROM public.smn_recovery_phrase WHERE account_id=(SELECT id FROM public.smn_account WHERE username='admin')"
    )).rows[0]);
    assert.match(recoveryRow.phrase_hash,/^scrypt:1:/);
    assert.equal(recoveryRow.phrase_hash.includes(phrase),false);
    assert.deepEqual((await readChecklist()).tasks.map(x=>x.status),["done","done","ignored"],
      "La préparation effective de la phrase termine uniquement la tâche concernée");
    assert.equal((await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS count FROM public.smn_auth_audit WHERE action='recovery_prepared'"
    )).rows[0].count)),1);

    assert.notEqual(replacement, original);
    assert.equal((await get("/api/auth/me", { headers:{Cookie:original} })).status, 401);
    const privatePage = await get("/app", { headers:{Cookie:replacement},redirect:"manual" });
    assert.equal(privatePage.status, 200);
    const privateHtml = await privatePage.text();
    assert.match(privateHtml, /(Vue d.{1,15}ensemble|Overview)/i);
    assert.match(privateHtml, /Produit de recette CI/);
    assert.match(privateHtml, /href="#smn-main"/);
    assert.match(privateHtml, /id="smn-main"/);
    assert.match(privateHtml, /Equipe CI/);
    assert.match(privateHtml.replace(/<!--.*?-->/g, ""), /(Aucun sprint enregistr|No sprint has been recorded)/i);
    assert.doesNotMatch(privateHtml, /admin@localhot.com/);
    assert.doesNotMatch(privateHtml, /Story Points.*>0</);
    await verifyDashboard(replacement);
    const notShared=await get("/api/documents/unknown/download",{headers:{Cookie:replacement}});
    assert.equal(notShared.status,404);
    assert.deepEqual(await notShared.json(),{error:"not-found"});

    // SMN-23 : navigation HTML en lecture seule, liée à une vraie équipe I0.
    const detailPath="/app/team/team";
    assert.equal((await get(detailPath,{redirect:"manual"})).status,307);
    const linked=await get("/app?filter=sample&version=2&asOf=2026-10-20",
      {headers:{Cookie:replacement},redirect:"manual"});
    assert.equal(linked.status,200);
    const linkedHtml=await linked.text();
    assert.match(linkedHtml,/\/app\/team\/team\?/);
    const details=await get(detailPath+"?"+new URLSearchParams({
      returnTo:"/app?teamId=team&cycleId=cycle-42&filter=sample&version=2&asOf=2026-10-20",
    }),{headers:{Cookie:replacement},redirect:"manual"});
    assert.equal(details.status,200);
    const detailHtml=await details.text();
    assert.match(detailHtml,/Equipe CI/);
    assert.match(detailHtml,/Produit de recette CI/);
    assert.match(detailHtml,/(informations actuelles|current information)/i);
    assert.match(detailHtml,/(contexte de consultation historique|historical consultation context)/i);
    assert.doesNotMatch(detailHtml,/admin@localhot.com|password_hash/);
    const unknownDetail=await get("/app/team/unknown",{headers:{Cookie:replacement},redirect:"manual"});
    assert.equal(unknownDetail.status,404);
    assert.doesNotMatch(await unknownDetail.text(),/admin@localhot.com|password_hash/);
    // Une équipe utilisée par un registre de membres ne peut être supprimée
    // sans rompre les clés étrangères : la recette vérifie cette intégrité.
    await assert.rejects(
      ()=>withDb(client=>client.query("DELETE FROM public.smn_team WHERE id='team'")),
      error=>error?.code==="23503"
    );
    assert.equal((await get("/app/team/team",{headers:{Cookie:replacement},redirect:"manual"})).status,200);
    await verifyDashboard(replacement);
    assert.equal(await rawStatus("/api/dashboard",{Cookie:replacement,Host:"evil.example:3003"}),403);
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
    const accountCount=()=>withDb(async client=>(await client.query("SELECT count(*)::text AS count FROM public.smn_account")).rows[0].count);
    const beforeMissingOrigin=await accountCount();
    const missingOrigin=await get("/api/admin/accounts",{
      method:"POST",headers:{"Content-Type":"application/json",Cookie:replacement},
      body:JSON.stringify({...newUser,username:"missing_origin",email:"missing-origin@example.test"}),
    });
    assert.equal(missingOrigin.status,403);
    assert.equal(await accountCount(),beforeMissingOrigin,"POST administrateur sans Origin : aucun compte ajouté");
    const created=await postAuth("/api/admin/accounts",newUser,replacement);
    assert.equal(created.status,201);
    const createdBody=await created.json();
    const userId=createdBody.account.id;
    assert.equal(createdBody.account.role,"user");
    const accountAuditRow=await withDb(async c=>(await c.query(
      "SELECT id,actor_id,object_id,action,old_values,new_values FROM public.smn_account_audit WHERE object_id=$1",
      [userId])).rows[0]);
    assert.equal(accountAuditRow.action,"account_created");
    assert.equal(accountAuditRow.object_id,userId);
    assert.deepEqual(accountAuditRow.new_values,{role:"user",isActive:true});
    assert.doesNotMatch(JSON.stringify(accountAuditRow),/pilot1234|pilote@example.test/);
    assert.equal(JSON.stringify(createdBody).includes("password_hash"),false);
    assert.equal(JSON.stringify(createdBody).includes("pilot1234"),false);
    const dupe=await postAuth("/api/admin/accounts",
      {...newUser,username:"PILOTE",email:"different@example.test"},replacement);
    assert.equal(dupe.status,409);
    assert.equal((await withDb(async c=>(await c.query(
      "SELECT count(*)::int AS count FROM public.smn_account_audit WHERE action='account_created'"
    )).rows[0].count)),1,"Un doublon rejeté ne produit aucun audit de réussite");
    const listed=await get("/api/admin/accounts",{headers:{Cookie:replacement}});
    assert.equal(listed.status,200);
    assert.equal((await listed.json()).accounts.length,2);
    const userLogin=await postAuth("/api/auth/login",{identity:"pilote",password:"pilot1234"});
    assert.equal(userLogin.status,200);
    const userCookie=tokenCookie(userLogin);
    assert.equal((await get("/api/dashboard",{headers:{Cookie:userCookie}})).status,403);
    assert.equal((await get("/api/admin/accounts",{headers:{Cookie:userCookie}})).status,403);
    assert.equal((await postAuth("/api/admin/accounts",{...newUser,username:"bad"},userCookie)).status,403);
    const userChanged=await postAuth("/api/auth/change-password",
      {currentPassword:"pilot1234",newPassword:"piloteChange2026"},userCookie);
    assert.equal(userChanged.status,200);
    const userReady=tokenCookie(userChanged);
    assert.equal((await get("/api/admin/settings",{headers:{Cookie:userReady}})).status,403);
    assert.equal((await get("/api/admin/configuration-tasks",{headers:{Cookie:userReady}})).status,403);
    assert.equal((await patchTask({key:"display-preferences",status:"done"},userReady)).status,403);
    assert.equal((await patchSettings({locale:"fr",theme:"light",referenceCountry:null,revision:1},userReady)).status,403);
    const blockedSettingsPage=await get("/app/admin/settings",{headers:{Cookie:userReady},redirect:"manual"});
    assert.equal(blockedSettingsPage.status,307);

    assert.equal((await postAuth("/api/auth/recovery-phrase",
      {currentPassword:"piloteChange2026",recoveryPhrase:"Utilisateur non autorise 2026 !"},userReady)).status,403);

    await verifyDashboard(userReady);
    const rejectedPage=await get("/app/admin/users",{headers:{Cookie:userReady},redirect:"manual"});
    assert.equal(rejectedPage.status,307);
    assert.equal(new URL(rejectedPage.headers.get("location"),base).pathname,"/app");
    assert.equal((await get("/api/admin/accounts",{headers:{Cookie:userReady}})).status,403);
    assert.equal((await get("/api/admin/backups",{headers:{Cookie:userReady}})).status,403);
    assert.equal((await get("/api/admin/members",{headers:{Cookie:userReady}})).status,403);
    assert.equal((await getVersions(userReady)).status,403);
    assert.equal((await countriesGet(userReady)).status,403);
    assert.equal((await countriesPost({code:"BE",name:"Belgique"},userReady)).status,403);
    assert.equal((await locationRead(memberWithRoles.id,userReady)).status,403);
    assert.equal((await locationWrite(memberWithRoles.id,{
      ...initialLocation,revision:2,effectiveFrom:futureLocationDate
    },userReady)).status,403);
    assert.equal((await calendarRead(memberWithRoles.id,userReady)).status,403);
    assert.equal((await calendarWrite(memberWithRoles.id,{action:"weekly",revision:2,
      effectiveFrom:futureFrom,days:futureDays},userReady)).status,403);
    assert.equal((await lifecycleRead(memberWithRoles.id,userReady)).status,403);
    assert.equal((await lifecycleWrite(memberWithRoles.id,{action:"archive",revision:3},userReady)).status,403);
    assert.equal((await postVersion(updateRoles,userReady)).status,403);
    assert.equal((await get(profileUrl,{headers:{Cookie:userReady}})).status,405);
    assert.equal((await patchProfile({
      displayName:"Indiscret",email:"private@example.org",revision:2
    },userReady)).status,403);
    assert.equal((await quickCreate({teamId:"team",count:5,requestId:randomUUID()},userReady)).status,403);
    assert.notEqual((await get("/app/admin/members",{headers:{Cookie:userReady},redirect:"manual"})).status,200);
    assert.equal((await backupRequest({},userReady)).status,403);
    assert.notEqual((await get("/app/admin/backups",{headers:{Cookie:userReady},redirect:"manual"})).status,200);
    assert.equal((await get("/api/admin/audit",{headers:{Cookie:userReady}})).status,403);
    assert.notEqual((await get("/app/admin/audit",{headers:{Cookie:userReady},redirect:"manual"})).status,200);
    // Une fiche collective est lisible pour l'utilisateur, contrairement aux réglages administratifs.
    const userTeam=await get("/app/team/team",{headers:{Cookie:userReady},redirect:"manual"});
    assert.equal(userTeam.status,200);
    assert.match(await userTeam.text(),/Equipe CI/);
    const userDashboard=await get("/app",{headers:{Cookie:userReady},redirect:"manual"});
    assert.equal(userDashboard.status,200);
    const userHtml=await userDashboard.text();
    assert.match(userHtml,/Produit de recette CI/);
    assert.match(userHtml,/Equipe CI/);
    assert.match(userHtml,/(Vue d.{1,15}ensemble|Overview)/i);
    assert.doesNotMatch(userHtml,/Comptes utilisateurs/);
    assert.doesNotMatch(userHtml,/admin@localhot.com/);

    const accountSnapshot=()=>withDb(async client=>(await client.query(
      "SELECT id,username,email,role,password_hash,must_change_password,is_active FROM public.smn_account ORDER BY id"
    )).rows);
    const beforeUserMutations=await accountSnapshot();
    const forbiddenEdit=await postAuth("/api/admin/accounts",{...newUser,username:"not_allowed"},userReady);
    assert.equal(forbiddenEdit.status,403);
    const patchAccount=(id,fields,cookie= replacement,origin=base)=>
      get("/api/admin/accounts/"+id,{
        method:"PATCH",redirect:"manual",
        headers:{"Content-Type":"application/json",Origin:origin,Cookie:cookie},
        body:JSON.stringify(fields),
      });
    assert.equal((await patchAccount(userId,{role:"admin",isActive:true},userReady)).status,403);
    assert.deepEqual(await accountSnapshot(),beforeUserMutations,
      "POST et PATCH refusés à l'utilisateur : aucun compte ni secret modifié");
    // Les lignes d'une autre installation ne sont ni listées ni modifiables.
    const foreignId=randomUUID();
    let movedId;
    await withDb(async client=>{
      await client.query("INSERT INTO public.smn_installation(id,state,schema_version,mode) VALUES('foreign-ci','initialized',1,'scrum')");
      await client.query("INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password,is_active) VALUES($1,'foreign-ci','foreign_ci','foreign@example.test','admin',$2,false,true)",[foreignId,hash]);
    });
    try {
      const temporary=await postAuth("/api/admin/accounts",{
        username:"moved_ci",email:"moved@example.test",role:"user",password:"temporary2026",
      },replacement);
      assert.equal(temporary.status,201);
      movedId=(await temporary.json()).account.id;
      const temporaryLogin=await postAuth("/api/auth/login",{identity:"moved_ci",password:"temporary2026"});
      assert.equal(temporaryLogin.status,200);
      const temporaryChanged=await postAuth("/api/auth/change-password",{
        currentPassword:"temporary2026",newPassword:"movedChange2026",
      },tokenCookie(temporaryLogin));
      assert.equal(temporaryChanged.status,200);
      const movedCookie=tokenCookie(temporaryChanged);
      await verifyDashboard(movedCookie);
      await withDb(client=>client.query("UPDATE public.smn_account SET installation_id='foreign-ci' WHERE id=$1",[movedId]));
      assert.equal((await get("/api/dashboard",{headers:{Cookie:movedCookie}})).status,403);
      assert.equal((await get("/api/auth/me",{headers:{Cookie:movedCookie}})).status,401);
      const visible=await (await get("/api/admin/accounts",{headers:{Cookie:replacement}})).json();
      assert.equal(visible.accounts.some(account=>account.id===foreignId),false);
      const foreignPatch=await patchAccount(foreignId,{role:"user",isActive:false});
      const absentPatch=await patchAccount(randomUUID(),{role:"user",isActive:false});
      assert.equal(foreignPatch.status,absentPatch.status);
      assert.deepEqual(await foreignPatch.json(),await absentPatch.json());
      const foreign=await withDb(async client=>(await client.query("SELECT role,is_active FROM public.smn_account WHERE id=$1",[foreignId])).rows[0]);
      assert.deepEqual(foreign,{role:"admin",is_active:true});
      assert.equal((await postAuth("/api/auth/login",{identity:"foreign_ci",password:"admin"})).status,401);
    } finally {
      await withDb(async client=>{
        await client.query("DELETE FROM public.smn_account WHERE id=$1 OR id=$2",[foreignId,movedId??null]);
        await client.query("DELETE FROM public.smn_installation WHERE id='foreign-ci'");
      });
    }
    const promoted=await patchAccount(userId,{role:"admin",isActive:true});
    assert.equal(promoted.status,200);
    const auditAfterPromotion=await get("/api/admin/audit",{headers:{Cookie:replacement}});
    assert.equal(auditAfterPromotion.status,200);
    const auditEntries=(await auditAfterPromotion.json()).entries;
    assert.ok(auditEntries.some(entry=>entry.objectId===userId&&entry.action==="account_updated"));
    assert.ok(auditEntries.some(entry=>entry.action==="settings_updated"));
    assert.ok(auditEntries.some(entry=>entry.action==="recovery_prepared"));
    assert.doesNotMatch(JSON.stringify(auditEntries),/password_hash|phrase_hash|pilot1234|pilote@example.test/);
    assert.equal((await get("/api/dashboard",{headers:{Cookie:userReady}})).status,403);
    assert.equal((await get("/api/auth/me",{headers:{Cookie:userReady}})).status,401,
      "Ancienne session utilisateur révoquée après changement de rôle");
    const promotedLogin=await postAuth("/api/auth/login",{identity:"pilote",password:"piloteChange2026"});
    assert.equal(promotedLogin.status,200);
    const promotedCookie=tokenCookie(promotedLogin);
    await verifyDashboard(promotedCookie);
    const disabled=await patchAccount(userId,{role:"user",isActive:false});
    assert.equal(disabled.status,200);
    assert.equal((await get("/api/dashboard",{headers:{Cookie:promotedCookie}})).status,403);
    assert.equal((await postAuth("/api/auth/login",{identity:"pilote",password:"piloteChange2026"})).status,401);
    const selfId=(await (await get("/api/admin/accounts",{headers:{Cookie:replacement}})).json()).accounts
      .find(a=>a.username==="admin").id;
    assert.equal((await patchAccount(selfId,{role:"user",isActive:false})).status,409);
    console.log("SMN-16 : dashboard admin/user, projection collective, refus anonymes/initiaux et mutations user sans effet vérifiés.");
    console.log("SMN-15 : création, unicité, refus simple utilisateur, session révoquée et désactivation vérifiés.");
    assert.equal((await postAuth("/api/auth/activity", {}, replacement, "http://invalid.example")).status, 403);
    assert.equal((await postAuth("/api/auth/activity", {}, replacement)).status, 200);
    assert.equal((await postAuth("/api/auth/logout", {}, replacement)).status, 200);
    assert.equal((await get("/api/auth/me", { headers:{Cookie:replacement} })).status, 401);
    assert.equal((await postAuth("/api/auth/login", {identity:"admin",password:"admin"})).status, 401);
    const secondLogin=await postAuth("/api/auth/login", {identity:"admin@localhot.com",password:"nouveau2026"});
    assert.equal(secondLogin.status,200);
    const oldValidCookie=tokenCookie(secondLogin);
    const renewed=await postAuth("/api/auth/change-password",
      {currentPassword:"nouveau2026",newPassword:"RenouveleCI2026"},oldValidCookie);
    assert.equal(renewed.status,200);
    const newValidCookie=tokenCookie(renewed);
    assert.notEqual(newValidCookie,oldValidCookie);
    assert.equal((await get("/api/auth/me",{headers:{Cookie:oldValidCookie}})).status,401);
    assert.equal((await get("/api/auth/me",{headers:{Cookie:newValidCookie}})).status,200);
    const recoveryDeleted=await withDb(async client=>(await client.query(
      "SELECT count(*)::int AS count FROM public.smn_recovery_phrase"
    )).rows[0].count);
    assert.equal(recoveryDeleted,0,"La rotation doit invalider la phrase de secours");
    const audit=await withDb(async client=>(await client.query(
      "SELECT action,count(*)::int AS count FROM public.smn_auth_audit GROUP BY action"
    )).rows);
    assert.ok(audit.some(x=>x.action==="password_changed"&&x.count>=2));
    console.log("SMN-17 : préparation, contrôle de rôle, rotation et révocation sans divulgation vérifiés.");
    console.log("SMN-14 : auth, rotation, déconnexion, refus CSRF et ACL HTTP PostgreSQL vérifiés.");
  } finally {
    await withDb(async client => {
      for (const table of ["smn_general_settings_audit","smn_general_settings","smn_auth_audit","smn_recovery_phrase","smn_account","smn_team","smn_product","smn_installation","_prisma_migrations"]) {
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
  await rm(backupRoot,{recursive:true,force:true}).catch(()=>undefined);
}
