import {assertDashboardTable} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";

const uuid=/^[a-f0-9-]{36}$/i;
export async function createDashboardNote(db:Client,actorId:string,raw:unknown){
 if(!actorId||!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false as const,error:"invalid-input" as const};
 const input=raw as Record<string,unknown>;
 if(Object.keys(input).sort().join(",")!=="sprintId,teamId,text"||
  typeof input.sprintId!=="string"||!uuid.test(input.sprintId)||
  typeof input.teamId!=="string"||!input.teamId||
  typeof input.text!=="string"||!input.text.trim()||input.text.trim().length>2000)
   return {ok:false as const,error:"invalid-input" as const};
 const sprintId=input.sprintId,teamId=input.teamId,text=input.text.trim();
 await db.query("BEGIN");
 try{
  const scope=await db.query<{id:string}>(`SELECT s.id FROM public.smn_sprint s
    JOIN public.smn_team t ON t.id=s.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
    AND s.status<>'closed' AND i.id='singleton' AND i.state='initialized'
    AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId,teamId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await assertDashboardTable(db,"smn_dashboard_note");
  await assertDashboardTable(db,"smn_dashboard_note_audit");
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_dashboard_note(id,sprint_id,team_id,body,created_by)
    VALUES($1,$2,$3,$4,$5)`,[id,sprintId,teamId,text,actorId]);
  await db.query(`INSERT INTO public.smn_dashboard_note_audit(id,note_id,action,actor_id,details)
    VALUES($1,$2,'created',$3,$4::jsonb)`,[randomUUID(),id,actorId,JSON.stringify({text})]);
  await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

/** Les notes appartiennent strictement au Sprint/équipe sélectionné. Aucun DDL en lecture. */
export async function readDashboardNote(db:Client,id:string,teamId:string,sprintId:string){
 if(!uuid.test(id)||!uuid.test(sprintId)||!teamId)return null;
 const r=await db.query<{id:string;body:string;status:string}>(`
  SELECT n.id,n.body,n.status FROM public.smn_dashboard_note n
  JOIN public.smn_sprint s ON s.id=n.sprint_id AND s.team_id=n.team_id
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE n.id=$1 AND n.team_id=$2 AND n.sprint_id=$3
    AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
    AND lower(i.mode)='scrum'`,[id,teamId,sprintId]);
 return r.rows[0]??null;
}

/** Correction et terminaison auditées ; aucune modification d'un Sprint clôturé. */
export async function updateDashboardNote(db:Client,actorId:string,id:string,raw:unknown){
 if(!actorId||!uuid.test(id)||!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false as const,error:"invalid-input" as const};
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).sort().join(",")!=="expectedBody,expectedStatus,sprintId,status,teamId,text"||
  typeof o.teamId!=="string"||typeof o.sprintId!=="string"||!uuid.test(o.sprintId)||
  typeof o.text!=="string"||!o.text.trim()||o.text.trim().length>2000||
  typeof o.expectedBody!=="string"||typeof o.expectedStatus!=="string"||
  !["open","done"].includes(String(o.status)))
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const found=await db.query<{id:string;body:string;status:string;sprint_status:string}>(`
   SELECT n.id,n.body,n.status,s.status AS sprint_status
   FROM public.smn_dashboard_note n JOIN public.smn_sprint s
     ON s.id=n.sprint_id AND s.team_id=n.team_id
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE n.id=$1 AND n.sprint_id=$2 AND n.team_id=$3
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
   AND s.deleted_at IS NULL FOR UPDATE OF n,s`,[id,o.sprintId,o.teamId]);
  const prev=found.rows[0];
  if(!prev){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(prev.sprint_status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  if(prev.body!==o.expectedBody||prev.status!==o.expectedStatus){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  const next={body:o.text.trim(),status:o.status as "open"|"done"};
  if(next.body!==prev.body||next.status!==prev.status){
   await assertDashboardTable(db,"smn_dashboard_note_edit_audit");
   await db.query("UPDATE public.smn_dashboard_note SET body=$2,status=$3 WHERE id=$1",
    [id,next.body,next.status]);
   await db.query(`INSERT INTO public.smn_dashboard_note_edit_audit
    (id,note_id,before_values,after_values,actor_id) VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
    [randomUUID(),id,JSON.stringify({body:prev.body,status:prev.status}),JSON.stringify(next),actorId]);
  }
  await db.query("COMMIT");
  return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
