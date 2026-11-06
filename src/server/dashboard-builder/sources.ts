import type { Client } from "pg";
import { requireDashboardPermission } from "./permissions";
import type { LayoutScope } from "./layout";

export const SOURCE_CATEGORIES = ["indicator", "registry", "cycle", "calendar", "notes", "objective", "team", "link"] as const;
export const SOURCE_VIEWS = ["number", "card", "card-watermark", "tachometer", "gauge", "line", "bar", "bar-horizontal", "battery-horizontal", "battery-vertical", "list", "list-watermark", "text"] as const;
export type SourceCategory = typeof SOURCE_CATEGORIES[number];
export type SourceView = typeof SOURCE_VIEWS[number];
export type SourceScope = "cycle" | "team";
export type SourceStatus = "available" | "unavailable" | "unknown" | "incompatible";
export type SourceDescriptor = Readonly<{
  code: string;
  name: string;
  category: SourceCategory;
  unit: string | null;
  scope: SourceScope;
  permission: "read";
  views: readonly SourceView[];
  status: "available" | "unavailable";
  reason?: string;
}>;
export type SourceResolution =
  | { status: "available"; source: SourceDescriptor }
  | { status: "unavailable"; source: SourceDescriptor; reason: string }
  | { status: "unknown"; code: string }
  | { status: "incompatible"; source: SourceDescriptor; view: string };

const descriptor = (s: SourceDescriptor): SourceDescriptor => Object.freeze({...s, views: Object.freeze([...s.views])});
const allowedViews = (v: readonly SourceView[]): boolean => v.every(x => SOURCE_VIEWS.includes(x));
const sourceCode = (v: string) => /^[A-Za-z][A-Za-z0-9:_-]{0,119}$/.test(v);

/** Public metadata only: adapters never own, calculate or mutate business values. */
export function resolveDashboardSource(sources: readonly SourceDescriptor[], code: string, view: string): SourceResolution {
  const source=sources.find(s=>s.code===code);
  if(!source)return {status:"unknown",code};
  if(source.status==="unavailable")return {status:"unavailable",source,reason:source.reason??"source-unavailable"};
  if(!source.views.includes(view as SourceView))return {status:"incompatible",source,view};
  return {status:"available",source};
}
export function validateSourceDescriptors(sources:readonly SourceDescriptor[]): void {
 const seen=new Set<string>();
 for(const s of sources){
  if(!sourceCode(s.code)||!s.name.trim()||seen.has(s.code)||
    !SOURCE_CATEGORIES.includes(s.category)||!["cycle","team"].includes(s.scope)||
    s.permission!=="read"||!allowedViews(s.views)||s.views.length===0||
    !["available","unavailable"].includes(s.status))throw Error("dashboard-source-invalid");
  seen.add(s.code);
 }
}

const PENDING:readonly Omit<SourceDescriptor,"status"|"reason">[] = [
 {code:"cycle:overview",name:"Cycles Scrum/Kanban",category:"cycle",unit:null,scope:"cycle",permission:"read",views:["card","card-watermark","list","list-watermark"]},
 {code:"objective:team",name:"Objectifs",category:"objective",unit:null,scope:"team",permission:"read",views:["text","card","card-watermark"]},
 {code:"team:overview",name:"Équipe",category:"team",unit:null,scope:"team",permission:"read",views:["card","list"]},
 {code:"link:catalog",name:"Liens",category:"link",unit:null,scope:"team",permission:"read",views:["list","list-watermark"]},
];
type IndicatorMeta={id:string;tag:string;name:string;unit:string|null;display_style:string|null;is_selected:boolean;is_visible:boolean};
const styles:readonly SourceView[]=["number","card","card-watermark","tachometer","gauge","line","bar","bar-horizontal","battery-horizontal","battery-vertical"];

/**
 * Read-only metadata query. Indicator selections (v33), archived flags and explicit
 * dashboard team grants are authoritative. Admins may also see inactive definitions
 * as disabled suggestions, so the picker explains what needs configuring.
 * Non-admins cannot discover definitions not selected for their team.
 * No synthetic Fxx or fallback KPI.
 * Non-indicator domains remain unavailable until their typed read adapters ship.
 */
export async function listDashboardSources(db:Client,scope:LayoutScope):Promise<readonly SourceDescriptor[]>{
 await requireDashboardPermission(db,scope,"read");
 const schema=await db.query<{schema_version:number}>(
 "SELECT schema_version FROM public.smn_installation WHERE id=$1 AND state='initialized'",[scope.installationId]);
 const ready=schema.rows[0]?.schema_version===33;
 let indicators:SourceDescriptor[]=[];
 if(ready){
  const result=await db.query<IndicatorMeta>(`
 SELECT d.id,d.tag,d.name,d.unit_short AS unit,p.display_style,
   COALESCE(s.is_active,false) AS is_selected,
   COALESCE(p.is_visible,true) AS is_visible
 FROM public.smn_indicator_definition d
 LEFT JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id
  AND s.team_id=$1
 LEFT JOIN public.smn_indicator_display_preference p ON p.indicator_id=d.id
  AND p.team_id=$1 AND p.screen_key='dashboard'
 WHERE d.archived_at IS NULL
   AND (COALESCE(s.is_active,false)=true OR EXISTS (
     SELECT 1 FROM public.smn_account a
     WHERE a.id=$2 AND a.installation_id=$3 AND a.role='admin'
       AND a.is_active=true AND a.must_change_password=false
   ))
 ORDER BY d.tag,d.id`,[scope.teamId,scope.accountId,scope.installationId]);
  indicators=result.rows.map(row=>{
   const selected=row.is_selected===true;
   const visible=row.is_visible!==false;
   return descriptor({
    code:"indicator:"+row.id,name:row.name,category:"indicator",unit:row.unit??null,
    scope:"cycle",permission:"read",views:styles,
    status:selected&&visible?"available":"unavailable",
    ...(!selected?{reason:"indicator-not-selected"}:!visible?{reason:"indicator-hidden-dashboard"}:{}),
   });
  });
 }
 const pending=PENDING.map(x=>descriptor({...x,status:"unavailable",reason:"adapter-not-connected"}));
 const registry:SourceDescriptor=descriptor({code:"registry:items",name:"Risques, obstacles et dépendances",category:"registry",unit:null,scope:"team",permission:"read",views:["list","list-watermark"],status:"available"});
 const calendar:SourceDescriptor=descriptor({code:"calendar:ceremonies",name:"Calendrier et cérémonies",category:"calendar",unit:null,scope:"cycle",permission:"read",views:["list","list-watermark"],status:"available"});
 const notes:SourceDescriptor=descriptor({code:"notes:sprint",name:"Notes et alertes du sprint",category:"notes",unit:null,scope:"cycle",permission:"read",views:["list","list-watermark"],status:"available"});
 const sources=Object.freeze([...indicators,registry,calendar,notes,...pending]);
 validateSourceDescriptors(sources);
 return sources;
}
