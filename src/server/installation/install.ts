import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { Client } from "pg";
import { parseConnectionSettings } from "../db/config";
import { probePostgres } from "../db/probe";
import { classifySnapshot, diagnoseInstallation } from "./diagnostic";
import { INITIAL_MIGRATION, validateExpressInput } from "./contract";
import { INITIAL_SCHEMA_SQL, PRISMA_HISTORY_SQL } from "./migration";
import { passwordHash } from "../auth/password";
import { seedDefaultScrumCeremonyTemplates } from "../sprints/ceremony-templates";
import {ceremonyStatements} from "../../../scripts/apply-ceremony-schema-v32";
export { passwordHash } from "../auth/password";

export type InstallResult = { ok: true } | { ok: false; status: string };
export function setupAuthorized(configured: string | undefined, supplied: unknown): boolean {
  if (!configured || configured.length < 32 || typeof supplied !== "string") return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function installExpress(rawBody: unknown, rawUri: string | undefined): Promise<InstallResult> {
  const input = validateExpressInput(rawBody);
  if (!input) return { ok: false, status: "invalid-input" };
  const settings = parseConnectionSettings(rawUri);
  if (!settings.ok) return { ok: false, status: settings.status };
  const uri = new URL(settings.uri);
  const dbName = decodeURIComponent(uri.pathname.slice(1));
  const adminHash = await passwordHash(input.password);
  // Une base déjà préparée ne nécessite pas de connexion administrative à
  // postgres. Le compte existant doit seulement pouvoir créer les tables.
  const before = await diagnoseInstallation(() => probePostgres(uri.toString()));
  if (before.status !== "virgin" && before.status !== "database-missing") {
    return { ok: false, status: before.status };
  }
  let created = false;
  if (before.status === "database-missing") {
    const maintenance = new URL(uri); maintenance.pathname = "/postgres";
    const maint = new Client({ connectionString: maintenance.toString(), connectionTimeoutMillis: 3000 });
    try {
      await maint.connect();
      const server = await maint.query<{ v: string; cancreate: boolean }>(
        "SELECT current_setting('server_version_num') AS v, coalesce((SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user),false) AS cancreate",
      );
      if (Math.floor(Number(server.rows[0]?.v) / 10000) !== 18) return { ok: false, status: "unsupported-postgres" };
      const db = await maint.query<{ present: boolean }>("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname=$1) AS present", [dbName]);
      if (db.rows[0]?.present === true) return { ok: false, status: "database-already-present" };
      if (!server.rows[0]?.cancreate) return { ok: false, status: "createdb-required" };
      await maint.query(`CREATE DATABASE "${dbName}"`);
      created = true;
    } catch {
      return { ok: false, status: "postgres-error" };
    } finally { await maint.end().catch(() => undefined); }
  }
  let dbClient: Client | undefined;
  let transaction = false;
  try {
    if (!created) {
      const diagnosis = classifySnapshot(await probePostgres(uri.toString()));
      if (diagnosis.status !== "virgin") return { ok: false, status: diagnosis.status };
    }
    dbClient = new Client({ connectionString: uri.toString(), connectionTimeoutMillis: 3000 });
    await dbClient.connect();
    await dbClient.query("BEGIN");
    transaction = true;
    await dbClient.query("SELECT pg_advisory_xact_lock(20261020, 12)");
    const objects = await dbClient.query<{ count: string }>(`
      SELECT (
        (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname NOT IN ('pg_catalog','information_schema')
          AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
          AND c.relkind IN ('r','p','v','m','S','f','c'))
        + (SELECT count(*) FROM pg_namespace n WHERE n.nspname NOT IN ('public','pg_catalog','information_schema')
          AND n.nspname NOT LIKE 'pg_%')
        + (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public')
        + (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
          WHERE n.nspname='public' AND t.typtype IN ('d','e','r','m'))
      )::text AS count
    `);
    if (objects.rows[0]?.count !== "0") return { ok: false, status: "not-empty" };
    await dbClient.query(PRISMA_HISTORY_SQL);
    await dbClient.query(INITIAL_SCHEMA_SQL);
    await dbClient.query("INSERT INTO public.smn_installation(id,state,schema_version,mode) VALUES('singleton','initialized',1,$1)", [input.mode]);
    await dbClient.query("INSERT INTO public.smn_product(id,installation_id,name) VALUES('product','singleton',$1)", [input.product]);
    await dbClient.query("INSERT INTO public.smn_team(id,installation_id,product_id,name) VALUES('team','singleton','product',$1)", [input.team]);
    // Les quatre cérémonies Scrum sont de simples modèles actifs par défaut.
    // Aucun modèle n'est ajouté en mode Kanban.
    if (input.mode === "scrum") {
      // During first-time installation, materialize the two versioned template relations
      // before their default data is seeded. Business services must never execute DDL.
      const templateTables = ceremonyStatements.filter(sql =>
        sql.startsWith("CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template(") ||
        sql.startsWith("CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template_history("));
      if (templateTables.length !== 2) throw Error("scrum-template-migration-unavailable");
      for (const sql of templateTables) await dbClient.query(sql);
      await seedDefaultScrumCeremonyTemplates(dbClient, "team");
    }
    await dbClient.query(
      "INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password) VALUES($1,'singleton',$2,$3,'admin',$4,true)",
      [randomUUID(), input.adminUsername, input.adminEmail, adminHash],
    );
    await dbClient.query(`INSERT INTO public._prisma_migrations(id,checksum,finished_at,migration_name,applied_steps_count)
      VALUES($1,$2,now(),$3,1)`, [randomUUID(), createHash("sha256").update(INITIAL_SCHEMA_SQL).digest("hex"), INITIAL_MIGRATION]);
    await dbClient.query("COMMIT");
    transaction = false;
    // Une réussite est annoncée uniquement si le véritable probe reconnaît
    // la migration et le schéma enregistrés, jamais sur le seul COMMIT.
    const verified = classifySnapshot(await probePostgres(uri.toString()));
    return verified.status === "initialized" ? { ok: true } : { ok: false, status: "verification-failed" };
  } catch {
    return { ok: false, status: "installation-failed" };
  } finally {
    if (transaction) await dbClient?.query("ROLLBACK").catch(() => undefined);
    await dbClient?.end().catch(() => undefined);
  }
}
