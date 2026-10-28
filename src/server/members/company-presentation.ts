import type {Client} from "pg";
import type {TeamMembers} from "./quick-create";

/** Enrichit exclusivement les membres du périmètre équipe déjà autorisé. */
export async function withMemberCompanies(db:Client,data:TeamMembers){
 if(!data.members.length)return data;
 const ids=data.members.map(m=>m.id);
 const found=await db.query<{id:string;company_id:string|null;company_name:string|null;company_color:string|null}>(`
 SELECT m.id,m.company_id,c.name AS company_name,c.color AS company_color
 FROM public.smn_member m
 LEFT JOIN public.smn_company c ON c.id=m.company_id AND c.installation_id=m.installation_id
 WHERE m.installation_id='singleton' AND m.id=ANY($1::text[])`,[ids]);
 const byId=new Map(found.rows.map(r=>[r.id,r]));
 return {...data,members:data.members.map(m=>{
  const c=byId.get(m.id);
  return {...m,companyId:c?.company_id??null,companyName:c?.company_name??null,
   companyColor:c?.company_color??null};
 })};
}
