import type {Client} from "pg";
import type {ScreenKey} from "./catalog";

export type ReportIndicator=Readonly<{id:string;tag:string;name:string;unit:string;style:string;order:number}>;
export type ReportCycle=Readonly<{id:string;name:string;status:string;values:Record<string,string|null>}>;
export type ReportData=Readonly<{columns:ReportIndicator[];cycles:ReportCycle[]}>;

/** Configured selections are authoritative; there is no implicit Fxx catalogue. */
export async function readIndicatorReporting(db:Client,teamId:string,screen:ScreenKey,cycleType:"scrum"|"kanban",cycleIds?:readonly string[]):Promise<ReportData>{
 if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(teamId)||!["cycle_list","dashboard","cycle_detail","trends","reports"].includes(screen)||!["scrum","kanban"].includes(cycleType))throw Error("invalid-input");
 const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 if(version.rows[0]?.schema_version!==33)return {columns:[],cycles:[]};
 const table=cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
 const team=await db.query("SELECT 1 FROM public.smn_team WHERE id=$1 AND installation_id='singleton' AND agile_mode=$2 AND NOT is_archived",[teamId,cycleType]);
 if(team.rows.length!==1)throw Error("team-not-found");
 const columns=await db.query<{id:string;tag:string;name:string;unit:string;style:string;order:number}>(`
 SELECT d.id,d.tag,d.name,d.unit_short AS unit,p.display_style AS style,p.display_order AS "order"
 FROM public.smn_indicator_definition d
 JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true
 JOIN public.smn_indicator_display_preference p ON p.indicator_id=d.id AND p.team_id=s.team_id
 WHERE d.archived_at IS NULL AND p.screen_key=$2 AND p.is_visible=true
 ORDER BY p.display_order,d.tag,d.id LIMIT 100`,[teamId,screen]);
 const all=await db.query<{id:string;name:string;status:string}>(`
 SELECT id,name,status FROM public.${table}
 WHERE team_id=$1 AND deleted_at IS NULL
 ORDER BY ${cycleType==="scrum"?"start_at":"start_on"},id LIMIT 10001`,[teamId]);
 if(all.rows.length>10000)throw Error("reporting-cycle-budget");
 const cycles=cycleIds?all.rows.filter(c=>cycleIds.includes(c.id)):all.rows;
 if(cycles.length===0||columns.rows.length===0)return {columns:columns.rows,cycles:cycles.map(c=>({...c,values:{}}))};
 const ids=cycles.map(c=>c.id),indicatorIds=columns.rows.map(c=>c.id);
 const [manual,computed]=await Promise.all([
 db.query<{cycle_id:string;indicator_id:string;value:string|null}>("SELECT cycle_id,indicator_id,value::text AS value FROM public.smn_indicator_manual_value WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=ANY($3::text[]) AND indicator_id=ANY($4::text[])",[teamId,cycleType,ids,indicatorIds]),
 db.query<{cycle_id:string;indicator_id:string;value:string|null}>("SELECT cycle_id,indicator_id,CASE WHEN result_state='available' THEN value::text ELSE NULL END AS value FROM public.smn_indicator_computed_result WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=ANY($3::text[]) AND indicator_id=ANY($4::text[])",[teamId,cycleType,ids,indicatorIds])
 ]);
 const map=new Map(cycles.map(c=>[c.id,Object.fromEntries(columns.rows.map(d=>[d.id,null])) as Record<string,string|null>]));
 for(const item of [...manual.rows,...computed.rows])map.get(item.cycle_id)![item.indicator_id]=item.value;
 return {columns:columns.rows,cycles:cycles.map(c=>({...c,values:map.get(c.id)!}))};
}
