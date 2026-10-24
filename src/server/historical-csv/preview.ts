import type {Client} from "pg";
import type {CsvRow} from "@/lib/historical-csv-validator";
import type {HistoricalCsvMode} from "@/lib/historical-csv-contract";
const sources={
 scrum:{SP_INITIAL:["smn_sprint_story_points","initial_sp"],SP_ADDED:["smn_sprint_story_points","added_sp"],SP_REMOVED:["smn_sprint_story_points","removed_sp"],SP_DONE:["smn_sprint_story_points","done_sp"]},
 kanban:{STARTED:["smn_kanban_flow_counts","started"],THROUGHPUT:["smn_kanban_flow_counts","throughput"],WIP_FINAL:["smn_kanban_flow_counts","wip_final"],CYCLE_TIME_AVG:["smn_kanban_timing","cycle_days"],LEAD_TIME_AVG:["smn_kanban_timing","lead_days"]}
} as const;
export type PreviewRow={line:number;cycleId:string;cycleName:string|null;metricCode:string;value:number;quality:"known"|"estimated";existingValue:number|null;impact:"preserved"|"new";validation:"valid"};
/** Only SELECT statements; neither migrations nor target values are changed by a preview. */
export async function previewHistoricalCsv(db:Client,rows:readonly CsvRow[],mode:HistoricalCsvMode):Promise<PreviewRow[]>{
 const cycleTable=mode==="scrum"?"smn_sprint":"smn_kanban_period";
 const ids=[...new Set(rows.map(r=>r.cycle_id))];
 const cycles=await db.query<{id:string;name:string}>(`SELECT c.id,c.name FROM public.${cycleTable} c
 JOIN public.smn_team t ON t.id=c.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)=$2
 AND c.deleted_at IS NULL AND c.id=ANY($1::text[])`,[ids,mode]);
 const names=new Map(cycles.rows.map(x=>[x.id,x.name]));
 const tableNames=[...new Set(Object.values(sources[mode]).map(x=>x[0]))];
 const present=new Map<string,boolean>();
 for(const table of tableNames){
  const r=await db.query<{present:boolean}>("SELECT to_regclass($1) IS NOT NULL AS present",["public."+table]);
  present.set(table,r.rows[0]?.present??false);
 }
 const cache=new Map<string,number|null>();
 const result:PreviewRow[]=[];
 for(const item of rows){
  const mapping=(sources[mode] as Record<string,readonly [string,string]>)[item.metric_code];
  if(!mapping)continue;
  const [table,column]=mapping;
  const cacheKey=item.cycle_id+"|"+item.metric_code;
  let existing=cache.get(cacheKey);
  if(existing===undefined){
   existing=null;
   if(present.get(table)&&names.has(item.cycle_id)){
    const fk=mode==="scrum"?"sprint_id":"period_id";
    const found=await db.query<{value:string|null}>(`SELECT ${column}::text AS value FROM public.${table} WHERE ${fk}=$1`,[item.cycle_id]);
    const raw=found.rows[0]?.value;
    existing=raw==null?null:Number(raw);
   }
   cache.set(cacheKey,existing);
  }
  result.push({line:item.line,cycleId:item.cycle_id,cycleName:names.get(item.cycle_id)??null,
   metricCode:item.metric_code,value:item.value,quality:item.quality,existingValue:existing,
   impact:existing===null?"new":"preserved",validation:"valid"});
 }
 return result;
}
