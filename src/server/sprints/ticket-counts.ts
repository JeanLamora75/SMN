import {randomUUID} from "node:crypto";
import type {Client} from "pg";

export type TicketCounts=Readonly<{initial:number|null;done:number|null}>;
type TicketRow={initial_tickets:string|null;done_tickets:string|null;revision:number};
const valid=(value:unknown)=>value===null||
 (typeof value==="number"&&Number.isSafeInteger(value)&&value>=0&&value<=1000000000);
const none:TicketCounts={initial:null,done:null};
const DB_TABLE="public.smn_sprint_ticket_counts";

async function inScope(db:Client,id:string,lock=false){
 const rows=await db.query<{id:string;status:string;name:string}>(`SELECT s.id,s.status,s.name
  FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
   AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))='scrum'
  ${lock?"FOR UPDATE OF s":""}`,[id]);
 return rows.rows[0]??null;
}
async function exists(db:Client){
 const r=await db.query<{present:boolean}>(
  "SELECT to_regclass($1) IS NOT NULL AS present",[DB_TABLE]);
 return r.rows[0]?.present===true;
}
function toCounts(row:TicketRow|undefined):TicketCounts{
 return {initial:row?.initial_tickets==null?null:Number(row.initial_tickets),
  done:row?.done_tickets==null?null:Number(row.done_tickets)};
}
/** La consultation n'exécute jamais de DDL ni de réconciliation d'état. */
export async function readSprintTickets(db:Client,id:string){
 const sprint=await inScope(db,id);
 if(!sprint)return null;
 if(!await exists(db))return {sprint,counts:none,revision:0};
 const rows=await db.query<TicketRow>(`SELECT initial_tickets::text,done_tickets::text,revision
  FROM ${DB_TABLE} WHERE sprint_id=$1`,[id]);
 return {sprint,counts:toCounts(rows.rows[0]),revision:rows.rows[0]?.revision??0};
}
/** Les tables agrégées et leur audit ne sont créés que sur une action
 * explicite de sauvegarde par un administrateur autorisé. */
async function ensureTickets(db:Client){
 await db.query("SELECT to_regclass('public.smn_sprint_ticket_counts') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("SELECT to_regclass('public.smn_sprint_ticket_counts_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
}
/** Deux nombres facultatifs indépendants des SP, aucune notion de ticket individuel. */
export async function writeSprintTickets(db:Client,actor:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="counts,revision,sprintId"||
  typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId)||
  !Number.isSafeInteger(v.revision)||Number(v.revision)<0||
  !v.counts||typeof v.counts!=="object"||Array.isArray(v.counts))
  return {ok:false as const,error:"invalid-input" as const};
 const counts=v.counts as Record<string,unknown>;
 if(Object.keys(counts).sort().join(",")!=="done,initial"||
  !valid(counts.initial)||!valid(counts.done))
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const sprint=await inScope(db,v.sprintId,true);
  if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(sprint.status==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  await ensureTickets(db);
  const old=await db.query<TicketRow>(`SELECT initial_tickets::text,done_tickets::text,revision
   FROM ${DB_TABLE} WHERE sprint_id=$1 FOR UPDATE`,[v.sprintId]);
  const prior=old.rows[0];
  if((prior?.revision??0)!==v.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  if(prior){
   await db.query(`UPDATE ${DB_TABLE}
    SET initial_tickets=$2,done_tickets=$3,updated_by=$4,
    updated_at=now(),revision=revision+1 WHERE sprint_id=$1`,
    [v.sprintId,counts.initial,counts.done,actor]);
  }else{
   await db.query(`INSERT INTO ${DB_TABLE}
    (sprint_id,initial_tickets,done_tickets,updated_by)
    VALUES($1,$2,$3,$4)`,[v.sprintId,counts.initial,counts.done,actor]);
  }
  await db.query(`INSERT INTO public.smn_sprint_ticket_counts_audit
    (id,sprint_id,before_values,after_values,actor_id)
    VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
   [randomUUID(),v.sprintId,prior?JSON.stringify(toCounts(prior)):null,
    JSON.stringify({initial:counts.initial,done:counts.done}),actor]);
  await db.query("COMMIT");
  return {ok:true as const,revision:Number(v.revision)+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
