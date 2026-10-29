import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "pg";
import { installExpress } from "../src/server/installation/install";
import { classifySnapshot } from "../src/server/installation/diagnostic";
import { probePostgres } from "../src/server/db/probe";
import { parseConnectionSettings } from "../src/server/db/config";
import { readFile } from "node:fs/promises";
import {readFileSync} from "node:fs";
import { INITIAL_SCHEMA_SQL } from "../src/server/installation/migration";
import {ceremonyStatements} from "../scripts/apply-ceremony-schema-v32";
import { prepareExisting } from "../src/server/bootstrap/existing";
import { authenticate, changeInitialPassword } from "../src/server/auth/credentials";
import { ensureAccountsSchema, ACCOUNTS_MIGRATION_SQL } from "../src/server/accounts/migration";
import { ACCOUNT_AUDIT_MIGRATION_SQL } from "../src/server/audit/account-migration";
import { listAccounts,createAccount,updateAccount } from "../src/server/accounts/manager";

// Base créée et supprimée exclusivement par le runner éphémère GitHub Actions.
const source = process.env.SMN_TEST_DATABASE_URL;
const enabled = process.env.GITHUB_ACTIONS === "true" && process.env.CI === "true" &&
  !!source && /^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(source);
const input = { mode: "scrum", product: "Produit SMN", team: "Équipe Alpha", password: "MotDePasseTest2026Solide" };
const target = enabled ? new URL(source!) : undefined;
if (target) target.pathname = "/smn_ci_setup";
async function withClient<T>(uri: string, task: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: uri });
  try { await client.connect(); return await task(client); }
  finally { await client.end().catch(() => undefined); }
}
it("l'installation prépare explicitement les modèles Scrum avant de les renseigner",()=>{
 const installer=readFileSync(new URL("../src/server/installation/install.ts",import.meta.url),"utf8");
 const create=installer.indexOf("for (const sql of templateTables) await dbClient.query(sql)");
 const seed=installer.indexOf("await seedDefaultScrumCeremonyTemplates(dbClient, \"team\")");
 assert.ok(create>=0&&seed>create,"Les modèles doivent être créés par la migration avant le seed");
 assert.equal(ceremonyStatements.filter(sql=>sql.startsWith("CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template(")||sql.startsWith("CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template_history(")).length,2);
});
describe("SMN-12 — installation réelle sur base CI temporaire", { skip: !enabled }, () => {
  it("contrôle les identifiants PostgreSQL fournis avant création de la base SMN", async () => {
    assert.ok(source);
    const input = new URL(source);
    const user = decodeURIComponent(input.username);
    const password = decodeURIComponent(input.password);
    const port = Number(input.port || "5432");
    const uri = await prepareExisting({ postgresUser: user, postgresPassword: password, postgresPort: port });
    assert.equal(new URL(uri).pathname, "/smn");
    await assert.rejects(() => prepareExisting({ postgresUser: user, postgresPassword: "invalid-ci-password", postgresPort: port }), /postgres-auth-invalid/);
  });

  it("vérifie les identifiants PostgreSQL fournis sans aucune écriture", async () => {
    assert.ok(source);
    const url = new URL(source);
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const verified = await prepareExisting({ postgresUser: user, postgresPassword: password, postgresPort: 5432 });
    assert.match(verified, /\/smn$/);
    await assert.rejects(
      () => prepareExisting({ postgresUser: user, postgresPassword: "incorrect1234", postgresPort: 5432 }),
      /postgres-auth-invalid/,
    );
  });
  it("le fichier de migration Prisma correspond exactement au schéma versionné", async () => {
    assert.equal(await readFile("prisma/migrations/20261020_smn12_initial/migration.sql", "utf8"), INITIAL_SCHEMA_SQL);
  });
  it("rejette l'installation non valide avant de créer une base", async () => {
    assert.ok(source && target);
    const unknown = new URL(target);
    unknown.pathname = "/smn_ci_invalid";
    const result = await installExpress({ ...input, mode: "invalid" }, unknown.toString());
    assert.deepEqual(result, { ok: false, status: "invalid-input" });
    const maintenance = new URL(source); maintenance.pathname = "/postgres";
    const present = await withClient(maintenance.toString(), async (client) => {
      const check = await client.query<{ present: boolean }>("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='smn_ci_invalid') AS present");
      return check.rows[0].present;
    });
    assert.equal(present, false);
  });

  it("n'autorise qu'une installation concurrente sur une base neuve", async () => {
    assert.ok(source && target);
    const targetRace = new URL(target);
    targetRace.pathname = "/smn_ci_race";
    const maintenance = new URL(source); maintenance.pathname = "/postgres";
    try {
      const results = await Promise.all([installExpress(input, targetRace.toString()), installExpress(input, targetRace.toString())]);
      assert.equal(results.filter((r) => r.ok).length, 1, "Une seule initialisation doit réussir");
      const count = await withClient(targetRace.toString(), async (client) => {
        const data = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM public.smn_account");
        return data.rows[0].count;
      });
      assert.equal(count, "1");
    } finally {
      await withClient(maintenance.toString(), async (client) => {
        await client.query("DROP DATABASE IF EXISTS smn_ci_race WITH (FORCE)");
      });
    }
  });

  it("crée une seule installation et refuse la répétition, sans secret en clair", async () => {
    assert.ok(source && target);
    assert.equal(parseConnectionSettings(target.toString()).ok, true);
    const maintenance = new URL(source); maintenance.pathname = "/postgres";
    // Précondition : instance CI jetable connue. Ne supprimer que la base de test réservée.
    await withClient(maintenance.toString(), async (client) => {
      const check = await client.query<{ present: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname='smn_ci_setup') AS present",
      );
      assert.equal(check.rows[0].present, false, "La base de test doit être absente avant essai.");
    });
    try {
      const first = await installExpress(input, target.toString());
      assert.deepEqual(first, { ok: true });
      const snapshot = await probePostgres(target.toString());
      assert.equal(classifySnapshot(snapshot).status, "initialized");
      const data = await withClient(target.toString(), async (client) =>
        client.query<{ username: string; email: string; password_hash: string; must_change_password: boolean }>(
          "SELECT username,email,password_hash,must_change_password FROM public.smn_account",
        ));
      assert.equal(data.rowCount, 1);
      assert.equal(data.rows[0].username, "admin");
      assert.equal(data.rows[0].email, "admin@localhot.com");
      assert.equal(data.rows[0].must_change_password, true);
      assert.equal(data.rows[0].password_hash.includes(input.password), false);
      await withClient(target.toString(), client => ensureAccountsSchema(client));
      assert.equal((await readFile("prisma/migrations/20261020_smn15_accounts/migration.sql","utf8")), ACCOUNTS_MIGRATION_SQL);
      assert.equal((await readFile("prisma/migrations/20261021_smn29_account_audit/migration.sql","utf8")),ACCOUNT_AUDIT_MIGRATION_SQL);
      assert.equal(classifySnapshot(await probePostgres(target.toString())).status, "initialized");
      // SMN-14 : authentification effective sur la base PostgreSQL installée,
      // renouvellement initial obligatoire, suppression du secret précédent.
      await withClient(target.toString(), async client => {
        const valid = await authenticate(client, "admin", input.password);
        assert.ok(valid);
        assert.equal(valid.must_change_password, true);
        assert.equal((await authenticate(client, "admin@localhot.com", input.password))?.id, valid.id);
        assert.equal(await authenticate(client, "admin", "incorrect"), null);
        assert.equal(await authenticate(client, "unknown", input.password), null);
        assert.equal(await changeInitialPassword(client, valid, "incorrect", "newPassword123"), false);
        assert.equal(await changeInitialPassword(client, valid, input.password, input.password), false);
        assert.equal(await changeInitialPassword(client, valid, input.password, "newPassword123"), true);
        assert.equal(await authenticate(client, "admin", input.password), null);
        const updated = await authenticate(client, "admin", "newPassword123");
        assert.ok(updated);
        assert.equal(updated.must_change_password, false);
      });
      assert.equal((await installExpress(input, target.toString())).ok, false);
      const accounts = await withClient(target.toString(), async (client) =>
        client.query("SELECT id FROM public.smn_account"));
      assert.equal(accounts.rowCount, 1);
      await withClient(target.toString(), async client => {
        const admin=(await authenticate(client,"admin","newPassword123"))!;
        const newUser=await createAccount(client,{
          username:"consultant",email:"consultant@example.test",password:"pilot1234",role:"user",
        },admin.id);
        assert.equal(newUser.ok,true);
        if (!newUser.ok) return;
        const userId=newUser.data.id;
        assert.equal((await listAccounts(client)).length,2);
        assert.equal((await authenticate(client,"consultant","pilot1234"))?.role,"user");
        const duplicate=await createAccount(client,{
          username:"CONSULTANT",email:"other@example.test",password:"pilot1234",role:"user",
        },admin.id);
        assert.deepEqual(duplicate,{ok:false,error:"duplicate-account"});
        assert.equal((await listAccounts(client)).length,2,"Pas de ligne créée après collision");
        const lastAdmin=await updateAccount(client,admin.id,userId,{role:"user",isActive:false});
        assert.deepEqual(lastAdmin,{ok:false,error:"last-admin"});
        assert.equal((await updateAccount(client,userId,userId,{role:"admin",isActive:true})).ok,false);
        const promote=await updateAccount(client,userId,admin.id,{role:"admin",isActive:true});
        assert.equal(promote.ok,true);
        assert.equal((await authenticate(client,"consultant","pilot1234"))?.role,"admin");
        const disabled=await updateAccount(client,userId,admin.id,{role:"user",isActive:false});
        assert.equal(disabled.ok,true);
        assert.equal(await authenticate(client,"consultant","pilot1234"),null);
        assert.equal((await listAccounts(client)).find(x=>x.id===userId)?.is_active,false);
        const enabled=await updateAccount(client,userId,admin.id,{role:"user",isActive:true});
        assert.equal(enabled.ok,true);
        assert.equal((await authenticate(client,"consultant","pilot1234"))?.role,"user");
      });
    } finally {
      await withClient(maintenance.toString(), async (client) => {
        await client.query("DROP DATABASE IF EXISTS smn_ci_setup WITH (FORCE)");
      });
    }
  });
});
