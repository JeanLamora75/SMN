export type Level=1|2|3;
export const levels=[1,2,3] as const;
export type Criticality="low"|"medium"|"high"|"unassessed";
export function validLevel(v:unknown):v is Level{return v===1||v===2||v===3;}
export function criticality(p:Level|null,i:Level|null):{score:number|null;level:Criticality}{
 if(p===null||i===null)return {score:null,level:"unassessed"};
 const score=p*i;
 return {score,level:score<=2?"low":score<=4?"medium":"high"};
}
