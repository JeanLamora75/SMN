import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import type {TeamActor} from "../teams/resolve";
import {requireIndicatorTeam} from "./team-access";
import {parseFormula,referencedTags} from "./formula";
import {recalculateIndicatorResultsWithinTransaction} from "./recalculation";
import {isCalendarSourceTag,buildDependencyGraph,type DependencyRow,type IndicatorDefinition} from "./dependencies";

export const SCREENS=["dashboard","cycle_list","cycle_detail","trends","reports"] as const;
export const STYLES=["number","card","gauge","line","bar"] as const;
export type ScreenKey=typeof SCREENS[number];
type Definition={id:string;tag:string;name:string;description:string;unit_name:string;unit_short:string;color:string|null;icon:string|null;indicator_type:"manual"|"computed";formula:string|null;formula_revision:string;type_locked:boolean;archived_at:string|null};
type Selection={team_id:string;indicator_id:string;is_active:boolean};
type Preference={team_id:string;indicator_id:string;screen_key:ScreenKey;is_visible:boolean;display_order:number;display_style:typeof STYLES[number]};
export class IndicatorCatalogError extends Error{
 constructor(public readonly code:"invalid-input"|"forbidden"|"not-found"|"conflict"|"archived"|"schema-not-ready",message=code){super(message);this.name="IndicatorCatalogError";}
}
const id=(v:unknown):v is string=>typeof v==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v);
const tag=(v:unknown):v is string=>typeof v==="string"&&/^[A-Z][A-Z0-9_]*$/.test(v);
const label=(v:unknown,max=160):v is string=>typeof v==="string"&&v.trim().length>0&&v.length<=max;
function guard(ok:unknown,code:IndicatorCatalogError["code"]):asserts ok{if(!ok)throw new IndicatorCatalogError(code);}
async function version(db:Client){const r=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");guard(r.rows[0]?.schema_version===33,"schema-not-ready");}
async function lock(db:Client){const r=await db.query("SELECT revision FROM public.smn_indicator_system_revision WHERE singleton_key='singleton' FOR UPDATE");guard(r.rows.length===1,"schema-not-ready");}
async function bump(db:Client){await db.query("UPDATE public.smn_indicator_system_revision SET revision=revision+1,updated_at=now() WHERE singleton_key='singleton'");}
export async function listIndicatorCatalog(db:Client,actor:TeamActor,teamId?:string){
 await version(db);if(actor.role!=="admin"&&!teamId)throw new IndicatorCatalogError("forbidden");
 if(teamId)await requireIndicatorTeam(db,actor,teamId).catch(()=>{throw new IndicatorCatalogError("forbidden")});
 const defs=await db.query<Definition>("SELECT id,tag,name,description,unit_name,unit_short,color,icon,indicator_type,formula,formula_revision::text,type_locked,archived_at::text FROM public.smn_indicator_definition ORDER BY tag");
 if(!teamId)return {definitions:defs.rows,teamId:null,selections:[] as Selection[],preferences:[] as Preference[]};
 const team={team_id:teamId};
 const selections=await db.query<Selection>("SELECT team_id,indicator_id,is_active FROM public.smn_indicator_team_selection WHERE team_id=$1 ORDER BY indicator_id",[team.team_id]);
 const preferences=await db.query<Preference>("SELECT team_id,indicator_id,screen_key,is_visible,display_order,display_style FROM public.smn_indicator_display_preference WHERE team_id=$1 ORDER BY screen_key,display_order,indicator_id",[team.team_id]);
 return {definitions:defs.rows,teamId:team.team_id,selections:selections.rows,preferences:preferences.rows};
}
export type CatalogCommand=
 |{action:"create";tag:string;name:string;indicatorType:"manual"|"computed";formula?:string;description?:string;unitName?:string;unitShort?:string;color?:string|null;icon?:string|null}
 |{action:"edit";indicatorId:string;name:string;description?:string;unitName?:string;unitShort?:string;color?:string|null;icon?:string|null}
 |{action:"archive";indicatorId:string}
 |{action:"selection";teamId:string;indicatorId:string;active:boolean}
 |{action:"preference";teamId:string;indicatorId:string;screenKey:ScreenKey;visible:boolean;order:number;style:typeof STYLES[number]};
function colorOk(x:unknown){return x===null||x===undefined||typeof x==="string"&&/^#[0-9a-fA-F]{6}$/.test(x);}
function meta(x:{name:string;description?:string;unitName?:string;unitShort?:string;color?:string|null;icon?:string|null}){
 guard(label(x.name), "invalid-input");guard(typeof x.description==="undefined"||typeof x.description==="string"&&x.description.length<=2000,"invalid-input");
 guard(typeof x.unitName==="undefined"||typeof x.unitName==="string"&&x.unitName.length<=80,"invalid-input");
 guard(typeof x.unitShort==="undefined"||typeof x.unitShort==="string"&&x.unitShort.length<=20,"invalid-input");
 guard(colorOk(x.color),"invalid-input");guard(typeof x.icon==="undefined"||x.icon===null||typeof x.icon==="string"&&x.icon.length<=80,"invalid-input");
}
async function deriveDependencies(db:Client,formula:string,indicatorId:string,indicatorTag:string):Promise<DependencyRow[]>{
 const tags=[...new Set(referencedTags(parseFormula(formula)))].sort();
 const definitions=await db.query<IndicatorDefinition>("SELECT id,tag,formula FROM public.smn_indicator_definition ORDER BY tag");
 const byTag=new Map(definitions.rows.map(d=>[d.tag,d.id]));
 const dependencies:DependencyRow[]=tags.map(t=>{
  const source=byTag.get(t);if(source)return {indicator_id:indicatorId,source_type:"indicator",source_indicator_id:source,source_calendar_tag:null};
  guard(isCalendarSourceTag(t),"invalid-input");
  return {indicator_id:indicatorId,source_type:"calendar",source_indicator_id:null,source_calendar_tag:t};
 });
 const old=await db.query<DependencyRow>("SELECT indicator_id,source_type,source_indicator_id,source_calendar_tag FROM public.smn_indicator_dependency");
 buildDependencyGraph([...definitions.rows,{id:indicatorId,tag:indicatorTag,formula}], [...old.rows,...dependencies]);
 return dependencies;
}
export async function applyCatalogCommand(db:Client,actor:TeamActor,command:CatalogCommand){
 guard(actor.role==="admin"||actor.role==="user","forbidden");
 guard(command&&typeof command==="object","invalid-input");
 await db.query("BEGIN");
 try{
  await version(db);
  if(command.action==="create"||command.action==="edit"||command.action==="archive")guard(actor.role==="admin","forbidden");
  if(command.action==="selection"||command.action==="preference"){
   await requireIndicatorTeam(db,actor,command.teamId).catch(()=>{throw new IndicatorCatalogError("forbidden")});
  }
  await lock(db);
  if(command.action==="create"){
   meta(command);guard(tag(command.tag)&&!isCalendarSourceTag(command.tag),"invalid-input");
   guard(command.indicatorType==="manual"||command.indicatorType==="computed","invalid-input");
   guard(command.indicatorType==="manual"?!command.formula:typeof command.formula==="string"&&command.formula.length>0,"invalid-input");
   const indicatorId=randomUUID();
   const edges=command.indicatorType==="computed"?await deriveDependencies(db,command.formula!,indicatorId,command.tag):[];
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,description,unit_name,unit_short,color,icon,indicator_type,formula) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[indicatorId,command.tag,command.name,command.description??"",command.unitName??"",command.unitShort??"",command.color??null,command.icon??null,command.indicatorType,command.indicatorType==="computed"?command.formula:null]);
   for(const e of edges)await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id,source_calendar_tag) VALUES($1,$2,$3,$4,$5)",[randomUUID(),e.indicator_id,e.source_type,e.source_indicator_id,e.source_calendar_tag]);
   // Role-derived indicators have no ordinary tag dependencies: calculate their
   // existing periods as soon as the catalog entry is created.
   if(command.indicatorType==="computed"&&/\b(?:ROLE_JH|ROLE_JH_PLANNED|ROLE_MAX_JH)\s*\(/.test(command.formula!)){
    const teams=await db.query<{id:string}>("SELECT id FROM public.smn_team WHERE installation_id='singleton' AND agile_mode IN ('scrum','kanban') AND NOT is_archived ORDER BY id LIMIT 101");
    if(teams.rows.length>100)throw new IndicatorCatalogError("invalid-input");
    for(const team of teams.rows)
     await recalculateIndicatorResultsWithinTransaction(db,{teamId:team.id,changedIndicatorIds:[indicatorId]});
   }
   await bump(db);await db.query("COMMIT");return {id:indicatorId};
  }
  if(command.action==="edit"){
   guard(id(command.indicatorId),"invalid-input");meta(command);
   const r=await db.query("UPDATE public.smn_indicator_definition SET name=$2,description=$3,unit_name=$4,unit_short=$5,color=COALESCE($6,color),icon=COALESCE($7,icon),updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING id",[command.indicatorId,command.name,command.description??"",command.unitName??"",command.unitShort??"",command.color??null,command.icon??null]);
   guard(r.rows.length===1,"not-found");
  }else if(command.action==="archive"){
   guard(id(command.indicatorId),"invalid-input");
   const r=await db.query("UPDATE public.smn_indicator_definition SET archived_at=now(),updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING id",[command.indicatorId]);guard(r.rows.length===1,"not-found");
  }else if(command.action==="selection"||command.action==="preference"){
   guard(id(command.teamId)&&id(command.indicatorId),"invalid-input");

   const d=await db.query<{archived_at:string|null}>("SELECT archived_at::text FROM public.smn_indicator_definition WHERE id=$1 FOR SHARE",[command.indicatorId]);guard(d.rows.length===1,"not-found");
   if(command.action==="selection"){
    guard(typeof command.active==="boolean","invalid-input");
    if(command.active)guard(d.rows[0].archived_at===null,"archived");
    await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id,is_active) VALUES($1,$2,$3) ON CONFLICT(team_id,indicator_id) DO UPDATE SET is_active=EXCLUDED.is_active,updated_at=now()",[command.teamId,command.indicatorId,command.active]);
   }else{
    guard(SCREENS.includes(command.screenKey)&&STYLES.includes(command.style)&&typeof command.visible==="boolean"&&Number.isSafeInteger(command.order)&&command.order>=0&&command.order<=100000,"invalid-input");
    const selected=await db.query("SELECT 1 FROM public.smn_indicator_team_selection WHERE team_id=$1 AND indicator_id=$2 AND is_active=true FOR SHARE",[command.teamId,command.indicatorId]);guard(selected.rows.length===1,"conflict");
    await db.query("INSERT INTO public.smn_indicator_display_preference(team_id,indicator_id,screen_key,is_visible,display_order,display_style) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(team_id,indicator_id,screen_key) DO UPDATE SET is_visible=EXCLUDED.is_visible,display_order=EXCLUDED.display_order,display_style=EXCLUDED.display_style,updated_at=now()",[command.teamId,command.indicatorId,command.screenKey,command.visible,command.order,command.style]);
   }
  }else throw new IndicatorCatalogError("invalid-input");
  await bump(db);await db.query("COMMIT");return {ok:true};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);if(error&&typeof error==="object"&&"code" in error&&error.code==="23505")throw new IndicatorCatalogError("conflict");throw error;}
}
