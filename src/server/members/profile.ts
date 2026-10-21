import type {Client} from "pg";

const MEMBER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/u;
type ProfileChange={displayName:string;email:string|null;revision:number};
export type MemberProfile=Readonly<{id:string;displayName:string;email:string|null;
 isProvisional:boolean;revision:number}>;
export type ProfileResult={ok:true;member:MemberProfile;changed:boolean}|
 {ok:false;error:"invalid-input"|"not-found"|"conflict"};

export function parseMemberProfileChange(raw:unknown):ProfileChange|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const obj=raw as Record<string,unknown>;
 if(Object.keys(obj).length!==3||!Object.hasOwn(obj,"displayName")||
  !Object.hasOwn(obj,"email")||!Object.hasOwn(obj,"revision"))return null;
 if(typeof obj.displayName!=="string"||typeof obj.revision!=="number"||
  !Number.isSafeInteger(obj.revision)||obj.revision<0)return null;
 const displayName=obj.displayName.trim().replace(/\s+/gu," ");
 if(displayName.length<1||displayName.length>120||
  /[\u0000-\u001f\u007f]/u.test(obj.displayName))return null;
 if(obj.email!==null&&typeof obj.email!=="string")return null;
 const email=typeof obj.email==="string"?obj.email.trim().toLowerCase()||null:null;
 if(email!==null&&(!EMAIL.test(email)||email.length>254))return null;
 return {displayName,email,revision:obj.revision};
}
type Row={id:string;display_name:string;email:string|null;is_provisional:boolean;revision:number;member_number:number};
function project(row:Row):MemberProfile{
 if(typeof row.id!=="string"||typeof row.display_name!=="string"||
  !Number.isSafeInteger(row.revision)||typeof row.is_provisional!=="boolean")
  throw new Error("member-profile-corrupt");
 return {id:row.id,displayName:row.display_name,email:row.email,
  isProvisional:row.is_provisional,revision:row.revision};
}
/** A central member update never touches assignments, session accounts or cycle capacities. */
export async function updateMemberProfile(client:Client,id:string,raw:unknown):Promise<ProfileResult>{
 const input=parseMemberProfileChange(raw);
 if(!MEMBER_ID.test(id)||!input)return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  const current=await client.query<Row>(`SELECT id,display_name,email,is_provisional,revision,member_number
   FROM public.smn_member WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[id]);
  if(current.rows.length!==1){
   await client.query("ROLLBACK");return {ok:false,error:"not-found"};
  }
  const old=current.rows[0];
  if(old.revision!==input.revision){
   await client.query("ROLLBACK");return {ok:false,error:"conflict"};
  }
  // Editing just the email must not silently confirm the provisional name.
  const isProvisional=old.is_provisional&&old.display_name===input.displayName;
  if(old.display_name===input.displayName&&old.email===input.email&&
   old.is_provisional===isProvisional){
   await client.query("COMMIT");return {ok:true,member:project(old),changed:false};
  }
  const updated=await client.query<Row>(`UPDATE public.smn_member SET
   display_name=$1,email=$2,is_provisional=$3,revision=revision+1,updated_at=now()
   WHERE id=$4 AND installation_id='singleton' AND revision=$5
   RETURNING id,display_name,email,is_provisional,revision,member_number`,
   [input.displayName,input.email,isProvisional,id,input.revision]);
  if(updated.rows.length!==1)throw new Error("member-update-inconsistent");
  await client.query("COMMIT");
  return {ok:true,member:project(updated.rows[0]),changed:true};
 }catch(error){
  await client.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
