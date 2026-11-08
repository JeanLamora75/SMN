import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {canAccess} from "../src/server/access-policy";
import {ChartStyleError} from "../src/server/reports/chart-style-contract";
import {applyChartStyleCommand} from "../src/server/reports/chart-style-store";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const scope={type:"collective",exists:true,inScope:true};
const settings={type:"settings",exists:true,inScope:true};
test("authenticated users may read global catalog, only admins may write",()=>{
 assert.equal(canAccess(admin,"read",scope),true);
 assert.equal(canAccess(user,"read",scope),true);
 assert.equal(canAccess(user,"write",settings),false);
 assert.equal(canAccess(admin,"write",settings),true);
 assert.equal(canAccess({...admin,is_active:false},"read",scope),false);
 assert.equal(canAccess({...admin,must_change_password:true},"read",scope),false);
});
test("chart style route requires authorization before PostgreSQL and checks JSON size",()=>{
 const route=readFileSync("src/app/api/admin/reports/chart-styles/route.ts","utf8");
 assert.match(route,/authorizeApi\(req,"read",readScope\)/);
 assert.match(route,/authorizeApi\(req,"write",writeScope\)/);
 assert.match(route,/readJsonObject\(req,16000\)/);
 assert.match(route,/withAuthDb\(/);
});
test("non-admin command is rejected before reading SQL or mutating database",async()=>{
 const fake={query:()=>{throw Error("database-must-not-be-called");}};
 await assert.rejects(
  applyChartStyleCommand(fake as never,{id:"account",role:"user"},{action:"delete",id:"personal-style",revision:1}),
  (e:unknown)=>e instanceof ChartStyleError&&e.code==="forbidden"
 );
});
