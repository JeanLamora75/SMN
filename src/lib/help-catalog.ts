import {canAccess,type AccessActor} from "@/server/access-policy";

/**
 * Stable, language-neutral metadata. Article bodies, indexes and UI labels are
 * supplied by later help features; no locale or private team data belongs here.
 */
export type HelpSection="getting-started"|"configuration"|"modules"|"troubleshooting";
export type HelpMode="scrum"|"kanban";
export type HelpResource="collective"|"settings"|"accounts"|"backups";
export type HelpArticle=Readonly<{
 id:string;
 section:HelpSection;
 route:string;
 contexts:readonly string[];
 modes:readonly HelpMode[]|null;
 resource:HelpResource;
}>;

const records=[
 {id:"overview",section:"getting-started",route:"/app",contexts:[],modes:null,resource:"collective"},
 {id:"dashboard",section:"modules",route:"/app",contexts:["/app","/app/dashboard-builder"],modes:null,resource:"collective"},
 {id:"general-settings",section:"configuration",route:"/app/admin/settings/general",contexts:["/app/admin/settings/general","/app/admin/settings"],modes:null,resource:"settings"},
 {id:"teams",section:"configuration",route:"/app/admin/settings/teams",contexts:["/app/admin/settings/teams"],modes:null,resource:"settings"},
 {id:"members",section:"modules",route:"/app/admin/members",contexts:["/app/admin/members"],modes:null,resource:"settings"},
 {id:"sprints",section:"modules",route:"/app/admin/sprints",contexts:["/app/admin/sprints"],modes:["scrum"],resource:"collective"},
 {id:"kanban-periods",section:"modules",route:"/app/admin/kanban-periods",contexts:["/app/admin/kanban-periods"],modes:["kanban"],resource:"collective"},
 {id:"tickets",section:"modules",route:"/app/tickets",contexts:["/app/tickets"],modes:null,resource:"collective"},
 {id:"calendar",section:"modules",route:"/app/team-calendar",contexts:["/app/team-calendar"],modes:null,resource:"collective"},
 {id:"registries",section:"modules",route:"/app/admin/registries",contexts:["/app/admin/registries"],modes:null,resource:"collective"},
 {id:"links",section:"modules",route:"/app/admin/links",contexts:["/app/admin/links","/app/admin/settings/links"],modes:null,resource:"settings"},
 {id:"reports",section:"modules",route:"/app/reports",contexts:["/app/reports"],modes:null,resource:"collective"},
 {id:"indicators",section:"modules",route:"/app/admin/indicators",contexts:["/app/admin/indicators"],modes:null,resource:"collective"},
 {id:"faq",section:"troubleshooting",route:"/app/help",contexts:["/app/help"],modes:null,resource:"collective"},
 {id:"jira-settings",section:"configuration",route:"/app/admin/settings/jira",contexts:["/app/admin/settings/jira"],modes:null,resource:"settings"},
 {id:"backup",section:"troubleshooting",route:"/app/admin/settings/maintenance",contexts:["/app/admin/settings/maintenance"],modes:null,resource:"backups"}
] as const satisfies readonly HelpArticle[];

export type HelpArticleId=(typeof records)[number]["id"];

/** Fail closed: malformed metadata and unregistered routes are never published. */
export function validateHelpCatalog(entries:readonly HelpArticle[],existingRoutes:ReadonlySet<string>):void{
 const ids=new Set<string>();
 const contexts=new Set<string>();
 const sections=new Set<HelpSection>(["getting-started","configuration","modules","troubleshooting"]);
 const resources=new Set<HelpResource>(["collective","settings","accounts","backups"]);
 for(const entry of entries){
  if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.id)||ids.has(entry.id))
   throw Error("help-duplicate-or-invalid-id");
  ids.add(entry.id);
  if(!sections.has(entry.section)||!resources.has(entry.resource)||
     !existingRoutes.has(entry.route)||(entry.contexts.length===0&&entry.id!=="overview"))
   throw Error("help-invalid-metadata-or-route");
  if(entry.modes!==null&&(entry.modes.length===0||
     entry.modes.some(mode=>mode!=="scrum"&&mode!=="kanban")||
     new Set(entry.modes).size!==entry.modes.length))
   throw Error("help-invalid-modes");
  for(const context of entry.contexts){
   if(!existingRoutes.has(context)||contexts.has(context))
    throw Error("help-invalid-or-duplicate-context");
   contexts.add(context);
  }
 }
}

const articles:readonly HelpArticle[]=records;

function authorized(entry:HelpArticle,actor:AccessActor|null|undefined,mode:HelpMode|null):boolean{
 return (entry.modes===null||mode!==null&&entry.modes.includes(mode))&&
  canAccess(actor,"read",{type:entry.resource,exists:true,inScope:true});
}

/** No side effects, no DB calls, no mutation of the catalog. */
export function helpCatalog(actor:AccessActor|null|undefined,mode:HelpMode|null):readonly HelpArticle[]{
 return articles.filter(entry=>authorized(entry,actor,mode));
}

export function helpArticleById(id:string,actor:AccessActor|null|undefined,mode:HelpMode|null):HelpArticle|null{
 return helpCatalog(actor,mode).find(entry=>entry.id===id)??null;
}

/** Exact context mapping only: no prefix matches, query strings or user-controlled URLs. */
export function helpArticleForContext(pathname:string,actor:AccessActor|null|undefined,mode:HelpMode|null):HelpArticle|null{
 return helpCatalog(actor,mode).find(entry=>entry.contexts.includes(pathname))??null;
}
