import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {requireTeamMemberScope} from "@/server/members/team-scope";

export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
type Params={params:Promise<{id:string}>};
export async function GET(req:NextRequest,{params}:Params){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params,teamId=req.nextUrl.searchParams.get("teamId");
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{
  await requireTeamMemberScope(db,{accountId:actor.id,role:"admin"},id,teamId);
  const result=await db.query<{display_name:string;email:string|null;professional_function:string|null;revision:number;archived_at:string|null}>(`SELECT display_name,email,professional_function,revision,archived_at::text
   FROM public.smn_member WHERE id=$1 AND installation_id='singleton'`,[id]);
  if(result.rows.length!==1)throw Error("member-not-found");
  const m=result.rows[0];
  return {displayName:m.display_name,email:m.email,professionalFunction:m.professional_function,
   revision:m.revision,archived:m.archived_at!==null};
 }));}catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:Params){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params,raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 const {teamId,displayName,email,professionalFunction,revision}=raw;
 if(typeof teamId!=="string"||typeof displayName!=="string"||
    !displayName.trim()||displayName.trim().length>120||
    !(email===null||(typeof email==="string"&&email.length<=254))||
    !(professionalFunction===null||(typeof professionalFunction==="string"&&professionalFunction.length<=120))||
    !Number.isSafeInteger(revision)||Number(revision)<1 ||
    Object.keys(raw).sort().join(",")!=="displayName,email,professionalFunction,revision,teamId")
  return jsonResult({error:"invalid-input"},400);
 try{return await withAuthDb(async db=>{
  await requireTeamMemberScope(db,{accountId:actor.id,role:"admin"},id,teamId);
  await db.query("BEGIN");
  try{
   const current=await db.query<{display_name:string;email:string|null;professional_function:string|null;revision:number;archived_at:string|null}>(`
    SELECT display_name,email,professional_function,revision,archived_at::text
    FROM public.smn_member WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[id]);
   const m=current.rows[0];
   if(!m){await db.query("ROLLBACK");return jsonResult({error:"not-found"},404);}
   if(m.archived_at){await db.query("ROLLBACK");return jsonResult({error:"archived"},409);}
   if(m.revision!==revision){await db.query("ROLLBACK");return jsonResult({error:"conflict"},409);}
   const next={displayName:displayName.trim(),email:email?.trim()||null,
    professionalFunction:professionalFunction?.trim()||null};
   const changed=m.display_name!==next.displayName||m.email!==next.email||m.professional_function!==next.professionalFunction;
   if(changed){
    await db.query(`UPDATE public.smn_member SET display_name=$2,email=$3,professional_function=$4,
     revision=revision+1,updated_at=now() WHERE id=$1`,[id,next.displayName,next.email,next.professionalFunction]);
    await db.query(`INSERT INTO public.smn_member_identity_history
     (id,member_id,previous_values,next_values,changed_by)
     VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),id,JSON.stringify({
      displayName:m.display_name,email:m.email,professionalFunction:m.professional_function
     }),JSON.stringify(next),actor.id]);
   }
   await db.query("COMMIT");
   return jsonResult({ok:true,changed,revision:m.revision+(changed?1:0),...next});
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 });}catch(error){
  console.error("member-team-profile-update-unavailable",{
   message:error instanceof Error?error.message:String(error),
   code:typeof error==="object"&&error!==null&&"code" in error?String(error.code):undefined
  });
  return jsonResult({error:"unavailable"},503);
 }
}
