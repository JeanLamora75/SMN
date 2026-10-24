import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";
type Item={id:string;name:string;startOn:string;endOn:string;status:string;timeZone:string};
const token=(data:unknown)=>createHash("sha256").update(JSON.stringify(data)).digest("hex");
export function inspectDateChange(current:Item,startOn:string,endOn:string,others:Item[]){
 const valid=/^\d{4}-\d{2}-\d{2}$/.test(startOn)&&/^\d{4}-\d{2}-\d{2}$/.test(endOn)&&
  !Number.isNaN(Date.parse(startOn+"T00:00:00Z"))&&!Number.isNaN(Date.parse(endOn+"T00:00:00Z"))&&
  new Date(startOn+"T00:00:00Z").toISOString().slice(0,10)===startOn&&
  new Date(endOn+"T00:00:00Z").toISOString().slice(0,10)===endOn&&startOn<=endOn;
 const conflicts=valid?others.filter(p=>p.id!==current.id&&p.startOn<=endOn&&p.endOn>=startOn).map(p=>p.id):[];
 const before={startOn:current.startOn,endOn:current.endOn};
 const after={startOn,endOn};
 return {period:current,before,after,conflicts,canConfirm:valid&&conflicts.length===0,
  events:"preserve" as const,capacity:"unchanged" as const,
  warnings:valid?conflicts.length?["Période(s) en conflit"] :[]:["Bornes invalides"]};
}
async function read(db:Client,id:string){
 const row=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string;time_zone:string;team_id:string}>(`SELECT p.id,p.name,p.start_on::text,p.end_on::text,p.status,p.time_zone,p.team_id
 FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND lower(i.mode)='kanban' AND p.id=$1 AND p.deleted_at IS NULL FOR UPDATE OF p`,[id]);
 if(!row.rows.length)return null;
 const p=row.rows[0];
 const others=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string;time_zone:string}>(`SELECT id,name,start_on::text,end_on::text,status,time_zone FROM public.smn_kanban_period
 WHERE team_id=$1 AND id<>$2 AND deleted_at IS NULL`,[p.team_id,id]);
 const map=(x:typeof p):Item=>({id:x.id,name:x.name,startOn:x.start_on,endOn:x.end_on,status:x.status,timeZone:x.time_zone});
 return {period:map(p),teamId:p.team_id,others:others.rows.map(x=>map({...x,team_id:p.team_id}))};
}
export async function previewDateChange(db:Client,id:string,startOn:string,endOn:string){
 await ensureKanbanPeriodTables(db);
 await db.query("BEGIN");
 try{
  const record=await read(db,id);
  if(!record){await db.query("ROLLBACK");return null;}
  const preview=inspectDateChange(record.period,startOn,endOn,record.others);
  const result={...preview,previewToken:token({id,preview})};
  await db.query("COMMIT");return result;
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function applyDateChange(db:Client,id:string,actorId:string,input:{startOn:string;endOn:string;previewToken:string}){
 await ensureKanbanPeriodTables(db);
 await db.query("BEGIN");
 try{
  const record=await read(db,id);
  if(!record){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[record.teamId+":kanban-period"]);
  const preview=inspectDateChange(record.period,input.startOn,input.endOn,record.others);
  if(!preview.canConfirm||token({id,preview})!==input.previewToken){
   await db.query("ROLLBACK");return {ok:false as const,error:"stale-or-conflict"};
  }
  if(preview.before.startOn!==preview.after.startOn||preview.before.endOn!==preview.after.endOn){
   await db.query("UPDATE public.smn_kanban_period SET start_on=$2,end_on=$3 WHERE id=$1",[id,input.startOn,input.endOn]);
   await db.query(`INSERT INTO public.smn_kanban_period_audit(id,period_id,action,details,actor_id)
   VALUES($1,$2,'dates-corrected',$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify({before:preview.before,after:preview.after,events:"preserved",capacity:"unchanged"}),actorId]);
  }
  await db.query("COMMIT");return {ok:true as const,periodId:id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
