import type {Client} from "pg";
import {readReportIndicatorProjection} from "@/server/reports/dynamic-indicators";
import type {BriefMode} from "@/lib/ai-brief-templates";

export type BriefIndicatorValue={tag:string;value:string|null;unit:string;source:string;available:boolean;reason:string|null};
/** Shares the report projection and its team/cycle access rules, never re-calculates indicators. */
export async function readBriefIndicatorValues(db:Client,teamId:string,mode:BriefMode,cycleId:string)
 :Promise<BriefIndicatorValue[]>{
 const result=await db.query<{id:string}>(`
  SELECT d.id::text FROM public.smn_indicator_definition d
  JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1
  WHERE s.is_active=true AND d.archived_at IS NULL ORDER BY d.tag,d.id LIMIT 51`,[teamId]);
 if(result.rows.length>50)throw Error("ai-brief-indicator-selection-too-large");
 if(!result.rows.length)return [];
 const projected=await readReportIndicatorProjection(db,teamId,mode,cycleId,result.rows.map(x=>x.id));
 return projected.map(x=>({tag:x.tag,value:x.value,unit:x.unit,source:x.source,available:x.available,reason:x.reason}));
}
