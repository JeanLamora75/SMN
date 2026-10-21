import {randomUUID} from "node:crypto";
import type {Client} from "pg";

export type AbsenceCategoryItem={
 id:string;name:string;color:string;isActive:boolean;updatedAt:string;usageCount:number;
};
type CreateCategory={action:"create";name:string;color:string};
type UpdateCategory={action:"update";id:string;updatedAt:string;
 name:string;color:string;isActive:boolean};
export type CategoryChange=CreateCategory|UpdateCategory;
export type CategoryError="invalid-input"|"name-required"|"color-required"|
 "invalid-name"|"invalid-color"|"not-found"|"duplicate-name"|
 "conflict"|"catalogue-full";
export type CategoryChangeResult={ok:true;created:boolean;category:AbsenceCategoryItem}|
 {ok:false;error:CategoryError};
type CategoryRow={id:string;name:string;color:string;is_active:boolean;
 updated_at:string;usage_count:number};
const CATEGORY=/^[a-z][a-z0-9_-]{0,39}$/u;
const COLOR=/^#[0-9a-fA-F]{6}$/u;
const NAME_CONTROL=/[\u0000-\u001f\u007f]/u;
const MAX_CATEGORIES=100;

export function parseCategoryChange(raw:unknown):
 {ok:true;value:CategoryChange}|{ok:false;error:CategoryError}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(v.action!=="create"&&v.action!=="update")return {ok:false,error:"invalid-input"};
 const allowed=v.action==="create"?["action","name","color"]:
  ["action","id","updatedAt","name","color","isActive"];
 if(Object.keys(v).length!==allowed.length||
  Object.keys(v).some(k=>!allowed.includes(k)))return {ok:false,error:"invalid-input"};
 if(typeof v.name!=="string"||!v.name.trim())
  return {ok:false,error:"name-required"};
 if(typeof v.color!=="string"||!v.color.trim())
  return {ok:false,error:"color-required"};
 const name=v.name.trim().replace(/\s+/gu," ");
 if(name.length>100||NAME_CONTROL.test(v.name))
  return {ok:false,error:"invalid-name"};
 if(!COLOR.test(v.color))return {ok:false,error:"invalid-color"};
 const color=v.color.toUpperCase();
 if(v.action==="create")return {ok:true,value:{action:"create",name,color}};
 if(typeof v.id!=="string"||!CATEGORY.test(v.id)||
  typeof v.updatedAt!=="string"||v.updatedAt.length<10||v.updatedAt.length>80||
  typeof v.isActive!=="boolean")
  return {ok:false,error:"invalid-input"};
 return {ok:true,value:{action:"update",id:v.id,updatedAt:v.updatedAt,
  name,color,isActive:v.isActive}};
}

const listSql=[
 "SELECT c.id,c.name,c.color,c.is_active,c.updated_at::text AS updated_at,",
 " COALESCE(count(a.id),0)::integer AS usage_count",
 "FROM public.smn_absence_category c",
 "LEFT JOIN public.smn_member_absence a ON a.category_id=c.id",
 "GROUP BY c.id,c.name,c.color,c.is_active,c.updated_at",
 "ORDER BY c.name ASC,c.id ASC LIMIT 101"
].join("\n");
const project=(row:CategoryRow):AbsenceCategoryItem=>({
 id:row.id,name:row.name,color:row.color,isActive:row.is_active,
 updatedAt:row.updated_at,usageCount:Number(row.usage_count)
});
export async function listAbsenceCategories(db:Client):Promise<{categories:AbsenceCategoryItem[]}>{
 const result=await db.query<CategoryRow>(listSql);
 if(result.rows.length>MAX_CATEGORIES)throw Error("absence-categories-limit");
 return {categories:result.rows.map(project)};
}

/** Category IDs remain stable; updates change only the live catalog, not historical absences. */
export async function saveAbsenceCategory(db:Client,raw:unknown):Promise<CategoryChangeResult>{
 const parsed=parseCategoryChange(raw);
 if(!parsed.ok)return parsed;
 const input=parsed.value;
 await db.query("BEGIN");
 try{
  const rollback=async(error:CategoryError):Promise<CategoryChangeResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  await db.query("SELECT pg_advisory_xact_lock(20261021,52)");
  let id:string;
  if(input.action==="update"){
   const found=await db.query<{id:string;updated_at:string}>(
    "SELECT id,updated_at::text AS updated_at FROM public.smn_absence_category WHERE id=$1 FOR UPDATE",
    [input.id]);
   if(found.rows.length!==1)return rollback("not-found");
   if(found.rows[0].updated_at!==input.updatedAt)return rollback("conflict");
   id=input.id;
  }else id="cat_"+randomUUID().replace(/-/gu,"");
  const existing=await db.query<{id:string}>(
   "SELECT id FROM public.smn_absence_category WHERE lower(name)=lower($1) AND id<>$2 LIMIT 1",
   [input.name,id]);
  if(existing.rows.length>0)return rollback("duplicate-name");
  if(input.action==="create"){
   const total=await db.query<{total:number}>(
    "SELECT count(*)::integer AS total FROM public.smn_absence_category");
   if(Number(total.rows[0]?.total)>=MAX_CATEGORIES)return rollback("catalogue-full");
   await db.query(
    "INSERT INTO public.smn_absence_category (id,name,color,is_active) VALUES($1,$2,$3,true)",
    [id,input.name,input.color]);
  }else{
   const updated=await db.query(
    "UPDATE public.smn_absence_category SET name=$2,color=$3,is_active=$4, "+
    "updated_at=GREATEST(clock_timestamp(),updated_at+interval '1 microsecond') "+
    "WHERE id=$1 AND updated_at=$5::timestamptz",
    [id,input.name,input.color,input.isActive,input.updatedAt]);
   if(updated.rowCount!==1)return rollback("conflict");
  }
  const catalogue=await listAbsenceCategories(db);
  const category=catalogue.categories.find(c=>c.id===id);
  if(!category)throw Error("absence-category-commit-inconsistent");
  await db.query("COMMIT");
  return {ok:true,created:input.action==="create",category};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
