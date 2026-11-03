export type TeamFilterMember={
 displayName:string;
 professionalFunction?:string|null;
 archived:boolean;
 isProvisional:boolean;
 roleShares?:{scrumMaster:number;productOwner:number;developer:number}|null;
};
export type TeamFilters={
 search:string;
 role:"all"|"sm"|"po"|"dev";
 functionName:string;
 status:"active"|"all"|"provisional"|"archived";
};
export const initialTeamFilters:TeamFilters={
 search:"",role:"all",functionName:"all",status:"all"
};
export function normalizedTeamSearch(value:string):string{
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();
}
export function availableFunctions(members:readonly TeamFilterMember[]):string[]{
 return Array.from(new Set(members.map(m=>m.professionalFunction?.trim()??"").filter(Boolean)))
  .sort((a,b)=>a.localeCompare(b));
}
export function filterTeamMembers<T extends TeamFilterMember>(
 members:readonly T[],filters:TeamFilters
):T[]{
 const search=normalizedTeamSearch(filters.search);
 return members.filter(member=>{
  if(filters.status==="active"&&member.archived)return false;
  if(filters.status==="archived"&&!member.archived)return false;
  if(filters.status==="provisional"&&(member.archived||!member.isProvisional))return false;
  if(filters.role==="sm"&&!(Number(member.roleShares?.scrumMaster??0)>0))return false;
  if(filters.role==="po"&&!(Number(member.roleShares?.productOwner??0)>0))return false;
  if(filters.role==="dev"&&!(Number(member.roleShares?.developer??0)>0))return false;
  if(filters.functionName!=="all"&&member.professionalFunction?.trim()!==filters.functionName)return false;
  if(search&&!normalizedTeamSearch(member.displayName+" "+(member.professionalFunction??"")).includes(search))return false;
  return true;
 });
}

/** Team membership dates are inclusive: a departure on today stays active
 * until the following day. Each member is shown once for the latest assignment.
 */
export type DatedTeamMember={id:string;startOn:string|null;endOn:string|null};
export function splitTeamMembersByAssignment<T extends DatedTeamMember>(
 members:readonly T[],today:string):{active:T[];inactive:T[]}{
 const latestFirst=(a:T,b:T)=>b.startOn!.localeCompare(a.startOn!)||a.id.localeCompare(b.id);
 const departureFirst=(a:T,b:T)=>b.endOn!.localeCompare(a.endOn!)||
  b.startOn!.localeCompare(a.startOn!)||a.id.localeCompare(b.id);
 return {
  active:members.filter(m=>m.startOn!==null&&m.startOn<=today&&
   (m.endOn===null||m.endOn>=today)).sort(latestFirst),
  inactive:members.filter(m=>m.startOn!==null&&m.endOn!==null&&m.endOn<today)
   .sort(departureFirst)
 };
}
