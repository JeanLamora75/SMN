import {assertHistoricalCsvTable} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export type CsvAttemptStatus="preview-valid"|"preview-refused"|"preview-cancelled"|"import-confirmed"|"import-refused";
export type CsvAttemptInput={actorId:string;status:CsvAttemptStatus;mode:string;scope:string;batchId?:string|null;readCount:number;recognizedCount:number;appliedCount:number;preservedCount:number;rejectedCount:number;cycleIds:string[];errors?:{line:number;column:string;message:string}[]};
export async function ensureCsvAttemptSchema(db:Client){
 await assertHistoricalCsvTable(db,"smn_historical_csv_attempt");
}
export async function recordCsvAttempt(db:Client,input:CsvAttemptInput){
 await ensureCsvAttemptSchema(db);
 const id=randomUUID();
 await db.query(`INSERT INTO public.smn_historical_csv_attempt
 (id,actor_id,status,mode,scope,batch_id,read_count,recognized_count,applied_count,preserved_count,rejected_count,cycle_ids,errors)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)`,[
 id,input.actorId,input.status,input.mode,input.scope,input.batchId??null,
 input.readCount,input.recognizedCount,input.appliedCount,input.preservedCount,input.rejectedCount,
 JSON.stringify([...new Set(input.cycleIds)]),JSON.stringify((input.errors??[]).slice(0,500))
 ]);
 return id;
}
export async function listCsvAttempts(db:Client){
 const exists=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_historical_csv_attempt') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return [];
 const r=await db.query(`SELECT id,created_at::text AS "createdAt",actor_id AS "actorId",status,mode,scope,
 batch_id AS "batchId",read_count AS "readCount",recognized_count AS "recognizedCount",
 applied_count AS "appliedCount",preserved_count AS "preservedCount",rejected_count AS "rejectedCount",
 cycle_ids AS "cycleIds",errors FROM public.smn_historical_csv_attempt
 ORDER BY created_at DESC,id DESC LIMIT 100`);
 return r.rows;
}
