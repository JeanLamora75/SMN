import type {Client} from "pg";

export type SprintGoalEvaluation=
 "not_evaluated"|"achieved"|"partially_achieved"|"not_achieved";
export type SprintDetailGoal=Readonly<{
 id:string;title:string;evaluation:SprintGoalEvaluation;
 comment:string|null;description?:string|null;historicalSource?:string|null;historicalRecordedAt?:string|null;revision:number;
}>;
export type SprintDetailGoals=
 |Readonly<{state:"available";items:readonly SprintDetailGoal[];
   source:"manual"|"closure-snapshot";snapshotVersion:number|null}>
 |Readonly<{state:"unavailable";reason:"schema-missing"|"history-missing"|"read-failed"}>;

const evaluationStates=new Set<SprintGoalEvaluation>([
 "not_evaluated","achieved","partially_achieved","not_achieved"
]);
function record(value:unknown):Record<string,unknown>|null{
 return value!==null&&typeof value==="object"&&!Array.isArray(value)?
  value as Record<string,unknown>:null;
}
function parseGoals(raw:unknown):readonly SprintDetailGoal[]|null{
 if(!Array.isArray(raw))return null;
 const goals:SprintDetailGoal[]=[];
 const seen=new Set<string>();
 for(const rawGoal of raw){
  const v=record(rawGoal);
  if(!v||typeof v.id!=="string"||!v.id||
   seen.has(v.id)||typeof v.title!=="string"||!v.title.trim()||
   typeof v.evaluation!=="string"||
   !evaluationStates.has(v.evaluation as SprintGoalEvaluation)||
   !Number.isSafeInteger(v.revision)||Number(v.revision)<1||
   v.comment!==null&&v.comment!==undefined&&typeof v.comment!=="string")
   return null;
  seen.add(v.id);
  goals.push({
   id:v.id,title:v.title,evaluation:v.evaluation as SprintGoalEvaluation,
   comment:typeof v.comment==="string"?v.comment:null,
   description:typeof v.description==="string"?v.description:null,
   historicalSource:typeof v.historicalSource==="string"?v.historicalSource:null,
   historicalRecordedAt:typeof v.historicalRecordedAt==="string"?v.historicalRecordedAt:null,
   revision:v.revision as number
  });
 }
 return goals;
}

/** Read-only detail projection, scoped to one installed Scrum team.
 * Never creates tables or refreshes a closure from current goals. */
export async function readSprintDetailGoals(
 db:Client,teamId:string,sprintId:string
):Promise<SprintDetailGoals|null>{
 const scope=await db.query<{status:string}>(`
  SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
 `,[sprintId,teamId]);
 const row=scope.rows[0];
 if(!row)return null;
 const closed=row.status==="closed";
 const table=closed?"smn_sprint_closure_snapshot":"smn_sprint_goal";
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass($1) IS NOT NULL AS present",["public."+table]);
 if(!exists.rows[0]?.present)
  return {state:"unavailable",reason:closed?"history-missing":"schema-missing"};
 if(closed){
  const snapshot=await db.query<{version:number;snapshot:unknown}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1
  `,[sprintId]);
  const latest=snapshot.rows[0];
  if(!latest||!Number.isSafeInteger(latest.version)||latest.version<1)
   return {state:"unavailable",reason:"history-missing"};
  const content=record(latest.snapshot);
  if(!content||!Array.isArray(content.goals))
   return {state:"unavailable",reason:"history-missing"};
  const items=parseGoals(content.goals);
  if(!items)return {state:"unavailable",reason:"read-failed"};
  return {state:"available",items,source:"closure-snapshot",
   snapshotVersion:latest.version};
 }
 const descriptionTable=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_sprint_historical_goal_detail') IS NOT NULL AS present");
 const descriptionColumn=descriptionTable.rows[0]?.present?
  `(SELECT h.description FROM public.smn_sprint_historical_goal_detail h WHERE h.goal_id=g.id) AS description,
   (SELECT h.source FROM public.smn_sprint_historical_goal_detail h WHERE h.goal_id=g.id) AS "historicalSource",
   (SELECT h.recorded_at::text FROM public.smn_sprint_historical_goal_detail h WHERE h.goal_id=g.id) AS "historicalRecordedAt"`:
  `NULL::text AS description,NULL::text AS "historicalSource",NULL::text AS "historicalRecordedAt"`;
 const rows=await db.query<{
  id:string;title:string;evaluation:string;comment:string|null;description:string|null;revision:number
 }>(`
  SELECT g.id,g.title,g.evaluation,g.comment,g.revision,${descriptionColumn}
  FROM public.smn_sprint_goal g WHERE g.sprint_id=$1 ORDER BY g.created_at,g.id
 `,[sprintId]);
 const items=parseGoals(rows.rows);
 return items?
  {state:"available",items,source:"manual",snapshotVersion:null}:
  {state:"unavailable",reason:"read-failed"};
}
