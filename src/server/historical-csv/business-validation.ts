import type {Client} from "pg";
import type {CsvRow,CsvDiagnostic} from "@/lib/historical-csv-validator";
import type {HistoricalCsvMode} from "@/lib/historical-csv-contract";
const INTEGER_CODES=new Set(["SP_INITIAL","SP_ADDED","SP_REMOVED","SP_DONE","STARTED","THROUGHPUT","WIP_FINAL"]);
export function validateCsvBatchRules(rows:readonly CsvRow[],mode:HistoricalCsvMode,existingIds:ReadonlySet<string>):CsvDiagnostic[]{
 const errors:CsvDiagnostic[]=[],seen=new Map<string,number>();
 for(const row of rows){
  if(!existingIds.has(row.cycle_id))
   errors.push({line:row.line,column:"cycle_id",code:"cycle-not-found",message:"Cycle absent ou hors de l'installation."});
  const key=row.cycle_id+":"+row.metric_code,first=seen.get(key);
  if(first!==undefined){
   errors.push({line:first,column:"metric_code",code:"duplicate",message:"Doublon avec la ligne "+row.line+"."});
   errors.push({line:row.line,column:"metric_code",code:"duplicate",message:"Doublon avec la ligne "+first+"."});
  }else seen.set(key,row.line);
  if(INTEGER_CODES.has(row.metric_code)&&(!Number.isSafeInteger(row.value)||row.value>1000000000))
   errors.push({line:row.line,column:"value",code:"unit",message:"La métrique requiert un nombre entier positif ou nul."});
  if(mode==="kanban"&&["CYCLE_TIME_AVG","LEAD_TIME_AVG"].includes(row.metric_code)&&row.value>100000)
   errors.push({line:row.line,column:"value",code:"unit",message:"Durée moyenne en jours hors limites (0 à 100000)."});
 }
 return errors;
}
export async function validateHistoricalCsvBusiness(db:Client,rows:readonly CsvRow[],mode:HistoricalCsvMode):Promise<CsvDiagnostic[]>{
 if(!rows.length)return [];
 const table=mode==="scrum"?"smn_sprint":"smn_kanban_period";
 const ids=[...new Set(rows.map(r=>r.cycle_id))];
 const result=await db.query<{id:string}>(`SELECT c.id FROM public.${table} c
 JOIN public.smn_team t ON t.id=c.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)=$2
 AND c.deleted_at IS NULL AND c.id=ANY($1::text[])`,[ids,mode]);
 return validateCsvBatchRules(rows,mode,new Set(result.rows.map(r=>r.id)));
}
