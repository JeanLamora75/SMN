import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "../members/assignment";
import {ensureCapacityRecalcOutbox,queueClosureRecalculation} from "../capacity/company-recalc-outbox";
import {processCompanyRecalculation} from "../capacity/company-recalc-worker";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Row={id:string;company_id:string;name:string;start_on:string;end_on:string;is_active:boolean;revision:number;created_at:string;updated_at:string};
const columns="id,company_id,name,start_on::text AS start_on,end_on::text AS end_on,is_active,revision,created_at::text AS created_at,updated_at::text AS updated_at";
const view=(r:Row)=>({id:r.id,companyId:r.company_id,name:r.name,startOn:r.start_on,endOn:r.end_on,isActive:r.is_active,revision:r.revision,createdAt:r.created_at,updatedAt:r.updated_at});
type Input={action:"create"|"update";companyId:string;id?:string;revision?:number;name:string;startOn:string;endOn:string;isActive:boolean};
export function parseCompanyClosure(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(v.action!=="create"&&v.action!=="update")return null;
 const create=v.action==="create";
 const keys=create?["action","companyId","name","startOn","endOn"]:["action","companyId","id","revision","name","startOn","endOn","isActive"];
 if(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k))||typeof v.companyId!=="string"||!UUID.test(v.companyId)||
 typeof v.name!=="string"||!v.name.trim()||v.name.trim().length>120||/[\u0000-\u001f\u007f]/u.test(v.name)||
 !isValidDate(v.startOn)||!isValidDate(v.endOn)||typeof v.startOn!=="string"||typeof v.endOn!=="string"||
 v.startOn<"1900-01-01"||v.endOn>"2200-12-31"||v.startOn>v.endOn)return null;
 if(!create&&(typeof v.id!=="string"||!UUID.test(v.id)||typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<1||typeof v.isActive!=="boolean"))return null;
 return {action:v.action,companyId:v.companyId,name:v.name.trim().replace(/\s+/gu," "),startOn:v.startOn,endOn:v.endOn,isActive:create?true:v.isActive as boolean,...(create?{}:{id:v.id as string,revision:v.revision as number})};
}
export async function listClosuresForCompany(db:Client,companyId:string){
 if(!UUID.test(companyId))return null;
 const company=await db.query<{id:string}>("SELECT id FROM public.smn_company WHERE id=$1 AND installation_id='singleton'",[companyId]);
 if(!company.rows.length)return null;
 const r=await db.query<Row>(`SELECT ${columns} FROM public.smn_company_closure WHERE company_id=$1 ORDER BY start_on DESC,id LIMIT 1001`,[companyId]);
 if(r.rows.length>1000)throw Error("closures-limit");
 return r.rows.map(view);
}
type Failure="invalid-input"|"company-not-found"|"not-found"|"conflict"|"overlap";
export async function saveCompanyClosureV31(db:Client,actorId:string,raw:unknown):
 Promise<{ok:true;created:boolean;closure:ReturnType<typeof view>}|{ok:false;error:Failure}>{
 const v=parseCompanyClosure(raw);
 if(!v||!actorId)return {ok:false,error:"invalid-input"};
 await ensureCapacityRecalcOutbox(db);
 await db.query("BEGIN");
 try{
  const fail=async(error:Failure)=>{await db.query("ROLLBACK");return {ok:false as const,error};};
  const company=await db.query<{id:string}>(`SELECT id FROM public.smn_company
   WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[v.companyId]);
  if(!company.rows.length)return fail("company-not-found");
  let prior:Row|null=null;
  if(v.action==="update"){
   const q=await db.query<Row>(`SELECT ${columns} FROM public.smn_company_closure
    WHERE id=$1 AND company_id=$2 FOR UPDATE`,[v.id,v.companyId]);
   if(!q.rows.length)return fail("not-found");
   prior=q.rows[0];
   if(prior.revision!==v.revision)return fail("conflict");
  }
  if(v.isActive){
   const overlap=await db.query(`SELECT id FROM public.smn_company_closure
    WHERE company_id=$1 AND is_active=true AND id<>$2
    AND start_on<=$3::date AND end_on>=$4::date LIMIT 1`,
    [v.companyId,prior?.id??"",v.endOn,v.startOn]);
   if(overlap.rows.length)return fail("overlap");
  }
  const id=prior?.id??randomUUID(),revision=(prior?.revision??0)+1;
  if(prior){
   const updated=await db.query(`UPDATE public.smn_company_closure
    SET name=$3,start_on=$4::date,end_on=$5::date,is_active=$6,
    revision=revision+1,updated_by=$7,updated_at=now()
    WHERE id=$1 AND company_id=$2 AND revision=$8`,
    [id,v.companyId,v.name,v.startOn,v.endOn,v.isActive,actorId,v.revision]);
   if(updated.rowCount!==1)return fail("conflict");
  }else{
   await db.query(`INSERT INTO public.smn_company_closure
   (id,company_id,name,start_on,end_on,is_active,revision,created_by,updated_by)
   VALUES($1,$2,$3,$4::date,$5::date,true,1,$6,$6)`,
   [id,v.companyId,v.name,v.startOn,v.endOn,actorId]);
  }
  const before=prior?{companyId:prior.company_id,name:prior.name,startOn:prior.start_on,endOn:prior.end_on,isActive:prior.is_active}:null;
  const after={companyId:v.companyId,name:v.name,startOn:v.startOn,endOn:v.endOn,isActive:v.isActive};
  await db.query(`INSERT INTO public.smn_company_closure_history
   (id,closure_id,revision,operation,previous_values,next_values,changed_by)
   VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`,[randomUUID(),id,revision,prior?"update":"create",before?JSON.stringify(before):null,JSON.stringify(after),actorId]);
  await queueClosureRecalculation(db,{companyId:v.companyId,closureId:id,revision,
   startOn:v.startOn,endOn:v.endOn,
   previousStartOn:prior?.start_on,previousEndOn:prior?.end_on});
  const result=await db.query<Row>(`SELECT ${columns} FROM public.smn_company_closure WHERE id=$1 AND company_id=$2`,[id,v.companyId]);
  if(result.rows.length!==1)throw Error("closure-write-inconsistent");
  await db.query("COMMIT");
  // Best-effort immediate processing after commit: the durable job survives errors.
  try{await processCompanyRecalculation(db);}
  catch{console.error("company-capacity-recalc-deferred");}
  return {ok:true,created:!prior,closure:view(result.rows[0])};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
