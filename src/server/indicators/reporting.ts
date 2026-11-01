import type {Client} from "pg";
import type {ScreenKey} from "./catalog";

export type ReportIndicator=Readonly<{id:string;tag:string;name:string;unit:string;style:string;order:number}>;
export type ReportCycle=Readonly<{id:string;name:string;status:string;startAt?:string;endAt?:string;values:Record<string,string|null>}>;
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
 SELECT d.id,d.tag,d.name,d.unit_short AS unit,COALESCE(p.display_style,'number') AS style,COALESCE(p.display_order,0) AS "order"
 FROM public.smn_indicator_definition d
 JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true
 LEFT JOIN public.smn_indicator_display_preference p ON p.indicator_id=d.id AND p.team_id=s.team_id AND p.screen_key=$2
 WHERE d.archived_at IS NULL AND COALESCE(p.is_visible,true)=true
 ORDER BY COALESCE(p.display_order,0),d.tag,d.id LIMIT 100`,[teamId,screen]);
 const all=await db.query<{id:string;name:string;status:string;startAt:string;endAt:string}>(`
 SELECT id,name,status,${cycleType==="scrum"?"start_at":"start_on"}::text AS "startAt",${cycleType==="scrum"?"end_at":"end_on"}::text AS "endAt" FROM public.${table}
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
 // The operational cycle table must never substitute current values for frozen Scrum closures.
 if(screen==="cycle_list"&&cycleType==="scrum"){
  const closed=cycles.filter(c=>c.status==="closed").map(c=>c.id);
  if(closed.length){
   const snapshots=await db.query<{sprint_id:string;snapshot:unknown}>(`
     SELECT snap.sprint_id,snap.snapshot FROM public.smn_sprint_closure_snapshot snap
     JOIN public.smn_sprint s ON s.id=snap.sprint_id AND s.team_id=$1
     WHERE snap.sprint_id=ANY($2::text[])
     ORDER BY snap.sprint_id,snap.version DESC`,[teamId,closed]);
   const seen=new Set<string>();
   for(const row of snapshots.rows){
    if(seen.has(row.sprint_id))continue;
    seen.add(row.sprint_id);
    const obj=row.snapshot&&typeof row.snapshot==="object"&&!Array.isArray(row.snapshot)
     ?row.snapshot as Record<string,unknown>:null;
    const saved=Array.isArray(obj?.indicatorsV33)?obj.indicatorsV33:[];
    const frozen=new Map<string,string|null>();
    for(const item of saved){
     if(item&&typeof item==="object"&&"id" in item&&typeof item.id==="string"&&"value" in item)
      frozen.set(item.id,typeof item.value==="string"?item.value:null);
    }
    map.set(row.sprint_id,Object.fromEntries(indicatorIds.map(id=>[id,frozen.get(id)??null])));
   }
   // Closure without a v33 capture is unavailable, not an invitation to read live data.
   for(const id of closed)if(!seen.has(id))map.set(id,Object.fromEntries(indicatorIds.map(key=>[key,null])));
  }
 }
 return {columns:columns.rows,cycles:cycles.map(c=>({...c,values:map.get(c.id)!}))};
}
