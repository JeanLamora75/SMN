import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {validateHistoricalCsv} from "@/lib/historical-csv-validator";
import {validateCsvBatchRules} from "./business-validation";
import {recalculateIndicatorResultsWithinTransaction} from "@/server/indicators/recalculation";
import {recordCsvAttempt} from "./attempts";
import {assertHistoricalCsvTable} from "./schema-ready";
import type {HistoricalCsvMode} from "@/lib/historical-csv-contract";

export type CsvV33Mapping={code:string;indicatorId:string};
export type CsvV33Request={teamId:string;mode:HistoricalCsvMode;csv:string;mappings:CsvV33Mapping[]};
export type CsvV33Choice={line:number;decision:"keep"|"insert"|"replace";expectedValue:string|null};
type Preview={line:number;cycleId:string;cycleName:string;metricCode:string;indicatorId:string;value:number;quality:"known"|"estimated";existingValue:string|null;decision:"keep"|"insert"};
const reject=(error:string)=>({ok:false as const,error});
function valid(input:CsvV33Request){
 return input&&typeof input.teamId==="string"&&/^[A-Za-z0-9_-]{1,80}$/.test(input.teamId)&&
 (input.mode==="scrum"||input.mode==="kanban")&&typeof input.csv==="string"&&
 Array.isArray(input.mappings)&&input.mappings.length>0&&input.mappings.length<=30&&
 input.mappings.every(x=>x&&typeof x.code==="string"&&typeof x.indicatorId==="string"&&
 /^[a-f\d-]{36}$/i.test(x.indicatorId))&&
 new Set(input.mappings.map(x=>x.code)).size===input.mappings.length&&
 new Set(input.mappings.map(x=>x.indicatorId)).size===input.mappings.length;
}
async function collect(db:Client,input:CsvV33Request,lock=false){
 if(!valid(input))return reject("invalid-input");
 const parsed=validateHistoricalCsv(input.csv,input.mode);
 if(!parsed.valid)return reject("invalid-csv");
 const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 if(version.rows[0]?.schema_version!==33)return reject("v33-required");
 const team=await db.query("SELECT id FROM public.smn_team WHERE id=$1 AND installation_id='singleton' AND agile_mode=$2 AND COALESCE(is_archived,false)=false",[input.teamId,input.mode]);
 if(team.rows.length!==1)return reject("team-not-found");
 const codes=new Map(input.mappings.map(x=>[x.code,x.indicatorId]));
 if(parsed.rows.some(r=>!codes.has(r.metric_code)))return reject("mapping-incomplete");
 const ids=input.mappings.map(m=>m.indicatorId);
 const selected=await db.query<{id:string}>(`SELECT d.id FROM public.smn_indicator_definition d
 JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true
 WHERE d.id=ANY($2::text[]) AND d.indicator_type='manual' AND d.archived_at IS NULL`,[input.teamId,ids]);
 if(selected.rows.length!==ids.length)return reject("indicator-unavailable");
 const table=input.mode==="scrum"?"smn_sprint":"smn_kanban_period";
 const cycles=await db.query<{id:string;name:string;status:string}>(`SELECT c.id,c.name,c.status FROM public.${table} c
 WHERE c.team_id=$1 AND c.deleted_at IS NULL AND c.id=ANY($2::text[])
 ${lock?"FOR UPDATE":""}`,[input.teamId,[...new Set(parsed.rows.map(x=>x.cycle_id))]]);
 const errors=validateCsvBatchRules(parsed.rows,input.mode,new Set(cycles.rows.map(r=>r.id)));
 if(errors.length)return reject("invalid-batch");
 if(cycles.rows.some(c=>c.status==="closed"))return reject("closed-period");
 const revisions=await db.query<{cycle_id:string;indicator_id:string;value:string|null}>(`
 SELECT cycle_id,indicator_id,value::text FROM public.smn_indicator_manual_value
 WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=ANY($3::text[]) AND indicator_id=ANY($4::text[])`,[input.teamId,input.mode,cycles.rows.map(c=>c.id),ids]);
 const existing=new Map(revisions.rows.map(r=>[r.cycle_id+"|"+r.indicator_id,r.value]));
 const names=new Map(cycles.rows.map(r=>[r.id,r.name]));
 const preview:Preview[]=parsed.rows.map(row=>{
  const indicatorId=codes.get(row.metric_code)!;
  const current=existing.get(row.cycle_id+"|"+indicatorId)??null;
  return {line:row.line,cycleId:row.cycle_id,cycleName:names.get(row.cycle_id)??"",
   metricCode:row.metric_code,indicatorId,value:row.value,quality:row.quality,
   existingValue:current,decision:current===null?"insert":"keep"};
 });
 return {ok:true as const,preview};
}
export async function previewCsvV33(db:Client,input:CsvV33Request){
 return collect(db,input);
}
export async function confirmCsvV33(db:Client,actorId:string,input:CsvV33Request,choices:CsvV33Choice[]){
 if(!Array.isArray(choices)||choices.some(c=>!c||!Number.isSafeInteger(c.line)||
  !["keep","insert","replace"].includes(c.decision)||!(c.expectedValue===null||typeof c.expectedValue==="string"))||
  new Set(choices.map(c=>c.line)).size!==choices.length)return reject("invalid-input");
 await db.query("BEGIN");
 try{
  const actor=await db.query<{role:string}>(`SELECT role FROM public.smn_account
   WHERE id=$1 AND installation_id='singleton' AND is_active=true AND NOT must_change_password`,[actorId]);
  if(actor.rows[0]?.role!=="admin"){await db.query("ROLLBACK");return reject("forbidden");}
  const global=await db.query("SELECT revision FROM public.smn_indicator_system_revision WHERE singleton_key='singleton' FOR UPDATE");
  if(global.rows.length!==1)throw Error("indicator-system-revision-missing");
  const current=await collect(db,input,true);
  if(!current.ok){await db.query("ROLLBACK");return current;}
  if(choices.length!==current.preview.length){await db.query("ROLLBACK");return reject("incomplete-decisions");}
  const byLine=new Map(choices.map(x=>[x.line,x]));
  for(const row of current.preview){
   const c=byLine.get(row.line);
   if(!c||c.expectedValue!==row.existingValue||
     (row.existingValue===null&&c.decision!=="insert")||
     (row.existingValue!==null&&c.decision==="insert")){
    await db.query("ROLLBACK");return reject("stale-preview");
   }
  }
  await assertHistoricalCsvTable(db,"smn_historical_csv_batch");
  await assertHistoricalCsvTable(db,"smn_historical_csv_change");
  const batchId=randomUUID();
  await db.query("INSERT INTO public.smn_historical_csv_batch(id,mode,actor_id) VALUES($1,$2,$3)",[batchId,input.mode,actorId]);
  let inserted=0,replaced=0,preserved=0;
  const touched=new Map<string,Set<string>>();
  for(const row of current.preview){
   const choice=byLine.get(row.line)!;
   if(choice.decision==="keep"){preserved++;continue;}
   await db.query(`INSERT INTO public.smn_indicator_manual_value
    (team_id,cycle_type,cycle_id,indicator_id,value,updated_by)
    VALUES($1,$2,$3,$4,$5::numeric,$6)
    ON CONFLICT(team_id,cycle_type,cycle_id,indicator_id) DO UPDATE
    SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=now()`,
    [input.teamId,input.mode,row.cycleId,row.indicatorId,String(row.value),actorId]);
   const previous=await db.query<{quality:string}>(`SELECT c.quality FROM public.smn_historical_csv_change c
    JOIN public.smn_historical_csv_batch b ON b.id=c.batch_id
    WHERE c.cycle_id=$1 AND c.metric_code=$2 AND b.mode=$3
    ORDER BY c.changed_at DESC,c.id DESC LIMIT 1`,[row.cycleId,row.metricCode,input.mode]);
   await db.query(`INSERT INTO public.smn_historical_csv_change
    (id,batch_id,cycle_id,metric_code,previous_value,next_value,quality,action,actor_id,source_line,previous_quality)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [randomUUID(),batchId,row.cycleId,row.metricCode,row.existingValue,row.value,row.quality,
     choice.decision,actorId,row.line,previous.rows[0]?.quality??null]);
   const cycle=touched.get(row.cycleId)??new Set<string>();
   cycle.add(row.indicatorId);touched.set(row.cycleId,cycle);
   if(choice.decision==="insert")inserted++;else replaced++;
  }
  for(const [cycleId,indicatorIds] of touched){
   await recalculateIndicatorResultsWithinTransaction(db,{teamId:input.teamId,
    cycles:[{teamId:input.teamId,cycleType:input.mode,cycleId}],changedIndicatorIds:[...indicatorIds]});
   await db.query(`INSERT INTO public.smn_indicator_cycle_revision(team_id,cycle_type,cycle_id,revision)
    VALUES($1,$2,$3,1) ON CONFLICT(team_id,cycle_type,cycle_id)
    DO UPDATE SET revision=smn_indicator_cycle_revision.revision+1,updated_at=now()`,[input.teamId,input.mode,cycleId]);
  }
  if(touched.size)await db.query("UPDATE public.smn_indicator_system_revision SET revision=revision+1,updated_at=now() WHERE singleton_key='singleton'");
  const attemptId=await recordCsvAttempt(db,{actorId,status:"import-confirmed",mode:input.mode,scope:"historical-csv-v33",batchId,
   readCount:current.preview.length,recognizedCount:current.preview.length,appliedCount:inserted+replaced,
   preservedCount:preserved,rejectedCount:0,cycleIds:[...touched.keys()]});
  await db.query("COMMIT");
  return {ok:true as const,batchId,attemptId,inserted,replaced,preserved};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
