import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintGoalsSchema} from "./goals";
import {ensureSprintReviewSchema} from "./review-analysis";
export type HistoricalPartialInput={sprintId:string;goalTitle?:string;goalDescription?:string;reviewComment?:string;source?:string};
export function parseHistoricalPartial(raw:unknown):HistoricalPartialInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const x=raw as Record<string,unknown>;
 if(Object.keys(x).some(k=>!["sprintId","goalTitle","goalDescription","reviewComment","source"].includes(k))||
 typeof x.sprintId!=="string"||!/^[a-f0-9-]{36}$/i.test(x.sprintId)||
 ["goalTitle","goalDescription","reviewComment","source"].some(k=>x[k]!==undefined&&typeof x[k]!=="string")||
 (typeof x.goalTitle==="string"&&x.goalTitle.trim().length>240)||
 (typeof x.goalDescription==="string"&&x.goalDescription.length>2000)||
 (typeof x.reviewComment==="string"&&x.reviewComment.length>3000)||
 (typeof x.source==="string"&&x.source.length>500))return null;
 const goalTitle=typeof x.goalTitle==="string"?x.goalTitle.trim():"";
 const reviewComment=typeof x.reviewComment==="string"?x.reviewComment.trim():"";
 if(!goalTitle&&!reviewComment)return null;
 if(!goalTitle&&x.goalDescription)return null;
 return {sprintId:x.sprintId,goalTitle:goalTitle||undefined,
  goalDescription:typeof x.goalDescription==="string"?x.goalDescription:undefined,
  reviewComment:reviewComment||undefined,source:typeof x.source==="string"?x.source.trim():undefined};
}
export async function saveHistoricalPartial(db:Client,actor:string,raw:unknown){
 const x=parseHistoricalPartial(raw);
 if(!actor||!x)return {ok:false as const,error:"invalid-input"};
 await ensureSprintGoalsSchema(db);
 await db.query("SELECT to_regclass('public.smn_sprint_historical_goal_detail') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("BEGIN");
 try{
  const res=await db.query<{status:string}>(`SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
  AND lower(i.mode)='scrum' FOR UPDATE OF s`,[x.sprintId]);
  if(!res.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(res.rows[0].status!=="finished"){await db.query("ROLLBACK");return {ok:false as const,error:"ineligible-sprint"};}
  let goalId:string|null=null;
  if(x.goalTitle){
   goalId=randomUUID();
   await db.query(`INSERT INTO public.smn_sprint_goal(id,sprint_id,title,evaluation,comment,created_by)
   VALUES($1,$2,$3,'not_evaluated',NULL,$4)`,[goalId,x.sprintId,x.goalTitle,actor]);
   await db.query(`INSERT INTO public.smn_sprint_historical_goal_detail(goal_id,description,source,recorded_by)
   VALUES($1,$2,$3,$4)`,[goalId,x.goalDescription??null,x.source??null,actor]);
   await db.query(`INSERT INTO public.smn_sprint_goal_audit(id,goal_id,previous_values,next_values,actor_id)
   VALUES($1,$2,NULL,$3::jsonb,$4)`,[randomUUID(),goalId,JSON.stringify({title:x.goalTitle,evaluation:"not_evaluated",description:x.goalDescription??null,provenance:"historical-documented",source:x.source??null}),actor]);
  }
  if(x.reviewComment){
   await ensureSprintReviewSchema(db);
   const old=await db.query<{revision:number;body:string|null}>(`SELECT revision,body
   FROM public.smn_sprint_review_analysis WHERE sprint_id=$1 AND kind='manual' FOR UPDATE`,[x.sprintId]);
   if(old.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"review-already-present"};}
   await db.query(`INSERT INTO public.smn_sprint_review_analysis
   (sprint_id,kind,body,revision,origin,human_edited,updated_by)
   VALUES($1,'manual',$2,1,'human',true,$3)`,[x.sprintId,x.reviewComment,actor]);
   await db.query(`INSERT INTO public.smn_sprint_review_analysis_audit
   (id,sprint_id,kind,previous_values,next_values,actor_id)
   VALUES($1,$2,'manual',NULL,$3::jsonb,$4)`,[randomUUID(),x.sprintId,JSON.stringify({body:x.reviewComment,revision:1,origin:"human",provenance:"historical-documented",source:x.source??null}),actor]);
  }
  await db.query("COMMIT");return {ok:true as const,goalId,reviewSaved:Boolean(x.reviewComment)};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
