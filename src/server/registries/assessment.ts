import {randomUUID} from "node:crypto";
import {riskCriticalEvent} from "./confirmed-highlights";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {criticality,validLevel,type Level} from "@/lib/risk-criticality";
export async function ensureRiskAssessment(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_risk_assessment(
 item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
 probability smallint CHECK(probability BETWEEN 1 AND 3),
 impact smallint CHECK(impact BETWEEN 1 AND 3),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_risk_assessment_audit(
 id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
 revision integer NOT NULL,old_values jsonb,new_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(item_id,revision))`);
}
export async function saveRiskAssessment(db:Client,actorId:string,id:string,raw:unknown,
 scope?:Readonly<{actor:TeamActor;teamId:string}>){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="impact,probability,revision"||
  !(v.probability===null||validLevel(v.probability))||
  !(v.impact===null||validLevel(v.impact))||
  !Number.isSafeInteger(v.revision)||Number(v.revision)<0||
  !/^[0-9a-f-]{36}$/i.test(id)||!actorId)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const team=scope?await resolveAdminTeam(db,scope.actor,scope.teamId):null;
  if(scope&&scope.actor.accountId!==actorId)throw Error("team-access-forbidden");
  const scopedRecord=await db.query(`SELECT r.id FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='risk' AND i.id='singleton' AND i.state='initialized'
    AND ($2::text IS NULL OR r.team_id=$2)
    AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false FOR UPDATE OF r`,[id,team?.team_id??null]);
  if(scopedRecord.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await ensureRiskAssessment(db);
  const prev=await db.query<{probability:Level|null;impact:Level|null;revision:number}>(`
   SELECT probability,impact,revision FROM public.smn_risk_assessment WHERE item_id=$1 FOR UPDATE`,[id]);
  const old=prev.rows[0];
  if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  const revision=(old?.revision??0)+1;
  if(old)await db.query(`UPDATE public.smn_risk_assessment SET
   probability=$2,impact=$3,revision=$4,updated_by=$5,updated_at=now() WHERE item_id=$1`,
   [id,v.probability,v.impact,revision,actorId]);
  else await db.query(`INSERT INTO public.smn_risk_assessment(item_id,probability,impact,revision,updated_by)
   VALUES($1,$2,$3,1,$4)`,[id,v.probability,v.impact,actorId]);
  await db.query(`INSERT INTO public.smn_risk_assessment_audit
   (id,item_id,revision,old_values,new_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
   [randomUUID(),id,revision,old?JSON.stringify({probability:old.probability,impact:old.impact}):null,
    JSON.stringify({probability:v.probability,impact:v.impact}),actorId]);
  if(criticality(v.probability as Level|null,v.impact as Level|null).level==="high"&&(old===undefined||criticality(old.probability,old.impact).level!=="high"))await riskCriticalEvent(db,id,actorId,revision);
  await db.query("COMMIT");
  return {ok:true as const,id,revision,...criticality(v.probability as Level|null,v.impact as Level|null)};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readRiskAssessment(db:Client,id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const has=await db.query<{yes:boolean}>(`SELECT to_regclass('public.smn_risk_assessment') IS NOT NULL AS yes`);
 const rows=await db.query<{probability:Level|null;impact:Level|null;revision:number|null}>(has.rows[0]?.yes?
  `SELECT a.probability,a.impact,a.revision FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   LEFT JOIN public.smn_risk_assessment a ON a.item_id=r.id
   WHERE r.id=$1 AND r.type='risk' AND i.id='singleton' AND i.state='initialized'`:
  `SELECT NULL::smallint AS probability,NULL::smallint AS impact,NULL::integer AS revision
   FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='risk' AND i.id='singleton' AND i.state='initialized'`,[id]);
 const item=rows.rows[0];
 return item?{probability:item.probability,impact:item.impact,revision:item.revision??0,
  ...criticality(item.probability,item.impact)}:null;
}
