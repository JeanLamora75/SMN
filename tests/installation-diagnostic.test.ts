import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifySnapshot, diagnoseInstallation, type Snapshot } from "../src/server/installation/diagnostic";
import { parseConnectionSettings } from "../src/server/db/config";
import { INITIAL_REQUIRED_RELATIONS, INITIAL_MIGRATION, INSTALLATION_RELATIONS } from "../src/server/installation/contract";
import { INITIAL_SCHEMA_SQL } from "../src/server/installation/migration";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const names = ["public.smn_installation:r", "public._prisma_migrations:r"];
const virgin: Snapshot = { schemaUsage: true, schemaCreate: true, serverVersion: 180006, tables: [] };
const valid: Snapshot = {
  ...virgin, tables: names, tableRead: true, migrationsRead: true,
  installations: [{ id: "singleton", state: "initialized", schema_version: 1 }],
  migrations: [{ migration_name: "fixture_migration", finished_at: new Date(), rolled_back_at: null }],
};

describe("SMN-11 — régression des tables optionnelles de contexte Équipe", () => {
  const base: Snapshot = {
    schemaUsage:true,schemaCreate:true,serverVersion:180006,
    tables:[...INITIAL_REQUIRED_RELATIONS],tableRead:true,migrationsRead:true,
    shapeValid:true,
    installations:[{id:"singleton",state:"initialized",schema_version:1}],
    migrations:[{
      migration_name:INITIAL_MIGRATION,
      checksum:createHash("sha256").update(INITIAL_SCHEMA_SQL).digest("hex"),
      finished_at:new Date(),rolled_back_at:null
    }]
  };
  it("préserve les cinq tables fondatrices même si des tables optionnelles sont ajoutées", () => {
    assert.deepEqual([...INITIAL_REQUIRED_RELATIONS],[
      "public._prisma_migrations:r","public.smn_installation:r",
      "public.smn_product:r","public.smn_team:r","public.smn_account:r"
    ]);
    assert.deepEqual(INSTALLATION_RELATIONS.slice(0,5),[...INITIAL_REQUIRED_RELATIONS]);
    assert.equal(classifySnapshot(base).status,"initialized");
  });
  it("ne demande pas de créer une table Vision/Goal pour accéder à une installation existante", () => {
    assert.equal(classifySnapshot({...base,tables:[...base.tables]}).status,"initialized");
    assert.equal(classifySnapshot({...base,tables:[
      ...base.tables,"public.smn_team_context:r","public.smn_team_context_audit:r"
    ]}).status,"initialized");
  });
  it("continue à refuser une vraie table fondatrice absente ou un objet étranger", () => {
    assert.equal(classifySnapshot({...base,
      tables:base.tables.filter(name=>name!=="public.smn_account:r")}).status,
      "installation-incomplete");
    assert.equal(classifySnapshot({...base,tables:[...base.tables,"public.unrelated:r"]}).status,
      "schema-incompatible");
  });
});

const registryDdlSource=(path:string)=>{
 const source=path==="src/server/registries/items.ts"||
  path==="src/server/registries/assessment.ts"||
  path==="src/server/registries/roam.ts"?"scripts/apply-registry-core-v32.ts":
  path==="src/server/registries/cycle-links.ts"?"scripts/apply-registry-extensions-v32.ts":
  path==="src/server/reports/draft-notes.ts"?"scripts/apply-deferred-schema-v32.ts":path;
 return readFileSync(new URL("../"+source,import.meta.url),"utf8");
};
describe("SMN — historique de correction de date d'arrivée d'un membre", () => {
  it("accepte la table d'audit créée par la correction rétroactive sans ouvrir le schéma aux objets étrangers", () => {
    const relation="public.smn_member_assignment_start_audit:r";
    const source=readFileSync(new URL("../scripts/apply-member-deferred-v32.ts",import.meta.url),"utf8");
    assert.ok(source.includes("CREATE TABLE IF NOT EXISTS public.smn_member_assignment_start_audit("));
    assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]));
    assert.notEqual(classifySnapshot({...valid,tables:[...names,relation]}).status,"schema-incompatible");
    assert.equal(classifySnapshot({...valid,tables:[...names,relation,"public.unexpected_member_table:r"]}).status,"schema-incompatible");
  });
});

describe("SMN-11 — diagnostic sans mutation", () => {
  it("reconnaît une base vierge sous PostgreSQL 18", async () => {
    assert.deepEqual(await diagnoseInstallation(async () => virgin), { status: "virgin", canEnterSetup: true });
  });
  it("reconnaît une installation versionnée avec migrations réussies", () => {
    assert.equal(classifySnapshot(valid).status, "installation-incomplete");
    assert.equal(classifySnapshot(valid).canEnterSetup, false);
  });
  it("refuse les objets étrangers, y compris vues, séquences et autres schémas", () => {
    for (const name of ["public.articles:r", "public.vue:v", "public.sequence:S", "other.orders:r", "other.<schema>"]) {
      assert.equal(classifySnapshot({ ...virgin, tables: [name] }).status, "schema-incompatible");
    }
    assert.equal(classifySnapshot({ ...virgin, tables: ["public._prisma_migrations:r"] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, tables: [...names, "public.unexpected_view:v"], tableRead: false }).status, "schema-incompatible");
  });
  it("reconnaît les tables internes de l'assistant et de replanification sans ouvrir le schéma aux objets étrangers", () => {
    for (const [relation, sourcePath] of [
      ["public.smn_sprint_wizard_preview:r", "src/server/sprints/wizard.ts"],
      ["public.smn_sprint_reschedule_audit:r", "scripts/apply-legacy-sprint-reschedule-audit.ts"],
    ]) {
      assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]));
      const source = readFileSync(new URL("../"+sourcePath, import.meta.url), "utf8");
      assert.match(source, new RegExp("CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+" + relation.slice(0,-2).replace(".", "\\."), "i"));
      const checked = classifySnapshot({ ...valid, tables: [...names, relation] });
      assert.notEqual(checked.status, "schema-incompatible", relation);
    }
    assert.equal(classifySnapshot({...valid,tables:[...names,"public.smn_sprint_wizard_preview:r","public.smn_sprint_reschedule_audit:r","public.unknown:r"]}).status,"schema-incompatible");
  });
  it("reconnaît les deux tables de scores de Sprint créées par SMN-234 D3 sans accepter de tables étrangères", () => {
    const source = readFileSync(
      new URL("../src/server/sprints/sprint-scores.ts", import.meta.url), "utf8"
    );
    const relations = [
      "public.smn_sprint_scores:r",
      "public.smn_sprint_scores_audit:r",
    ];
    for (const relation of relations) {
      assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]));
      assert.ok(source.includes("CREATE TABLE IF NOT EXISTS " + relation.slice(0, -2) + "("));
      assert.notEqual(classifySnapshot({ ...valid, tables: [...names, relation] }).status, "schema-incompatible");
    }
    assert.notEqual(classifySnapshot({ ...valid, tables: [...names, ...relations] }).status, "schema-incompatible");
    assert.equal(classifySnapshot({ ...valid, tables: [...names, ...relations, "public.foreign_table:r"] }).status, "schema-incompatible");
  });
  it("autorise uniquement les tables SMN créées par les modales de registre et de notes",()=>{
    const origins=[
      ["src/server/registries/items.ts",[
        "public.smn_registry_item:r","public.smn_registry_item_audit:r"
      ]],
      ["src/server/reports/draft-notes.ts",[
        "public.smn_report_draft:r","public.smn_report_draft_audit:r"
      ]]
    ] as const;
    const relations:string[]=[];
    for(const [path,expected] of origins){
      const source=registryDdlSource(path);
      for(const relation of expected){
        assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]));
        assert.ok(source.includes("CREATE TABLE IF NOT EXISTS "+relation.slice(0,-2)+"("));
        relations.push(relation);
      }
    }
    assert.notEqual(classifySnapshot({...valid,tables:[...names,...relations]}).status,"schema-incompatible");
    assert.equal(classifySnapshot({...valid,tables:[...names,...relations,"public.untrusted_table:r"]}).status,"schema-incompatible");
  });
  it("reconnaît les tables de notes Sprint et de liaisons de registres sans autoriser d'objets étrangers",()=>{
    const origins=[
      ["src/server/dashboard/notes.ts",[
        "public.smn_dashboard_note:r","public.smn_dashboard_note_audit:r"
      ]],
      ["src/server/registries/cycle-links.ts",[
        "public.smn_registry_cycle_link:r","public.smn_registry_cycle_link_audit:r"
      ]]
    ] as const;
    const relations:string[]=[];
    for(const [path,expected] of origins){
      const source=registryDdlSource(path);
      for(const relation of expected){
        assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]));
        assert.ok(source.includes("CREATE TABLE IF NOT EXISTS "+relation.slice(0,-2)+"("));
        relations.push(relation);
      }
    }
    assert.notEqual(classifySnapshot({...valid,tables:[...names,...relations]}).status,"schema-incompatible");
    assert.equal(classifySnapshot({...valid,tables:[...names,...relations,"public.third_party:r"]}).status,"schema-incompatible");
  });
  it("reconnaît les vrais agrégats de criticité et ROAM des risques",()=>{
    const origins=[
      ["src/server/registries/assessment.ts",[
        "public.smn_risk_assessment:r","public.smn_risk_assessment_audit:r"
      ]],
      ["src/server/registries/roam.ts",[
        "public.smn_risk_roam:r","public.smn_risk_roam_audit:r"
      ]]
    ] as const;
    for(const [path,expected] of origins){
      const source=registryDdlSource(path);
      for(const relation of expected){
        assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]));
        assert.ok(source.includes("CREATE TABLE IF NOT EXISTS "+relation.slice(0,-2)+"("));
      }
    }
  });
  it("refuse les installations partielles et versions futures inconnues", () => {
    assert.equal(classifySnapshot({ ...valid, migrations: [] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, migrations: [{ migration_name: "x", finished_at: null, rolled_back_at: null }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, tables: ["public.smn_installation:r"] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "pending", schema_version: 1 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 2 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 3 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 4 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 5 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 6 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 7 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, tables: [...names, "public.users:r"] }).status, "schema-incompatible");
  });
  it("distingue permissions de lecture et capacité future de création", () => {
    assert.equal(classifySnapshot({ ...virgin, schemaUsage: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...virgin, schemaCreate: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...virgin, schemaCreate: undefined }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...virgin, serverVersion: undefined }).status, "server-version-unsupported");
    assert.equal(classifySnapshot({ ...valid, tableRead: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...valid, schemaCreate: false }).status, "installation-incomplete");
  });
  it("rejette un PostgreSQL hors version qualifiée", () => {
    assert.equal(classifySnapshot({ ...virgin, serverVersion: 170006 }).status, "server-version-unsupported");
  });
  it("classe les échecs SQL sans révéler leurs détails", async () => {
    for (const [code, expected] of [
      ["3D000", "database-missing"], ["42501", "permissions-insufficient"],
      ["42703", "schema-incompatible"], ["42P01", "schema-incompatible"],
      ["28P01", "connection-error"], ["ECONNREFUSED", "connection-error"], ["ETIMEDOUT", "connection-error"],
    ]) {
      const failure = Object.assign(new Error("password=secret-should-not-leak"), { code });
      const diagnosed = await diagnoseInstallation(async () => { throw failure; });
      assert.equal(diagnosed.status, expected);
      assert.equal(JSON.stringify(diagnosed).includes("secret"), false);
      assert.equal(diagnosed.canEnterSetup, false);
    }
  });
  it("rejette les URL non locales, d'autres bases ou avec options", () => {
    for (const invalid of [
      "bad-uri", "postgresql://local:pass@localhost:5432/lmn24",
      "postgresql://local:pass@remote.example:5432/smn",
      "postgresql://local:pass@localhost:5432/smn?host=remote.example",
      "postgresql://local:pass@localhost:5432/smn?sslmode=disable",
    ]) assert.deepEqual(parseConnectionSettings(invalid), { ok: false, status: "configuration-invalid" });
    assert.deepEqual(parseConnectionSettings(undefined), { ok: false, status: "configuration-missing" });
    assert.equal(parseConnectionSettings("postgresql://local:pass@localhost:5432/smn").ok, true);
    assert.equal(parseConnectionSettings("postgresql://local:pass@[::1]:5432/smn_test").ok, true);
  });
});
