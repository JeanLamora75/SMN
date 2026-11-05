import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {nativeV33BaselineSql} from "../src/server/installation/native-v33";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("v33 teams: canonical schema enforces tenant-scoped products and unique team names",()=>{
 const sql=nativeV33BaselineSql();
 assert.ok(sql);
 const teams=sql.match(/CREATE TABLE "public"\."smn_team" \(([\s\S]*?)\n\);/);
 assert.ok(teams);
 assert.match(teams[1],/"product_id"\s+"text"/);
 assert.doesNotMatch(teams[1],/"product_id"\s+"text"\s+NOT NULL/);
 for(const constraint of ["smn_team_product_same_installation_fk","smn_team_installation_name_ci_key",
   "smn_team_product_id_key","smn_team_context_audit"])
  assert.ok(sql.includes(constraint),"Missing team isolation constraint: "+constraint);
 const prisma=read("prisma/schema.prisma");
 const product=prisma.split("model SmnProduct {")[1]?.split("\n}")[0];
 const team=prisma.split("model SmnTeam {")[1]?.split("\n}")[0];
 assert.ok(product&&team);
 assert.match(product,/installationId String @map\("installation_id"\)/);
 assert.match(product,/team SmnTeam\?/);
 assert.match(team,/installationId String @map\("installation_id"\)/);
 assert.match(team,/productId String\? @unique @map\("product_id"\)/);
 assert.match(team,/product SmnProduct\?/);
});

test("v33 teams: multi-team protections remain enforced by server authorization",()=>{
 const source=read("src/server/teams/resolve.ts");
 assert.match(source,/team-access-forbidden|team-scope-forbidden|team-not-found|team-archived|smn_account_team_preference/);
 const sql=nativeV33BaselineSql();
 assert.ok(sql);
 assert.match(sql,/smn_team_product_same_installation_fk/);
});
