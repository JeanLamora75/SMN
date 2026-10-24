import type {TranslationKey} from "@/i18n/catalog";

export type PrivateMode = "scrum" | "kanban";
export type PrivateRole = "admin" | "user";
export type NavigationIcon =
 "house-fill"|"people-fill"|"calendar3"|"calendar-check"|"sticky-fill"|
 "exclamation-octagon-fill"|"bar-chart-line"|"sliders"|"ticket-perforated-fill";
export type NavigationEntry = Readonly<{
 id:string;
 label:TranslationKey;
 href:string|null;
 icon:NavigationIcon;
}>;
export type NavigationGroup = Readonly<{
 id:string;
 label:TranslationKey;
 entries:readonly NavigationEntry[];
}>;

/** Side navigation: only implemented destinations are clickable.
 * The account security page remains available through Settings.
 * Group headers remain for semantics but are visually hidden by the sidebar CSS.
 */
export function privateNavigation(mode:PrivateMode|null,role:PrivateRole):readonly NavigationGroup[]{
 if(mode!==null&&mode!=="scrum"&&mode!=="kanban")throw Error("navigation-mode-unsupported");
 if(role!=="admin"&&role!=="user")throw Error("navigation-role-unsupported");
 const groups:NavigationGroup[]=[
  {id:"pilotage",label:"navigation.groups.pilotage",entries:[
   {id:"dashboard",label:"navigation.entries.dashboard",href:"/app",icon:"house-fill"},
   {id:"members",label:"navigation.entries.members",href:role==="admin"?"/app/admin/members":null,icon:"people-fill"},
   {id:"centralCalendar",label:"navigation.entries.calendar",href:"/app/team-calendar",icon:"calendar3"}
  ]},
  {id:"cycles",label:"navigation.groups.cycles",entries:[
   {id:"cycles",label:mode==="scrum"?"navigation.entries.sprints":mode==="kanban"?
    "navigation.entries.kanbanPeriods":"navigation.entries.cyclesUnknown",
    href:mode==="scrum"?"/app/admin/sprints":null,icon:"calendar-check"},
   {id:"reviews",label:"navigation.entries.reviews",href:null,icon:"sticky-fill"}
  ]},
  {id:"registers",label:"navigation.groups.registers",entries:[
   {id:"risks",label:"navigation.entries.risks",href:"/app/admin/registries",icon:"exclamation-octagon-fill"}
  ]},
  {id:"reports",label:"navigation.groups.reports",entries:[
   {id:"reporting",label:"navigation.entries.reporting",href:null,icon:"bar-chart-line"},
   {id:"briefs",label:"navigation.entries.briefs",href:null,icon:"ticket-perforated-fill"}
  ]}
 ];
 if(role==="admin")groups.push({id:"admin",label:"navigation.groups.admin",entries:[
  {id:"settings",label:"navigation.entries.settings",href:"/app/admin/settings",icon:"sliders"}
 ]});
 return groups;
}

/** Active state derives from real implemented routes, never placeholders. */
export function activePrivateEntry(pathname:string,entry:NavigationEntry):boolean{
 return entry.href!==null&&(entry.href===pathname||
  (entry.id==="members"&&pathname.startsWith("/app/admin/members/"))||
  (entry.id==="centralCalendar"&&pathname.startsWith("/app/team-calendar/"))||
  (entry.id==="settings"&&pathname.startsWith("/app/admin/settings/"))||
  (entry.id==="risks"&&pathname.startsWith("/app/admin/registries/"))||
  (entry.id==="cycles"&&entry.href==="/app/admin/sprints"&&
    pathname.startsWith("/app/admin/sprints/")));
}
