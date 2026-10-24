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
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_dashboard_note(
    id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id),
    team_id text NOT NULL REFERENCES public.smn_team(id),
    body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 2000),
    status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),
    created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now())`);
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_dashboard_note_audit(
    id text PRIMARY KEY,note_id text NOT NULL REFERENCES public.smn_dashboard_note(id),
    action text NOT NULL CHECK(action IN ('created','done')),
    actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL)`);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_dashboard_note(id,sprint_id,team_id,body,created_by)
    VALUES($1,$2,$3,$4,$5)`,[id,sprintId,teamId,text,actorId]);
  await db.query(`INSERT INTO public.smn_dashboard_note_audit(id,note_id,action,actor_id,details)
    VALUES($1,$2,'created',$3,$4::jsonb)`,[randomUUID(),id,actorId,JSON.stringify({text})]);
  await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
