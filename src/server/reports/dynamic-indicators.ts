import type {Client} from "pg";

export type ReportIndicatorValue=Readonly<{
 id:string;tag:string;name:string;unit:string;source:"manual"|"computed";
 value:string|null;available:boolean;reason:string|null
}>;
export const parseReportIndicatorSelection=(raw:unknown):string[]|null=>{
 if(raw===undefined||raw===null)return null;
 if(raw==="")return [];
 if(typeof raw!=="string"||raw.length>4000)return null;
 const ids=raw.split(",");
 if(ids.length>50||ids.some(id=>!/^[a-f0-9-]{36}$/i.test(id))||new Set(ids).size!==ids.length)throw Error("invalid-report-indicator-selection");
 return ids;
};
/** One consistent read-only projection. Temporary selection never mutates team preferences. */
export async function readReportIndicatorProjection(db:Client,teamId:string,cycleType:"scrum"|"kanban",cycleId:string,selection:string[]|null=null):Promise<ReportIndicatorValue[]>{
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(teamId)||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(cycleId))throw Error("invalid-scope");
 const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 if(version.rows[0]?.schema_version!==33)return [];
 const table=cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
 const scope=await db.query("SELECT 1 FROM public."+table+" c JOIN public.smn_team t ON t.id=c.team_id WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL AND NOT t.is_archived AND t.agile_mode=$3",[cycleId,teamId,cycleType]);
 if(scope.rows.length!==1)throw Error("cycle-not-found");
 if(selection&&selection.length>50)throw Error("invalid-report-indicator-selection");
 const rows=await db.query<ReportIndicatorValue>(`
 SELECT d.id,d.tag,d.name,d.unit_short AS unit,d.indicator_type AS source,
 CASE WHEN d.indicator_type='manual' THEN m.value::text
      WHEN r.result_state='available' THEN r.value::text ELSE NULL END AS value,
 CASE WHEN d.indicator_type='manual' THEN m.value IS NOT NULL
      ELSE r.result_state='available' END AS available,
 CASE WHEN d.indicator_type='manual' THEN CASE WHEN m.value IS NULL THEN 'missing_source' ELSE NULL END
      ELSE COALESCE(r.unavailable_reason,CASE WHEN r.indicator_id IS NULL THEN 'missing_source' ELSE NULL END) END AS reason
 FROM public.smn_indicator_definition d
 JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true
 LEFT JOIN public.smn_indicator_display_preference p ON p.team_id=s.team_id AND p.indicator_id=d.id AND p.screen_key='reports'
 LEFT JOIN public.smn_indicator_manual_value m ON m.team_id=$1 AND m.cycle_type=$2 AND m.cycle_id=$3 AND m.indicator_id=d.id
 LEFT JOIN public.smn_indicator_computed_result r ON r.team_id=$1 AND r.cycle_type=$2 AND r.cycle_id=$3 AND r.indicator_id=d.id
 WHERE d.archived_at IS NULL AND
 ($4::text[] IS NOT NULL AND d.id=ANY($4::text[]) OR $4::text[] IS NULL AND COALESCE(p.is_visible,false)=true)
 ORDER BY CASE WHEN $4::text[] IS NOT NULL THEN array_position($4::text[],d.id) ELSE p.display_order END,d.tag,d.id
 LIMIT 51`,[teamId,cycleType,cycleId,selection]);
 if(rows.rows.length>50||selection&&rows.rows.length!==selection.length)throw Error("report-indicator-selection-unavailable");
 return rows.rows;
}
