import type {TranslationKey} from "@/i18n/catalog";
import {canAccess,type AccessActor} from "@/server/access-policy";

/** Single canonical source for the six settings families. All user-facing strings are i18n keys. */
export type SettingsAvailability="available"|"partial"|"planned"|"not-applicable";
export type SettingsSection="application"|"organization"|"practices"|"calendar"|"reports"|"administration";
export type SettingsIcon="sliders"|"people-fill"|"calendar3"|"calendar-check"|
 "calendar-event"|"bar-chart-line"|"stack"|"link-45deg"|"grid-3x3-gap"|
 "list-ul"|"floppy"|"tag"|"hourglass-split"|"bullseye"|"ticket-perforated-fill"|
 "exclamation-triangle-fill"|"pencil-square"|"search";
export type SettingsEntry=Readonly<{id:string;label:TranslationKey;description:TranslationKey;
 keywords:TranslationKey;icon:SettingsIcon;href:string|null;
 status:SettingsAvailability;section:SettingsSection}>;
export type SettingsGroup=Readonly<{id:SettingsSection;label:TranslationKey;entries:SettingsEntry[]}>;
type Resource="settings"|"accounts"|"backups"|"audit";
type RecordEntry={id:string;icon:SettingsIcon;resources:readonly Resource[];
 href?:string;status?:SettingsAvailability;mode?:"scrum"|"kanban";adminOnly?:boolean};

const catalog:ReadonlyArray<{id:SettingsSection;entries:readonly RecordEntry[]}>= [
 {id:"application",entries:[
  {id:"preferences",icon:"sliders",resources:["settings"],href:"/app/admin/settings/general"},
  {id:"languages",icon:"list-ul",resources:["settings"],href:"/app/admin/settings/general#settings-language"},
  {id:"appearance",icon:"bullseye",resources:["settings"],href:"/app/admin/settings/general#settings-appearance"}
 ]},
 {id:"organization",entries:[
  {id:"teams",icon:"people-fill",resources:["settings"],href:"/app/admin/settings/teams",status:"partial"},
  {id:"companies",icon:"stack",resources:["settings"],href:"/app/admin/companies",adminOnly:true},
  {id:"cadence",icon:"calendar-check",resources:["settings"]}
 ]},
 {id:"practices",entries:[
  {id:"ceremonies",icon:"calendar-event",resources:["settings"],href:"/app/admin/settings/ceremonies",status:"partial",mode:"scrum"},
  {id:"capacity",icon:"hourglass-split",resources:["settings"],status:"planned"},
  {id:"indicators",icon:"bar-chart-line",resources:["settings"],href:"/app/admin/settings/indicators",adminOnly:true},
  {id:"registries",icon:"stack",resources:["settings"],href:"/app/admin/settings/registries"},
  {id:"links",icon:"link-45deg",resources:["settings"],href:"/app/admin/settings/links",status:"partial",adminOnly:true}
 ]},
 {id:"calendar",entries:[
  {id:"workingDays",icon:"calendar3",resources:["settings"],href:"/app/admin/settings/working-days",status:"partial",mode:"scrum"},
  {id:"holidays",icon:"calendar-event",resources:["settings"],href:"/app/admin/settings/holidays-closures#holidays"},
  {id:"closures",icon:"calendar-check",resources:["settings"],href:"/app/admin/settings/holidays-closures#closures",adminOnly:true},
  {id:"absences",icon:"calendar3",resources:["settings"],href:"/app/admin/absence-categories"}
 ]},
 {id:"reports",entries:[
  {id:"chartStyles",icon:"bar-chart-line",resources:["settings"],href:"/app/admin/settings/reports/charts",adminOnly:true}
 ]},
 {id:"administration",entries:[
  {id:"users",icon:"people-fill",resources:["accounts"],href:"/app/admin/users"},
  {id:"security",icon:"sliders",resources:["settings"],href:"/app/security",status:"partial"},
  {id:"maintenance",icon:"floppy",resources:["backups","audit"],href:"/app/admin/settings/maintenance",adminOnly:true}
 ]}
];
/** Do not expose hidden/private entries to the browser, including through search aliases. */
export function settingsCatalog(mode:"scrum"|"kanban"|null,actor:AccessActor):SettingsGroup[]{
 return catalog.map(group=>({
  id:group.id,
  label:("settingsCatalog.groups."+group.id) as TranslationKey,
  entries:group.entries.filter(e=>(!e.adminOnly||actor.role==="admin")&&e.resources.some(resource=>
   canAccess(actor,"read",{type:resource,exists:true,inScope:true})))
   .map(e=>{
    const applicable=!e.mode||e.mode===mode;
    const href=e.id==="cadence"?
      mode==="scrum"?"/app/admin/scrum-cadence":
      mode==="kanban"?"/app/admin/kanban-cadence":null
      :e.href??null;
    const status:SettingsAvailability=!applicable?"not-applicable":
      e.id==="cadence"&&!href?"planned":(e.status??"available");
    return {id:e.id,section:group.id,icon:e.icon,
     label:("settingsCatalog.items."+e.id+".title") as TranslationKey,
     description:("settingsCatalog.items."+e.id+".description") as TranslationKey,
     keywords:("settingsCatalog.keywords."+e.id) as TranslationKey,
     status,href:applicable?href:null};
   })
 })).filter(group=>group.entries.length>0);
}
