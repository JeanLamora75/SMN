import type {Client} from "pg";
import {registerKinds,isRegisterKind,type RegisterSource,type RegisterKind}
 from "@/lib/sprint-registers";

type Period={id:string;startAt:string;endAt:string;timeZone?:string};
type RegistryRow={id:string;type:RegisterKind;title:string;status:string;
 date:Date|string;openedAt:Date|string;closedAt:Date|string|null;
 sprintIds:string[];priority:string|null};
type AutomaticRow={id:string;title:string;date:Date|string;sprintIds:string[]};

const instant=(raw:unknown):string|null=>{
 if(raw instanceof Date)return Number.isFinite(raw.getTime())?raw.toISOString():null;
 if(typeof raw!=="string")return null;
 const parsed=Date.parse(raw);
 return Number.isFinite(parsed)?new Date(parsed).toISOString():null;
};
/** Stored business dates are local to the Sprint timezone, not server midnight UTC. */
function localDateInstant(date:string,zone:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const base=Date.parse(date+"T00:00:00Z");
 if(!Number.isFinite(base))return null;
 try{
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",
   month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  for(let offset=-14*60;offset<=14*60;offset+=15){
   const instant=new Date(base+offset*60000);
   const p=Object.fromEntries(parts.formatToParts(instant).map(x=>[x.type,x.value]));
   if(p.year+"-"+p.month+"-"+p.day===date&&p.hour==="00"&&p.minute==="00")
    return instant.toISOString();
  }
 }catch{return null;}
 return null;
}
const businessDate=(raw:unknown,zone:string)=>typeof raw==="string"?
 localDateInstant(raw,zone):null;
const safeItems=(raw:unknown)=>Array.isArray(raw)?raw:null;
const asRecord=(raw:unknown):Record<string,unknown>|null=>
 raw!==null&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:null;

/** Snapshot SMN-111 writes `qualitative`: explicit cycle links + selected facts. */
export function qualitativeSnapshotSource(raw:unknown,teamId:string,sprint:Period):RegisterSource|null{
 const doc=asRecord(raw);
 if(!doc||typeof doc.state!=="string"||!["captured","no-cycle-links","not-installed"].includes(doc.state))return null;
 if(doc.state==="not-installed")return {availableKinds:[],records:[],linkedMembership:true};
 const items=safeItems(doc.items),facts=safeItems(doc.facts);
 if(!items||!facts)return null;
 const zone=sprint.timeZone??"UTC";
 const records:unknown[]=[];
 const ids=new Set<string>();
 for(const rawItem of items){
  const row=asRecord(rawItem);
  if(!row||!isRegisterKind(row.type)||typeof row.id!=="string"||
    typeof row.title!=="string"||typeof row.status!=="string")return null;
  const date=businessDate(row.occurredOn,zone);
  if(!date)return null;
  const key=row.type+":"+row.id;
  if(ids.has(key))return null;
  ids.add(key);
  records.push({id:row.id,kind:row.type,title:row.title,status:row.type==="highlight"?null:row.status,
   priority:null,date,openedAt:row.type==="decision"||row.type==="highlight"?null:date,
   closedAt:null,teamIds:[teamId],sprintIds:[sprint.id],href:null});
 }
 for(const rawFact of facts){
  const row=asRecord(rawFact);
  if(!row||row.origin!=="automatic"||row.hidden===true||row.invalidated===true)continue;
  if(typeof row.id!=="string"||typeof row.title!=="string")return null;
  const date=businessDate(row.effectiveOn,zone)??instant(row.recordedAt);
  if(!date)return null;
  const key="highlight:"+row.id;
  if(ids.has(key))continue;
  ids.add(key);
  records.push({id:row.id,kind:"highlight",title:row.title,status:null,
   priority:null,date,openedAt:null,closedAt:null,teamIds:[teamId],
   sprintIds:[sprint.id],href:null});
 }
 return {availableKinds:[...registerKinds],records,linkedMembership:true};
}

/** Official Epic 5 adapter: scope first, optional sources by installation, SELECT only. */
export async function readEpic5SprintRegisterSource(
 db:Client,teamId:string,sprint:Period
):Promise<RegisterSource>{
 const installed=await db.query<{items:boolean;links:boolean;audit:boolean;
  assess:boolean;automatic:boolean;selection:boolean;invalidated:boolean;goals:boolean}>(`
 SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS items,
 to_regclass('public.smn_registry_cycle_link') IS NOT NULL AS links,
 to_regclass('public.smn_registry_item_audit') IS NOT NULL AS audit,
 to_regclass('public.smn_risk_assessment') IS NOT NULL AS assess,
 to_regclass('public.smn_automatic_highlight') IS NOT NULL AS automatic,
 to_regclass('public.smn_sprint_goal') IS NOT NULL AS goals,
 to_regclass('public.smn_fact_selection') IS NOT NULL AS selection,
 EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public'
 AND table_name='smn_automatic_highlight' AND column_name='invalidated_at') AS invalidated`);
 const s=installed.rows[0];
 if(!s?.items)return {availableKinds:[],records:[]};
 const linked=s.links?`ARRAY(SELECT l.sprint_id FROM public.smn_registry_cycle_link l
  JOIN public.smn_sprint sp ON sp.id=l.sprint_id
  WHERE l.item_id=r.id AND sp.team_id=$1 AND sp.deleted_at IS NULL)`:
  "ARRAY[]::text[]";
 const terminal=`(r.type='risk' AND r.status='resolved') OR
 (r.type='obstacle' AND r.status IN ('resolved','abandoned')) OR
 (r.type='dependency' AND r.status IN ('satisfied','cancelled')) OR
 (r.type='action' AND r.status IN ('completed','cancelled'))`;
 const closed=s.audit?`CASE WHEN (${terminal}) THEN
  (SELECT MAX(a.changed_at) FROM public.smn_registry_item_audit a
    WHERE a.item_id=r.id AND a.after_values->>'status'=r.status
    AND (a.before_values IS NULL OR
     a.before_values->>'status' IS DISTINCT FROM a.after_values->>'status'))
  ELSE NULL::timestamptz END`:"NULL::timestamptz";
 const assessment=s.assess?`CASE WHEN r.type='risk' AND ra.probability IS NOT NULL
  AND ra.impact IS NOT NULL THEN CASE
   WHEN ra.probability*ra.impact<=2 THEN 'low'
   WHEN ra.probability*ra.impact<=4 THEN 'medium' ELSE 'high' END
  ELSE NULL::text END`:"NULL::text";
 const assessmentJoin=s.assess?"LEFT JOIN public.smn_risk_assessment ra ON ra.item_id=r.id":"";
 // The period is scoped by the caller; source rows stay team-only.
 const rows=await db.query<RegistryRow>(`
 SELECT r.id,r.type,r.title,r.status,
 (r.occurred_on::timestamp AT TIME ZONE $2) AS date,
 (r.occurred_on::timestamp AT TIME ZONE $2) AS "openedAt",
 ${closed} AS "closedAt",${linked} AS "sprintIds",
 ${assessment} AS priority
 FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 ${assessmentJoin}
 WHERE r.team_id=$1 AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='scrum'
 ORDER BY r.occurred_on,r.id LIMIT 10001`,
 [teamId,sprint.timeZone??"UTC"]);
 if(rows.rows.length>10000)throw Error("sprint-registers-source-limit");
 const records:unknown[]=rows.rows.map(row=>({
  id:row.id,kind:row.type,title:row.title,status:row.type==="highlight"?null:row.status,
  priority:row.priority,date:instant(row.date),openedAt:row.type==="decision"||
   row.type==="highlight"?null:instant(row.openedAt),
  closedAt:row.type==="decision"||row.type==="highlight"?null:
   row.closedAt===null?null:instant(row.closedAt),
  teamIds:[teamId],sprintIds:row.sprintIds??[],
  href:"/app/admin/registries/"+encodeURIComponent(row.id)
 }));
 // Recorded highlights from Epic 5 are distinct from manually created highlights.
 if(s.automatic){
  const selected=s.selection?`LEFT JOIN public.smn_fact_selection fs
   ON fs.origin='automatic' AND fs.fact_id=h.id`:"";
  const selectClause=s.selection?
   "AND COALESCE(fs.hidden,false)=false AND COALESCE(fs.selected,true)=true":"";
  const invalidated=s.invalidated?"AND h.invalidated_at IS NULL":"";
  const links=s.links?`ARRAY(SELECT l.sprint_id FROM public.smn_registry_cycle_link l
   WHERE l.item_id=h.source_id AND l.sprint_id=$2)`:"ARRAY[]::text[]";
  const automatic=await db.query<AutomaticRow>(`
   SELECT h.id,h.title,h.created_at AS date,${links} AS "sprintIds"
   FROM public.smn_automatic_highlight h
   JOIN public.smn_registry_item r ON r.id=h.source_id
   JOIN public.smn_team t ON t.id=r.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   ${selected}
   WHERE h.source_kind='registry' AND r.team_id=$1
    AND i.id='singleton' AND i.state='initialized'
    ${invalidated} ${selectClause}
   ORDER BY h.created_at,h.id LIMIT 10001`,s.links?[teamId,sprint.id]:[teamId]);
  if(automatic.rows.length>10000)throw Error("sprint-highlights-source-limit");
  records.push(...automatic.rows.map(row=>({
   id:row.id,kind:"highlight",title:row.title,status:null,priority:null,
   date:instant(row.date),openedAt:null,closedAt:null,teamIds:[teamId],
   sprintIds:row.sprintIds??[],href:null
  })));
  if(s.goals){
   // Goal-based highlights belong to their explicit Sprint, not to every
   // current or past cycle of the same team.
   const goalRows=await db.query<AutomaticRow>(`
    SELECT h.id,h.title,h.created_at AS date,
     ARRAY[g.sprint_id]::text[] AS "sprintIds"
    FROM public.smn_automatic_highlight h
    JOIN public.smn_sprint_goal g ON g.id=h.source_id
    JOIN public.smn_sprint sp ON sp.id=g.sprint_id
    JOIN public.smn_team t ON t.id=sp.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    ${selected}
    WHERE h.source_kind='goal' AND sp.team_id=$1
     AND sp.id=$2 AND sp.deleted_at IS NULL
     AND i.id='singleton' AND i.state='initialized'
     ${invalidated} ${selectClause}
    ORDER BY h.created_at,h.id LIMIT 10001`,[teamId,sprint.id]);
   if(goalRows.rows.length>10000)throw Error("sprint-goal-highlights-source-limit");
   records.push(...goalRows.rows.map(row=>({
    id:row.id,kind:"highlight",title:row.title,status:null,priority:null,
    date:instant(row.date),openedAt:null,closedAt:null,teamIds:[teamId],
    sprintIds:row.sprintIds??[],href:null
   })));
  }
 }
 return {availableKinds:[...registerKinds],records,linkedMembership:true};
}
