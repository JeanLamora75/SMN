import {assertHistoricalCsvTable} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {validateHistoricalCsv} from "@/lib/historical-csv-validator";
import {validateHistoricalCsvBusiness} from "./business-validation";
import {previewHistoricalCsv} from "./preview";
import {recordCsvAttempt} from "./attempts";
import type {HistoricalCsvMode} from "@/lib/historical-csv-contract";
const mappings={
 scrum:{SP_INITIAL:["smn_sprint_story_points","initial_sp"],SP_ADDED:["smn_sprint_story_points","added_sp"],SP_REMOVED:["smn_sprint_story_points","removed_sp"],SP_DONE:["smn_sprint_story_points","done_sp"]},
 kanban:{STARTED:["smn_kanban_flow_counts","started"],THROUGHPUT:["smn_kanban_flow_counts","throughput"],WIP_FINAL:["smn_kanban_flow_counts","wip_final"],CYCLE_TIME_AVG:["smn_kanban_timing","cycle_days"],LEAD_TIME_AVG:["smn_kanban_timing","lead_days"]}
} as const;
type Choice={line:number;decision:"keep"|"insert"|"replace";expectedValue:number|null};
export async function confirmHistoricalCsv(db:Client,actorId:string,csv:string,choices:Choice[]){
 const invalid=(error:string)=>({ok:false as const,error});
 if(!actorId||typeof csv!=="string"||!Array.isArray(choices)||
 choices.some(c=>!c||!Number.isSafeInteger(c.line)||!["keep","insert","replace"].includes(c.decision)||!(c.expectedValue===null||(typeof c.expectedValue==="number"&&Number.isFinite(c.expectedValue)))))return invalid("invalid-input");
 const seen=new Set<number>();
 for(const c of choices){if(seen.has(c.line))return invalid("duplicate-decision");seen.add(c.line);}
 await db.query("BEGIN");
 try{
  const installation=await db.query<{mode:string}>(`SELECT lower(mode) AS mode FROM public.smn_installation WHERE id='singleton' AND state='initialized' FOR UPDATE`);
  const mode=installation.rows[0]?.mode as HistoricalCsvMode;
  if(mode!=="scrum"&&mode!=="kanban"){await db.query("ROLLBACK");return invalid("unsupported-mode");}
  const parsed=validateHistoricalCsv(csv,mode);
  if(!parsed.valid){await db.query("ROLLBACK");return invalid("invalid-csv");}
  const errors=await validateHistoricalCsvBusiness(db,parsed.rows,mode);
  if(errors.length){await db.query("ROLLBACK");return invalid("invalid-batch");}
  const cycleTable=mode==="scrum"?"smn_sprint":"smn_kanban_period";
  const ids=[...new Set(parsed.rows.map(p=>p.cycle_id))];
  const cycles=await db.query<{id:string;status:string}>(`SELECT id,status FROM public.${cycleTable} WHERE id=ANY($1::text[]) FOR UPDATE`,[ids]);
  if(cycles.rows.length!==ids.length||cycles.rows.some(c=>c.status==="closed")){await db.query("ROLLBACK");return invalid("closed-or-missing-cycle");}
  const preview=await previewHistoricalCsv(db,parsed.rows,mode);
  if(choices.length!==preview.length||choices.some(c=>!preview.some(p=>p.line===c.line))){await db.query("ROLLBACK");return invalid("incomplete-decisions");}
  // No implicit overwrite: reject changed values and decisions that disagree with the current database.
  for(const row of preview){
   const choice=choices.find(x=>x.line===row.line)!;
   const expected=row.existingValue===null?"insert":"keep";
   if(choice.expectedValue!==row.existingValue){await db.query("ROLLBACK");return invalid("stale-preview");}
   if(choice.decision==="insert"&&expected!=="insert"||
      choice.decision==="replace"&&expected!=="keep"||
      choice.decision==="keep"&&expected==="insert"){await db.query("ROLLBACK");return invalid("stale-preview");}
  }
  const batchId=randomUUID();
  await assertHistoricalCsvTable(db,"smn_historical_csv_batch");
  await assertHistoricalCsvTable(db,"smn_historical_csv_change");
  await assertHistoricalCsvTable(db,"smn_historical_csv_change");
  await assertHistoricalCsvTable(db,"smn_historical_csv_change");
  await db.query("INSERT INTO public.smn_historical_csv_batch(id,mode,actor_id) VALUES($1,$2,$3)",[batchId,mode,actorId]);
  let inserted=0,replaced=0,preserved=0;
  for(const row of preview){
   const choice=choices.find(x=>x.line===row.line)!;
   if(choice.decision==="keep"){preserved++;continue;}
   const [table,column]=(mappings[mode] as Record<string,readonly [string,string]>)[row.metricCode];
   const fk=mode==="scrum"?"sprint_id":"period_id";
   // Preserve all other columns. No closure snapshot or PDF is ever written.
   await db.query(`INSERT INTO public.${table}(${fk},${column}) VALUES($1,$2)
    ON CONFLICT(${fk}) DO UPDATE SET ${column}=EXCLUDED.${column}`,[row.cycleId,row.value]);
   const previousRevision=await db.query<{quality:string}>(`SELECT quality FROM public.smn_historical_csv_change
    WHERE cycle_id=$1 AND metric_code=$2 ORDER BY changed_at DESC,id DESC LIMIT 1`,[row.cycleId,row.metricCode]);
   await db.query(`INSERT INTO public.smn_historical_csv_change
    (id,batch_id,cycle_id,metric_code,previous_value,next_value,quality,action,actor_id,source_line,previous_quality)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[
    randomUUID(),batchId,row.cycleId,row.metricCode,row.existingValue,row.value,row.quality,
    choice.decision,actorId,row.line,previousRevision.rows[0]?.quality??null]);
   if(choice.decision==="replace")replaced++;else inserted++;
  }
  const attemptId=await recordCsvAttempt(db,{actorId,status:"import-confirmed",mode,scope:"historical-csv",batchId,readCount:preview.length,recognizedCount:preview.length,appliedCount:inserted+replaced,preservedCount:preserved,rejectedCount:0,cycleIds:preview.filter(r=>choices.find(x=>x.line===r.line)?.decision!=="keep").map(r=>r.cycleId)});
  await db.query("COMMIT");
  return {ok:true as const,batchId,attemptId,inserted,replaced,preserved};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
