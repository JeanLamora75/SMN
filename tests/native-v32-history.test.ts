import {test} from "node:test";
import {strict as assert} from "node:assert";
import {createHash} from "node:crypto";
import {nativeV32HistoryValid,NATIVE_V32_NAME} from "../src/server/installation/native-v32";
import type {Snapshot} from "../src/server/installation/diagnostic";

const sql='CREATE TABLE "smn_installation" (); CREATE TABLE "smn_account" (); CREATE TABLE "smn_team" ("agile_mode" text);';
const row={migration_name:NATIVE_V32_NAME,checksum:createHash("sha256").update(sql).digest("hex"),finished_at:new Date(),rolled_back_at:null};
const sample={installations:[{id:"singleton",state:"initialized",schema_version:32}],migrations:[row],shapeValid:true,
 teamAgileModeSchemaValid:true,tableRead:true,migrationsRead:true} as unknown as Snapshot;
test("historique natif v32 : checksum et migration uniques requis",()=>{
 assert.equal(nativeV32HistoryValid(sample,sql),true);
 assert.equal(nativeV32HistoryValid(sample,null),false);
 assert.equal(nativeV32HistoryValid(sample,sql+" "),false);
 assert.equal(nativeV32HistoryValid({...sample,migrations:[row,row]},sql),false);
 assert.equal(nativeV32HistoryValid({...sample,migrations:[{...row,finished_at:null}]},sql),false);
});
test("une structure ou une version incohérente est refusée",()=>{
 assert.equal(nativeV32HistoryValid({...sample,teamAgileModeSchemaValid:false},sql),false);
 assert.equal(nativeV32HistoryValid({...sample,installations:[{id:"singleton",state:"initialized",schema_version:31}]},sql),false);
});
