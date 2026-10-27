import type {TranslationKey} from "@/i18n/catalog";

export type PrivateMode = "scrum" | "kanban";
export type PrivateRole = "admin" | "user";
export type NavigationIcon =
 "house-fill"|"people-fill"|"calendar3"|"calendar-check"|"sticky-fill"|
 "exclamation-octagon-fill"|"bar-chart-line"|"sliders"|"stack"|"ticket-perforated-fill";
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
   {id:"members",label:"navigation.entries.members",
    href:role==="admin"?"/app/admin/members":null,icon:"people-fill"},
   {id:"cycles",label:mode==="scrum"?"navigation.entries.sprint":
    mode==="kanban"?"navigation.entries.kanbanPeriods":"navigation.entries.cyclesUnknown",
    href:mode==="scrum"?"/app/admin/sprints":null,icon:"calendar-check"},
   {id:"centralCalendar",label:"navigation.entries.calendar",
    href:"/app/team-calendar",icon:"calendar3"},
   {id:"risks",label:"navigation.entries.register",
    href:"/app/admin/registries",icon:"stack"},
   {id:"links",label:"navigation.entries.links",href:role==="admin"?"/app/admin/links":null,icon:"stack"},
   {id:"reporting",label:"navigation.entries.reporting",href:"/app/reports",icon:"bar-chart-line"}
  ]}
 ];
 if(role==="admin")groups.push({
  id:"admin",label:"navigation.groups.admin",entries:[
   {id:"settings",label:"navigation.entries.settings",
    href:"/app/admin/settings",icon:"sliders"}
  ]
 });
 return groups;
}

/** Active state derives from real implemented routes, never placeholders. */
export function activePrivateEntry(pathname:string,entry:NavigationEntry):boolean{
 return entry.href!==null&&(entry.href===pathname||
  (entry.id==="links"&&pathname.startsWith("/app/admin/links/"))||
  (entry.id==="reporting"&&pathname.startsWith("/app/reports/"))||
  (entry.id==="members"&&pathname.startsWith("/app/admin/members/"))||
  (entry.id==="centralCalendar"&&pathname.startsWith("/app/team-calendar/"))||
  (entry.id==="settings"&&pathname.startsWith("/app/admin/settings/"))||
  (entry.id==="risks"&&pathname.startsWith("/app/admin/registries/"))||
  (entry.id==="cycles"&&entry.href==="/app/admin/sprints"&&
    pathname.startsWith("/app/admin/sprints/")));
}
