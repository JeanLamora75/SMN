export const HELP_SETUP_STORAGE_KEY="smn.help.setup.v1" as const;
export type HelpSetupStatus="todo"|"in_progress"|"done";
export const helpSetupStepIds=[
 "general","team","members","calendar","cadence","tickets","reports","backup"
] as const;
export type HelpSetupStepId=typeof helpSetupStepIds[number];
export type HelpSetupProgress=Partial<Record<HelpSetupStepId,HelpSetupStatus>>;
export type HelpSetupStep=Readonly<{id:HelpSetupStepId;articleId:string;route:string}>;

const allowedStatuses=new Set<HelpSetupStatus>(["todo","in_progress","done"]);
const knownIds=new Set<string>(helpSetupStepIds);

export function parseHelpSetupProgress(raw:string|null):HelpSetupProgress{
 if(raw===null)return {};
 try{
  const candidate:unknown=JSON.parse(raw);
  if(!candidate||typeof candidate!=="object"||Array.isArray(candidate))return {};
  const record=candidate as Record<string,unknown>;
  if(record.version!==1||!record.steps||typeof record.steps!=="object"||
   Array.isArray(record.steps))return {};
  const steps=record.steps as Record<string,unknown>;
  const valid:HelpSetupProgress={};
  for(const [key,value] of Object.entries(steps)){
   if(!knownIds.has(key)||!allowedStatuses.has(value as HelpSetupStatus))return {};
   valid[key as HelpSetupStepId]=value as HelpSetupStatus;
  }
  return valid;
 }catch{return {};}
}

export function serializeHelpSetupProgress(progress:HelpSetupProgress):string{
 const steps:HelpSetupProgress={};
 for(const id of helpSetupStepIds){
  const value=progress[id];
  if(value&&allowedStatuses.has(value))steps[id]=value;
 }
 return JSON.stringify({version:1,steps});
}

export function helpSetupSteps(articles:readonly {id:string;route:string}[],mode:"scrum"|"kanban"|null):readonly HelpSetupStep[]{
 const permitted=new Map(articles.map(article=>[article.id,article.route]));
 const candidates:readonly {id:HelpSetupStepId;articleId:string}[]=[
  {id:"general",articleId:"general-settings"},
  {id:"team",articleId:"teams"},
  {id:"members",articleId:"members"},
  {id:"calendar",articleId:"calendar"},
  {id:"cadence",articleId:mode==="scrum"?"sprints":"kanban-periods"},
  {id:"tickets",articleId:"tickets"},
  {id:"reports",articleId:"reports"},
  {id:"backup",articleId:"backup"}
 ];
 return candidates.flatMap(item=>{
  const route=permitted.get(item.articleId);
  return route?[{...item,route}]:[];
 });
}

export function helpSetupDoneCount(progress:HelpSetupProgress,steps:readonly HelpSetupStep[]):number{
 return steps.filter(step=>progress[step.id]==="done").length;
}
