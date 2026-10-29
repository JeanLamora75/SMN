import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {parseTeamUpdate} from "../src/lib/team-form";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("v32 initialise le mode de chaque équipe et non une constante",()=>{
 const sql=read("prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql");
 assert.match(sql,/ADD COLUMN IF NOT EXISTS agile_mode/);
 assert.match(sql,/SET agile_mode=i\.mode/);
 assert.match(sql,/WHERE t\.installation_id=i\.id AND t\.agile_mode IS NULL/);
 assert.match(sql,/schema_version=32/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false/);
 assert.doesNotMatch(sql,/DELETE FROM|TRUNCATE|DROP TABLE/i);
});
test("édition accepte un changement de mode explicite",()=>{
 const input=parseTeamUpdate({teamId:"team_panda",revision:1,name:"Team Panda",productName:null,vision:null,productGoal:null,agileMode:"kanban"});
 assert.equal(input?.agileMode,"kanban");
});
test("le serveur interdit le changement de mode lorsqu'un cycle existe",()=>{
 const source=read("src/server/teams/write.ts");
 assert.match(source,/mode!==team\.agile_mode&&await hasEverHadCycle/);
 assert.match(source,/smn_sprint/);
 assert.match(source,/smn_kanban_period/);
});
