import type {Client} from "pg";
import {loadDependencyGraph,evaluateDependencies} from "./dependencies";
import {validateManualWrite,readManualCycleValues,type ManualWrite} from "./manual-values";
import {requireIndicatorTeam} from "./team-access";
import type {TeamActor} from "../teams/resolve";

export async function previewIndicatorInput(db:Client,actor:TeamActor,input:ManualWrite){
 if(!validateManualWrite(input))throw Error("invalid-input");
 await requireIndicatorTeam(db,actor,input.teamId);
 const table=input.cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
 const cycle=await db.query("SELECT c.id FROM public."+table+" c JOIN public.smn_team t ON t.id=c.team_id WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL AND NOT t.is_archived AND t.agile_mode=$3",[input.cycleId,input.teamId,input.cycleType]);
 if(cycle.rows.length!==1)throw Error("not-found");
 const existing=await readManualCycleValues(db,input.teamId,input.cycleType,input.cycleId);
 if(existing.revision!==input.expectedRevision)throw Error("conflict");
 const allowed=await db.query<{id:string}>("SELECT d.id FROM public.smn_indicator_definition d JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true WHERE d.id=ANY($2::text[]) AND d.indicator_type='manual' AND d.archived_at IS NULL",[input.teamId,input.changes.map(c=>c.indicatorId)]);
 if(allowed.rows.length!==input.changes.length)throw Error("indicator-unavailable");
 const graph=await loadDependencyGraph(db);
 const sources:Record<string,string|null>=Object.create(null) as Record<string,string|null>;
 for(const row of existing.values)sources[row.indicator_id]=row.value;
 for(const change of input.changes)sources[change.indicatorId]=change.value;
 const computed=evaluateDependencies({graph,indicators:sources,calendar:{}}); 
 return {revision:existing.revision,results:[...computed].map(([indicatorId,value])=>({indicatorId,...value})),warnings:[] as string[]};
}
