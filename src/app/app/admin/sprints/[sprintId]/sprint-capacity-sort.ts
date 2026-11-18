import type {PresenceMember} from "@/lib/sprint-presence";

export type CapacitySortKey="name"|"roles"|"function"|"contribution"|"presence"|"absence"|"development"|"quality";
export type CapacitySort={key:CapacitySortKey;direction:"desc"|"asc"};

export function nextCapacitySort(current:CapacitySort|null,key:CapacitySortKey):CapacitySort{
 return {key,direction:current?.key===key&&current.direction==="desc"?"asc":"desc"};
}
const text=(a:string,b:string)=>a.localeCompare(b,"fr",{numeric:true,sensitivity:"base"});
const number=(a:number|null|undefined,b:number|null|undefined,descending:boolean)=>{
 const av=a!=null&&Number.isFinite(a)?a:null,bv=b!=null&&Number.isFinite(b)?b:null;
 if(av===null)return bv===null?0:1;
 if(bv===null)return -1;
 return descending?bv-av:av-bv;
};
const roleText=(m:PresenceMember)=>[...(m.agileRoles??[])].join(" ");
const contributionValue=(m:PresenceMember)=>m.contributionPercents?.length?
 m.contributionPercents[0]:null;

/** Sort only the displayed members. Missing values always follow known values. */
export function sortCapacityMembers(members:readonly PresenceMember[],sort:CapacitySort|null):PresenceMember[]{
 if(!sort)return [...members];
 const descending=sort.direction==="desc",direction=descending?-1:1;
 return [...members].sort((a,b)=>{
  let comparison=0;
  switch(sort.key){
   case "name":comparison=text(a.displayName,b.displayName)*direction;break;
   case "roles":comparison=text(roleText(a),roleText(b))*direction;break;
   case "function":comparison=text(a.professionalFunction??"",b.professionalFunction??"")*direction;break;
   case "contribution":comparison=number(contributionValue(a),contributionValue(b),descending);break;
   case "presence":comparison=number(a.presenceJh,b.presenceJh,descending);break;
   case "absence":comparison=number(a.absenceJh,b.absenceJh,descending);break;
   case "development":comparison=number(a.developmentJh,b.developmentJh,descending);break;
   case "quality":comparison=number(a.unknownDays,b.unknownDays,descending);break;
  }
  return comparison||text(a.displayName,b.displayName)||text(a.memberId,b.memberId);
 });
}
