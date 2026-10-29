import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readReportTrends,validHistoryDepth} from "../src/server/reports/history-trends";
test("la profondeur autorisée va de 1 à 5",()=>{
 assert.equal(validHistoryDepth(1),true);assert.equal(validHistoryDepth(5),true);
 for(const n of [0,6,1.5,-2,NaN])assert.equal(validHistoryDepth(n),false);
});
test("la requête est bornée aux cycles clôturés antérieurs sans écriture",async()=>{
 const calls:Array<{sql:string;params:unknown[]|undefined}>=[];
 const db={query:async(sql:string,params?:unknown[])=>{calls.push({sql,params});
 if(sql.includes("AS \"teamId\""))return {rows:[{teamId:"team",startAt:"2026-10-24T09:00:00+02:00"}]};
 if(sql.includes("to_regclass"))return {rows:[{exists:true}]};
 return {rows:[]};
 }} as unknown as Client;
 const points=await readReportTrends(db,"id",3);
 assert.deepEqual(points,[]);
 const trend=calls.at(-1)!;
 assert.match(trend.sql,/s.status='closed'/);
 assert.match(trend.sql,/s.end_at<=\$3::timestamptz/);
 assert.match(trend.sql,/LIMIT \$4/);
 assert.equal(trend.params?.[3],3);
 assert.equal(calls.some(x=>/\b(?:INSERT|UPDATE|DELETE)\b/i.test(x.sql)),false);
});
