import {assertKanbanSchema} from "./schema-ready";
import {assertKanbanSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {scopedKanbanPeriod,type KanbanTeamAccess} from "@/server/kanban/scoped-period";
import {ensureKanbanPeriodTables} from "./periods";

export const goalEvaluations=["not_evaluated","achieved","partially_achieved","not_achieved"] as const;
export type GoalEvaluation=typeof goalEvaluations[number];
export function parseKanbanGoal(raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["id","title","description","evaluation","comment","revision"].includes(k))||
 typeof v.title!=="string"||!v.title.trim()||v.title.trim().length>240||
 typeof v.description!=="string"||v.description.trim().length>4000||
 typeof v.evaluation!=="string"||!goalEvaluations.includes(v.evaluation as GoalEvaluation)||
 v.comment!==null&&v.comment!==undefined&&(typeof v.comment!=="string"||v.comment.length>2000))return null;
 if(v.id!==undefined&&(typeof v.id!=="string"||!/^[a-f0-9-]{36}$/i.test(v.id)||!Number.isSafeInteger(v.revision)||Number(v.revision)<1))return null;
 if(v.id===undefined&&v.evaluation!=="not_evaluated")return null;
 return {id:v.id as string|undefined,title:v.title.trim(),description:v.description.trim(),
  evaluation:v.evaluation as GoalEvaluation,comment:(v.comment as string|null|undefined)??null,revision:v.revision as number|undefined};
}
export async function ensureKanbanGoals(db:Client){
 await ensureKanbanPeriodTables(db);
 await assertKanbanSchema(db,"smn_kanban_goal");
 await assertKanbanSchema(db,"smn_kanban_goal_audit");
}
export async function readKanbanGoals(db:Client,periodId:string,access?:KanbanTeamAccess){
 await ensureKanbanGoals(db);
 const p=await scopedKanbanPeriod(db,periodId,false,access);
 if(!p)return null;
 const r=await db.query(`SELECT id,title,description,evaluation,comment,revision,updated_at::text AS "updatedAt"
 FROM public.smn_kanban_goal WHERE period_id=$1 ORDER BY created_at,id`,[periodId]);
 return {periodStatus:p.status,goals:r.rows};
}
export async function saveKanbanGoal(db:Client,actorId:string,periodId:string,raw:unknown,access?:KanbanTeamAccess){
 const value=parseKanbanGoal(raw);
 if(!value)return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanGoals(db);
 await db.query("BEGIN");
 try{
  const p=await scopedKanbanPeriod(db,periodId,true,access,actorId);
  if(!p){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(p.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  const id=value.id??randomUUID();
  let before:Record<string,unknown>|null=null;
  if(value.id){
   const r=await db.query<{id:string;title:string;description:string;evaluation:string;comment:string|null;revision:number}>(`SELECT id,title,description,evaluation,comment,revision
    FROM public.smn_kanban_goal WHERE id=$1 AND period_id=$2 FOR UPDATE`,[id,periodId]);
   if(!r.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
   if(r.rows[0].revision!==value.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
   before=r.rows[0];
   await db.query(`UPDATE public.smn_kanban_goal SET title=$2,description=$3,evaluation=$4,
    comment=$5,revision=revision+1,updated_at=now() WHERE id=$1`,
    [id,value.title,value.description,value.evaluation,value.comment]);
  }else{
   await db.query(`INSERT INTO public.smn_kanban_goal(id,period_id,title,description,evaluation,comment,created_by)
    VALUES($1,$2,$3,$4,'not_evaluated',$5,$6)`,
    [id,periodId,value.title,value.description,value.comment,actorId]);
  }
  await db.query(`INSERT INTO public.smn_kanban_goal_audit(id,goal_id,before_values,after_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),id,before?JSON.stringify(before):null,
    JSON.stringify({title:value.title,description:value.description,evaluation:value.evaluation,comment:value.comment}),actorId]);
  await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
