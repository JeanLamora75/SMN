import {qualitativeSnapshotSource} from "@/server/registries/sprint-adapter";
import type {Client} from "pg";
import type {SprintContextItem} from "@/lib/sprint-context";
type SprintRegisterPeriod=Pick<SprintContextItem,"id"|"startAt"|"endAt"> & {timeZone?:string};
import {
 isRegisterKind,selectSprintRegisterPage,
 type RegisterSource,type RegisterKind,type SprintRegisterResult
} from "@/lib/sprint-registers";

/** The registry subsystem will supply this port once its canonical schema,
 * team visibility and cross-Sprint relation rules are implemented.
 * The port MUST scope its result to authorized team members and records. */
export type RegistryReadProvider=(
 db:Client,teamId:string,sprint:SprintRegisterPeriod
)=>Promise<RegisterSource>;
const absent=(reason:Extract<SprintRegisterResult,{state:"unavailable"}>["reason"])=>
 ({state:"unavailable" as const,reason});

/** This reader never synthesizes qualitative items from unrelated tables.
 * Closed Sprints only use their immutable closure snapshot. */
export async function readSprintRegisters(
 db:Client,teamId:string,sprint:SprintRegisterPeriod,page=1,
 provider?:RegistryReadProvider,kind?:RegisterKind|null
):Promise<SprintRegisterResult|null>{
 const scope=await db.query<{status:string}>(`
  SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
    AND i.id='singleton' AND i.state='initialized'\n    AND CASE WHEN i.schema_version=29\n     THEN (to_jsonb(t)->>'agile_mode') ELSE lower(i.mode) END='scrum'
 `,[sprint.id,teamId]);
 if(!scope.rows[0])return null;
 if(scope.rows[0].status==="closed"){
  const installed=await db.query<{present:boolean}>(`
   SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present`);
  if(!installed.rows[0]?.present)return absent("history-missing");
  const result=await db.query<{version:number;snapshot:unknown}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprint.id]);
  const latest=result.rows[0];
  if(!latest||!Number.isSafeInteger(latest.version)||latest.version<1)
   return absent("history-missing");
  const snapshot=latest.snapshot;
  if(!snapshot||typeof snapshot!=="object"||Array.isArray(snapshot))
   return absent("invalid-data");
  const body=snapshot as Record<string,unknown>;
  const raw=body.qualitative??body.qualitativeRegisters;
  if(raw===undefined)return absent("history-missing");
  // New Epic 5 closures store qualitative.{items,facts}; older D8 snapshots
  // may already contain the provisional {records,availableKinds} contract.
  const derived=body.qualitative!==undefined?
   qualitativeSnapshotSource(raw,teamId,sprint):null;
  const data=raw&&typeof raw==="object"&&!Array.isArray(raw)?
   raw as Record<string,unknown>:null;
  const source=derived??(data&&Array.isArray(data.records)&&Array.isArray(data.availableKinds)?
   {records:data.records,availableKinds:data.availableKinds as RegisterKind[]}:null);
  if(!source)return absent("invalid-data");
  if(source.availableKinds.length===0)return absent("history-missing");
  if(source.availableKinds.some(k=>!isRegisterKind(k)))return absent("invalid-data");
  const selected=selectSprintRegisterPage(source,teamId,sprint,page,kind);
  if(!selected)return absent("invalid-data");
  return {state:"available",source:"closure-snapshot",
   snapshotVersion:latest.version,...selected};
 }
 if(!provider)return absent("producer-not-installed");
 // No tables or APIs are guessed: the six Epic 5 registers must supply an
 // authorized typed adapter. A partial adapter is signalled as incomplete.
 const data=await provider(db,teamId,sprint);
 if(data.availableKinds.length===0)return absent("producer-not-installed");
 const selected=selectSprintRegisterPage(data,teamId,sprint,page,kind);
 if(!selected)return absent("invalid-data");
 return {state:"available",source:"current",snapshotVersion:null,...selected};
}
