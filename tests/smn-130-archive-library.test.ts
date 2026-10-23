import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {normalizeArchiveFilters,searchPdfArchives} from "../src/server/reports/archive-library";
test("filter inputs are strictly bounded",()=>{
 const f=normalizeArchiveFilters({cycleId:"../../escape",from:"yesterday",templateId:"a'.*",status:"all",page:999999});
 assert.equal(f.cycleId,null);assert.equal(f.from,null);assert.equal(f.templateId,null);assert.equal(f.status,null);assert.equal(f.page,1);
});
test("empty archive schema yields an empty library without creating files",async()=>{
 const sql:string[]=[];const db={query:async(q:string)=>{sql.push(q);return {rows:[{present:false}]};}} as unknown as Client;
 const x=await searchPdfArchives(db,{});
 assert.deepEqual(x,{items:[],total:0,page:1});
 assert.equal(sql.length,1);assert.match(sql[0],/^SELECT /);
});
