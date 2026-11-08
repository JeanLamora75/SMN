import type {Client} from "pg";
import {
 CHART_TYPES,PREDEFINED_CHART_STYLES,DEFAULT_STYLE_ID,ChartStyleError,
 parseChartStyleCommand,validChartStyleConfig,validChartStyleId,type ChartStyleConfig
} from "./chart-style-contract";
export type ChartStyleActor={id:string;role:string};
type DbStyle={id:string;name:string;description:string;schema_version:number;revision:number;config:unknown;created_at:Date;updated_at:Date};
type DefaultRow={chart_type:string;style_id:string;revision:number};
const builtin=(id:string)=>PREDEFINED_CHART_STYLES.find(x=>x.id===id);
function allowed(actor:ChartStyleActor,write=false){
 if(!actor||!actor.id||(write&&actor.role!=="admin")||!["admin","user"].includes(actor.role))
  throw new ChartStyleError("forbidden");
}
function record(row:DbStyle){
 if(row.schema_version!==1||!validChartStyleConfig(row.config))throw new ChartStyleError("schema-not-ready");
 return {id:row.id,name:row.name,description:row.description,source:"custom" as const,
  revision:row.revision,config:row.config,createdAt:row.created_at,updatedAt:row.updated_at};
}
async function ready(db:Client){
 const r=await db.query<{schema_version:number}>(`SELECT schema_version FROM public.smn_installation
  WHERE id='singleton' AND state='initialized'`);
 if(r.rows[0]?.schema_version!==33)throw new ChartStyleError("schema-not-ready");
 const tables=await db.query<{ok:boolean}>(`SELECT to_regclass('public.smn_chart_style') IS NOT NULL
  AND to_regclass('public.smn_chart_style_default') IS NOT NULL AS ok`);
 if(!tables.rows[0]?.ok)throw new ChartStyleError("schema-not-ready");
}
export async function readChartStyles(db:Client,actor:ChartStyleActor){
 allowed(actor);await ready(db);
 const [custom,defaults]=await Promise.all([
  db.query<DbStyle>(`SELECT id,name,description,schema_version,revision,config,created_at,updated_at
   FROM public.smn_chart_style WHERE installation_id='singleton' ORDER BY name,id`),
  db.query<DefaultRow>(`SELECT chart_type,style_id,revision FROM public.smn_chart_style_default
   WHERE installation_id='singleton' ORDER BY chart_type`)
 ]);
 const styles=[...PREDEFINED_CHART_STYLES.map(s=>({
  id:s.id,name:s.name,description:s.description,source:"builtin" as const,revision:0,
  config:structuredClone(s.config),createdAt:null,updatedAt:null
 })),...custom.rows.map(record)];
 const known=new Set(styles.map(s=>s.id));
 const chosen=Object.fromEntries(CHART_TYPES.map(t=>[t,{styleId:DEFAULT_STYLE_ID,revision:0}])) as
  Record<(typeof CHART_TYPES)[number],{styleId:string;revision:number}>;
 for(const d of defaults.rows){
  if(!CHART_TYPES.some(t=>t===d.chart_type)||!known.has(d.style_id))throw new ChartStyleError("schema-not-ready");
  chosen[d.chart_type as keyof typeof chosen]={styleId:d.style_id,revision:d.revision};
 }
 return {styles,defaults:chosen};
}
export async function applyChartStyleCommand(db:Client,actor:ChartStyleActor,raw:unknown){
 allowed(actor,true);
 const input=parseChartStyleCommand(raw);
 await db.query("BEGIN");
 try{
  // One transaction lock serializes deletion against updating a default.
  await db.query("SELECT pg_advisory_xact_lock(20261108,416)");
  await ready(db);
  if(input.action==="create"){
   const existing=builtin(input.id);
   if(existing)throw new ChartStyleError("protected-style");
   await db.query(`INSERT INTO public.smn_chart_style
    (installation_id,id,name,description,schema_version,revision,config,updated_by)
    VALUES ('singleton',$1,$2,$3,1,1,$4::jsonb,$5)`,
    [input.id,input.name,input.description,JSON.stringify(input.config),actor.id]);
  }else if(input.action==="update"){
   if(builtin(input.id))throw new ChartStyleError("protected-style");
   const result=await db.query(`UPDATE public.smn_chart_style SET name=$2,description=$3,
    config=$4::jsonb,revision=revision+1,updated_at=now(),updated_by=$5
    WHERE installation_id='singleton' AND id=$1 AND revision=$6`,
    [input.id,input.name,input.description,JSON.stringify(input.config),actor.id,input.revision]);
   if(result.rowCount!==1)await stale(db,input.id);
  }else if(input.action==="delete"){
   if(builtin(input.id))throw new ChartStyleError("protected-style");
   const used=await db.query(`SELECT 1 FROM public.smn_chart_style_default
    WHERE installation_id='singleton' AND style_id=$1 LIMIT 1`,[input.id]);
   if(used.rowCount)throw new ChartStyleError("default-style");
   const deleted=await db.query(`DELETE FROM public.smn_chart_style
    WHERE installation_id='singleton' AND id=$1 AND revision=$2`,[input.id,input.revision]);
   if(deleted.rowCount!==1)await stale(db,input.id);
  }else{
   if(!builtin(input.styleId)){
    const style=await db.query(`SELECT 1 FROM public.smn_chart_style
     WHERE installation_id='singleton' AND id=$1`,[input.styleId]);
    if(style.rowCount!==1)throw new ChartStyleError("not-found");
   }
   const current=await db.query<{revision:number}>(`SELECT revision FROM public.smn_chart_style_default
    WHERE installation_id='singleton' AND chart_type=$1 FOR UPDATE`,[input.type]);
   const revision=current.rows[0]?.revision??0;
   if(input.revision!==revision)throw new ChartStyleError("conflict");
   if(revision===0){
    await db.query(`INSERT INTO public.smn_chart_style_default(installation_id,chart_type,style_id,revision)
     VALUES('singleton',$1,$2,1)`,[input.type,input.styleId]);
   }else{
    await db.query(`UPDATE public.smn_chart_style_default
     SET style_id=$2,revision=revision+1,updated_at=now()
     WHERE installation_id='singleton' AND chart_type=$1`,[input.type,input.styleId]);
   }
  }
  await db.query("COMMIT");
  return {ok:true as const,action:input.action};
 }catch(e){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(e instanceof ChartStyleError)throw e;
  if(e&&typeof e==="object"){
   const code=(e as {code?:string}).code;
   if(code==="23505")throw new ChartStyleError("conflict");
   if(code==="42P01"||code==="42703")throw new ChartStyleError("schema-not-ready");
  }
  throw e;
 }
}
async function stale(db:Client,id:string):Promise<never>{
 const present=await db.query(`SELECT 1 FROM public.smn_chart_style WHERE installation_id='singleton' AND id=$1`,[id]);
 throw new ChartStyleError(present.rowCount?"conflict":"not-found");
}
