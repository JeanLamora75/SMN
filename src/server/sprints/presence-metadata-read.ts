import type {Client} from "pg";
import type {AgileRole} from "@/lib/sprint-presence";

export type SprintMemberMetadata=Readonly<{
 professionalFunction:string|null;
 agileRoles:readonly AgileRole[]|null;
 contributionPercents:readonly number[]|null;
}>;
export type MemberDateScope=Readonly<{memberId:string;dates:readonly string[]}>;
export type MemberVersionRow=Readonly<{
 member_id:string;assignment_id:string;professional_function:string|null;
 start_on:string;end_on:string|null;
 effective_from:string|null;revision:number|null;
 scrum_master_percent:number|null;product_owner_percent:number|null;
 developer_percent:number|null;contribution_percent:number|null;
}>;

const valid=(n:number|null):n is number=>
 typeof n==="number"&&Number.isInteger(n)&&n>=0&&n<=100;
const roles:readonly [AgileRole,keyof Pick<MemberVersionRow,
 "scrum_master_percent"|"product_owner_percent"|"developer_percent">][]=[
 ["scrumMaster","scrum_master_percent"],
 ["productOwner","product_owner_percent"],
 ["developer","developer_percent"]
];

/** Choose the effective version for each assigned day, never today's/future version. */
export function mapSprintMemberMetadata(
 members:readonly MemberDateScope[],rows:readonly MemberVersionRow[]
):Map<string,SprintMemberMetadata>{
 const result=new Map<string,SprintMemberMetadata>();
 for(const member of members){
  const found=rows.filter(r=>r.member_id===member.memberId);
  const professionalFunction=found.find(r=>typeof r.professional_function==="string"&&
   r.professional_function.trim())?.professional_function?.trim()??null;
  const active=new Set<AgileRole>();
  const percentages:number[]=[];
  let complete=member.dates.length>0;
  for(const date of member.dates){
   const matches=found.filter(r=>r.start_on<=date&&(r.end_on===null||r.end_on>=date));
   const assignments=new Set(matches.map(r=>r.assignment_id));
   if(assignments.size!==1){complete=false;break;}
   const versions=matches.filter(r=>r.effective_from!==null&&r.effective_from<=date)
    .sort((a,b)=>a.effective_from!.localeCompare(b.effective_from!)||
     (a.revision??0)-(b.revision??0));
   const selected=versions.at(-1);
   if(!selected||!valid(selected.scrum_master_percent)||
    !valid(selected.product_owner_percent)||!valid(selected.developer_percent)||
    !valid(selected.contribution_percent)||
    selected.scrum_master_percent+selected.product_owner_percent+
    selected.developer_percent!==100){complete=false;break;}
   for(const [label,field] of roles)if((selected[field]??0)>0)active.add(label);
   if(percentages.at(-1)!==selected.contribution_percent)
    percentages.push(selected.contribution_percent);
  }
  result.set(member.memberId,{
   professionalFunction,
   agileRoles:complete?roles.map(([role])=>role).filter(role=>active.has(role)):null,
   contributionPercents:complete?percentages:null
  });
 }
 return result;
}

/** Single, scoped read in the existing dashboard READ ONLY transaction. */
export async function readSprintMemberMetadata(
 db:Client,teamId:string,start:string,end:string,members:readonly MemberDateScope[]
):Promise<Map<string,SprintMemberMetadata>>{
 if(!members.length)return new Map();
 const ids=[...new Set(members.map(m=>m.memberId))];
 const query=await db.query<MemberVersionRow>(`
  SELECT a.member_id,a.id AS assignment_id,m.professional_function,
   a.start_on::text AS start_on,a.end_on::text AS end_on,
   v.effective_from::text AS effective_from,v.revision,
   v.scrum_master_percent,v.product_owner_percent,v.developer_percent,
   v.contribution_percent
  FROM public.smn_member_assignment a
  JOIN public.smn_member m ON m.id=a.member_id AND m.installation_id='singleton'
  LEFT JOIN public.smn_member_assignment_version v
   ON v.assignment_id=a.id AND v.effective_from<=$4::date
  WHERE a.team_id=$1 AND a.member_id=ANY($2::text[])
   AND a.start_on<=$4::date AND (a.end_on IS NULL OR a.end_on>=$3::date)
  ORDER BY a.member_id,a.start_on,v.effective_from,v.revision
  LIMIT 15001`,[teamId,ids,start,end]);
 if(query.rows.length>15000)throw Error("presence-metadata-limit");
 return mapSprintMemberMetadata(members,query.rows);
}
