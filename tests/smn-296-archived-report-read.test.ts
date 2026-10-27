import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {assertAdminArchivedReportRead} from "../src/server/teams/archived-report-read";

test("un utilisateur non admin est rejeté sans requête SQL",async()=>{
 const db={query:async()=>{throw Error("unexpected-query");}} as unknown as Client;
 await assert.rejects(()=>assertAdminArchivedReportRead(db,
  {accountId:"user_1",role:"user"},"team_a"),/archive-team-forbidden/);
});
test("une équipe absente du périmètre historique est refusée",async()=>{
 const calls:unknown[][]=[];
 const db={query:async(_sql:string,args:unknown[])=>{
  calls.push(args);return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>assertAdminArchivedReportRead(db,
  {accountId:"admin_1",role:"admin"},"team_a"),/archive-team-unavailable/);
 assert.deepEqual(calls,[["team_a","admin_1"]]);
});
