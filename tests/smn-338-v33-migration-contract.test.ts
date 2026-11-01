import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {decideUpgrade} from "../scripts/db-upgrade-policy";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("SMN-338 : v32 compatible et v33 idempotente",()=>{
 for(const n of [1,32])assert.equal(decideUpgrade("initialized",32,n).kind,"noop");
 for(const n of [2,33])assert.equal(decideUpgrade("initialized",33,n).kind,"noop");
 for(const n of [1,32])assert.equal(decideUpgrade("initialized",33,n).kind,"refuse");
});
test("SMN-338 : activation explicite avec sauvegarde et transaction",()=>{
 const script=read("scripts/apply-smn-338-v33.ts");
 assert.match(script,/SMN_V33_BACKUP_VERIFIED/);
 assert.match(script,/BEGIN/);
 assert.match(script,/ROLLBACK/);
 assert.match(script,/COMMIT/);
 assert.match(script,/INSERT INTO public\._prisma_migrations/);
 assert.match(script,/SET schema_version=33/);
 assert.match(script,/INDICATOR_TABLES/);
 assert.match(script,/Validation des 4 triggers/);
});
test("SMN-338 : diagnostic autorise v33 et exige signature de migration",()=>{
 const code=read("src/server/installation/diagnostic.ts");
 assert.match(code,/schema_version===33/);
 assert.match(code,/SMN338_V33_NAME/);
 assert.match(code,/v33\.checksum===createHash/);
 const relations=read("src/server/installation/contract.ts");
 for(const n of ["definition","team_selection","display_preference","manual_value","computed_result","dependency","cycle_revision","system_revision"])
  assert.ok(relations.includes("public.smn_indicator_"+n+":r"));
 for(const n of ["smn_indicator_assert_cycle_integrity","smn_indicator_assert_value_integrity",
  "smn_indicator_guard_cycle_team_change","smn_indicator_guard_definition_type_change"])
  assert.ok(relations.includes("public."+n+":function"));
 assert.match(read("src/server/db/probe.ts"),/indicatorV33SchemaValid/);
});
test("SMN-338 : baseline v33 candidate non activée",()=>{
 const code=read("scripts/build-smn-338-v33-baseline-candidate.ts");
 assert.match(code,/nativeInstallationEnabled:false/);
 assert.match(code,/nativeBaselineSql/);
 assert.match(code,/indicatorV33Sql/);
});

test("SMN-338 : tableaux SQL transmis comme un paramètre unique",()=>{
 const script=read("scripts/apply-smn-338-v33.ts");
 assert.match(script,/relname=ANY\(\$1::text\[\]\)"\s*,\s*\[\[\.\.\.required,\.\.\.INDICATOR_TABLES\]\]/);
 assert.match(script,/relname=ANY\(\$1::text\[\]\)"\s*,\s*\[INDICATOR_TABLES\]/);
});

test("SMN-338 : installation neuve v33 journalise deux migrations canoniques",()=>{
 const install=read("src/server/installation/install.ts");
 assert.match(install,/const indicatorSql=indicatorV33Sql\(\)/);
 assert.match(install,/await client\.query\(indicatorSql\)/);
 assert.match(install,/VALUES\('singleton','initialized',33\)/);
 assert.match(install,/SMN338_V33_NAME/);
 assert.match(install,/NATIVE_BASELINE_NAME/);
});

test("SMN-338 : le diagnostic valide les colonnes propres à chaque table, y compris system_revision",()=>{
 const probe=read("src/server/db/probe.ts");
 assert.match(probe,/system_revision:\["singleton_key","revision"\]/);
 assert.match(probe,/columns\.every\(c=>columnSet\.has/);
 assert.doesNotMatch(probe,/\["id","team_id","indicator_id"\]\.some/);
});
