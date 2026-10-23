export const teamContextKeys=["vision","productGoal","dod","dor"] as const;
export type TeamContextKey=typeof teamContextKeys[number];
export type TeamContextEntry={kind:"text"|"url";value:string;language:string|null;recordedAt:string|null};
export type TeamContextSources=Record<TeamContextKey,TeamContextEntry|null>;
export type TeamContextOptions=Record<TeamContextKey,boolean>;
export const defaultTeamContextOptions=():TeamContextOptions=>({vision:false,productGoal:false,dod:false,dor:false});
export function validTeamContextOptions(raw:unknown):raw is TeamContextOptions{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 return Object.keys(v).sort().join(",")===[...teamContextKeys].sort().join(",")&&teamContextKeys.every(k=>typeof v[k]==="boolean");
}
export function selectedTeamContext(source:TeamContextSources,options:TeamContextOptions){
 return teamContextKeys.flatMap(key=>{
  const v=source[key];return options[key]&&v&&v.value.trim()?[{key,...v}]:[];
 });
}
export function permittedContextUrl(value:string):boolean{
 try{const u=new URL(value);return (u.protocol==="https:"||u.protocol==="http:")&&Boolean(u.hostname)&&!u.username&&!u.password;}catch{return false;}
}
