import {assertKanbanSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {readKanbanCadence} from "./cadence";
import {nextDay,periodFromStart,normalizePeriodName} from "./dates";

export {nextDay,periodFromStart} from "./dates";
export async function ensureKanbanPeriodTables(db:Client){
 await assertKanbanSchema(db,"smn_kanban_period");
 await assertKanbanSchema(db,"smn_kanban_period");
 await assertKanbanSchema(db,"smn_kanban_period");
 
 await assertKanbanSchema(db,"smn_kanban_period_audit");
}
async function kanbanTeam(db:Client){
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='kanban'`);
 if(r.rows.length!==1)throw Error("kanban-team-unavailable");
 return r.rows[0].id;
}
export async function prepareKanbanPeriod(db:Client){
 const cadence=await readKanbanCadence(db);
 await ensureKanbanPeriodTables(db);
 const id=await kanbanTeam(db);
 const latest=await db.query<{end_on:string}>(`SELECT end_on::text FROM public.smn_kanban_period
 WHERE team_id=$1 AND deleted_at IS NULL ORDER BY end_on DESC LIMIT 1`,[id]);
 return {cadence,quantity:1 as const,startOn:latest.rows.length?nextDay(latest.rows[0].end_on):null};
}
export async function createKanbanPeriod(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const data=raw as Record<string,unknown>;
 if(Object.keys(data).some(k=>!["startOn","name"].includes(k))||typeof data.startOn!=="string")
  return {ok:false as const,error:"invalid-input"};
 const cadence=await readKanbanCadence(db);
 let period:ReturnType<typeof periodFromStart>;
 try{period=periodFromStart(data.startOn,cadence.frequency);}
 catch{return {ok:false as const,error:"invalid-start"};}
 const name=data.name===undefined?period.name:normalizePeriodName(data.name);
 if(!name)return {ok:false as const,error:"invalid-name"};
 await ensureKanbanPeriodTables(db);
 const teamId=await kanbanTeam(db);
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId+":kanban-period"]);
  const clash=await db.query(`SELECT id FROM public.smn_kanban_period
    WHERE team_id=$1 AND deleted_at IS NULL AND start_on<=$3::date AND end_on>=$2::date LIMIT 1`,
    [teamId,period.startOn,period.endOn]);
  if(clash.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"overlap"};}
  const duplicate=await db.query(`SELECT id FROM public.smn_kanban_period WHERE team_id=$1 AND deleted_at IS NULL AND lower(name)=lower($2) LIMIT 1`,[teamId,name]);
  const duplicateName=duplicate.rows.length>0;
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_kanban_period
   (id,team_id,name,start_on,end_on,time_zone,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [id,teamId,name,period.startOn,period.endOn,cadence.timeZone,actorId]);
  await db.query(`INSERT INTO public.smn_kanban_period_audit
   (id,period_id,action,details,actor_id) VALUES($1,$2,'created',$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify({...period,name,cadenceRevision:cadence.revision}),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,period:{id,...period,name,status:"planned" as const},duplicateName};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
