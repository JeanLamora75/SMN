import {assertKanbanSchema} from "./schema-ready";
import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {canonicalJson} from "@/server/reports/render-reference";
import {selectedKanbanAnalyses} from "./report-analysis-choices";
import {composeKanbanReport,selectKanbanReportSections} from "./report-preparation";
export type FrozenKanbanPayload={data:NonNullable<Awaited<ReturnType<typeof composeKanbanReport>>>;sections:string[];language:"fr"|"en";chosenAnalyses?:Awaited<ReturnType<typeof selectedKanbanAnalyses>>};
export function hashKanbanPayload(payload:FrozenKanbanPayload){
 return createHash("sha256").update(canonicalJson(payload),"utf8").digest("hex");
}
export async function ensureKanbanRenderReference(db:Client){
 await assertKanbanSchema(db,"smn_kanban_render_reference");
}
export async function createKanbanRenderReference(db:Client,periodId:string,actorId:string,sections:string[],language:"fr"|"en"){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(periodId))return null;
 const chosen=selectKanbanReportSections(sections);
 if(!chosen.length)return null;
 await ensureKanbanRenderReference(db);
 const data=await composeKanbanReport(db,periodId);
 if(!data)return null;
 await db.query("BEGIN");
 try{
  const chosenAnalyses=await selectedKanbanAnalyses(db,periodId);
  const payload:FrozenKanbanPayload={data,sections:chosen,language,chosenAnalyses};
  const id=randomUUID(),sha256=hashKanbanPayload(payload);
  await db.query(`INSERT INTO public.smn_kanban_render_reference
   (id,period_id,created_by,sha256,payload) VALUES($1,$2,$3,$4,$5::jsonb)`,
   [id,periodId,actorId,sha256,canonicalJson(payload)]);
  await db.query("COMMIT");
  return {id,periodId,sha256,payload};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readKanbanRenderReference(db:Client,periodId:string,id:string){
 if(!/^[a-f0-9-]{36}$/i.test(periodId)||!/^[a-f0-9-]{36}$/i.test(id))return null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_kanban_render_reference') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return null;
 const result=await db.query<{id:string;period_id:string;sha256:string;payload:FrozenKanbanPayload}>(`
 SELECT r.id,r.period_id,r.sha256,r.payload FROM public.smn_kanban_render_reference r
 JOIN public.smn_kanban_period p ON p.id=r.period_id JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND r.period_id=$2 AND p.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'`,[id,periodId]);
 const ref=result.rows[0];
 if(!ref||hashKanbanPayload(ref.payload)!==ref.sha256||ref.payload.data.period.id!==periodId)return null;
 return {id:ref.id,periodId,sha256:ref.sha256,payload:ref.payload};
}
