import type {Client} from "pg";
import {validExportOperationId} from "./export-outcome";
/** Persist one completed export per client operation ID. Separate deliberate exports use new IDs.
 * Must be called in the same DB transaction as the final archive insert. */
export async function lockExportOperation(db:Client,operationId:string){
 if(!validExportOperationId(operationId))throw Error("retry-conflict");
 await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",[operationId]);
 const table=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS exists`);
 if(!table.rows[0]?.exists)return null;
 const columns=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='smn_report_pdf_archive'`);
 if(!columns.rows.some(x=>x.column_name==="operation_id"))return null;
 const previous=await db.query<{id:string;sha256:string}>(`SELECT id,sha256 FROM public.smn_report_pdf_archive WHERE operation_id=$1`,[operationId]);
 return previous.rows[0]??null;
}
