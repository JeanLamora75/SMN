import {randomUUID} from "node:crypto";
import type {Client} from "pg";

type Row={id:string;name:string;comment:string|null;color:string;archived_at:string|null;revision:number};
const colors=new Set(["blue","indigo","violet","teal","green","amber","orange","red"]);
const fields="id,name,comment,color,archived_at::text AS archived_at,revision";
export type CompanyInput={name:string;comment:string|null;color:string};
export type CompanyError="invalid-input"|"duplicate-name"|"not-found"|"conflict"|"already-archived"|"already-active";
function normalizeName(value:unknown):string|null{
 if(typeof value!=="string")return null;
 const name=value.trim().replace(/\s+/gu," ");
 return name.length>=1&&name.length<=120&&!/[\u0000-\u001f\u007f]/u.test(name)?name:null;
}
export function parseCompanyInput(raw:unknown):CompanyInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(!Object.hasOwn(v,"name")||!Object.hasOwn(v,"color")||Object.keys(v).some(k=>!["name","comment","color"].includes(k)))return null;
 const name=normalizeName(v.name);
 if(!name||typeof v.color!=="string"||!colors.has(v.color))return null;
 const comment=v.comment===undefined||v.comment===null?null:typeof v.comment==="string"?v.comment.trim():null;
 if(v.comment!==undefined&&v.comment!==null&&typeof v.comment!=="string")return null;
 if(comment!==null&&(comment.length>2000||/[\u0000]/u.test(comment)))return null;
 return {name,comment:comment||null,color:v.color};
}
function map(r:Row){return {id:r.id,name:r.name,comment:r.comment,color:r.color,archivedAt:r.archived_at,revision:r.revision};}
export async function listCompanies(db:Client){
 const r=await db.query<Row>(`SELECT ${fields} FROM public.smn_company WHERE installation_id='singleton'
 ORDER BY archived_at NULLS FIRST,lower(name),id LIMIT 1001`);
 if(r.rows.length>1000)throw Error("company-list-limit");
 return r.rows.map(map);
}
export async function getCompany(db:Client,id:string){
 if(!validId(id))return null;
 const r=await db.query<Row>(`SELECT ${fields} FROM public.smn_company
 WHERE installation_id='singleton' AND id=$1`,[id]);
 return r.rows[0]?map(r.rows[0]):null;
}
const unique=(e:unknown)=>typeof e==="object"&&e!==null&&"code" in e&&(e as {code:unknown}).code==="23505" && "constraint" in e && (e as {constraint:unknown}).constraint==="smn_company_installation_name_uq";
const validId=(id:unknown):id is string=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const validActor=(id:unknown):id is string=>typeof id==="string"&&id.length>0&&id.length<=120;
export async function createCompany(db:Client,actorId:string,raw:unknown){
 const input=parseCompanyInput(raw);
 if(!input||!validActor(actorId))return {ok:false as const,error:"invalid-input" as CompanyError};
 try{
  const r=await db.query<Row>(`INSERT INTO public.smn_company
   (id,installation_id,name,comment,color,created_by,updated_by)
   VALUES($1,'singleton',$2,$3,$4,$5,$5) RETURNING ${fields}`,
   [randomUUID(),input.name,input.comment,input.color,actorId]);
  return {ok:true as const,company:map(r.rows[0])};
 }catch(e){if(unique(e))return {ok:false as const,error:"duplicate-name" as CompanyError};throw e;}
}
export async function changeCompany(db:Client,id:string,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as CompanyError};
 const v=raw as Record<string,unknown>;
 const revision=v.revision;
 const input=parseCompanyInput(Object.fromEntries(Object.entries(v).filter(([k])=>k!=="revision")));
 if(!validId(id)||!validActor(actorId)||!input||!Object.hasOwn(v,"revision")||Object.keys(v).some(k=>!["name","comment","color","revision"].includes(k))||!Number.isSafeInteger(revision)||Number(revision)<1)return {ok:false as const,error:"invalid-input" as CompanyError};
 try{
  const r=await db.query<Row>(`UPDATE public.smn_company SET name=$3,comment=$4,color=$5,
   revision=revision+1,updated_by=$6,updated_at=now()
   WHERE id=$1 AND installation_id='singleton' AND revision=$2 AND archived_at IS NULL
   RETURNING ${fields}`,[id,revision,input.name,input.comment,input.color,actorId]);
  if(r.rows[0])return {ok:true as const,company:map(r.rows[0])};
  const found=await getCompany(db,id);
  return {ok:false as const,error:(!found?"not-found":found.revision!==revision?"conflict":"already-archived") as CompanyError};
 }catch(e){if(unique(e))return {ok:false as const,error:"duplicate-name" as CompanyError};throw e;}
}
export async function setCompanyArchived(db:Client,id:string,actorId:string,revision:unknown,archive:boolean){
 if(!validId(id)||!validActor(actorId)||!Number.isSafeInteger(revision)||Number(revision)<1)return {ok:false as const,error:"invalid-input" as CompanyError};
 const r=await db.query<Row>(`UPDATE public.smn_company
 SET archived_at=${archive?"now()":"NULL"},revision=revision+1,updated_by=$3,updated_at=now()
 WHERE id=$1 AND installation_id='singleton' AND revision=$2
 AND archived_at IS ${archive?"NULL":"NOT NULL"}
 RETURNING ${fields}`,[id,revision,actorId]);
 if(r.rows[0])return {ok:true as const,company:map(r.rows[0])};
 const found=await getCompany(db,id);
 return {ok:false as const,error:(!found?"not-found":found.revision!==revision?"conflict":archive?"already-archived":"already-active") as CompanyError};
}
