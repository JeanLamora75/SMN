import type {TranslationKey} from "@/i18n/catalog";
import {canAccess,type AccessActor} from "@/server/access-policy";

export type SettingsAvailability="available"|"partial"|"planned"|"not-applicable";
export type SettingsSection="application"|"agile"|"calendar"|"administration";
export type SettingsEntry=Readonly<{id:string;label:TranslationKey;description:TranslationKey;icon:string;
 href:string|null;status:SettingsAvailability;section:SettingsSection}>;
export type SettingsGroup=Readonly<{id:SettingsSection;label:TranslationKey;entries:SettingsEntry[]}>;
type Resource="settings"|"accounts"|"backups"|"audit";
type RecordEntry={id:string;icon:string;resources:readonly Resource[];
 href?:string;status?:SettingsAvailability;mode?:"scrum"|"kanban"};
const catalog:ReadonlyArray<{id:SettingsSection;label:TranslationKey;entries:readonly RecordEntry[]}>= [
 {id:"application",label:"settingsCatalog.groups.application",entries:[
  {id:"preferences",icon:"⚙",resources:["settings"],href:"/app/admin/settings/general"}
 ]},
 {id:"agile",label:"settingsCatalog.groups.agile",entries:[
  {id:"teams",icon:"♧",resources:["settings"],href:"/app/admin/settings/teams",status:"partial"},
  {id:"cadence",icon:"◷",resources:["settings"],href:"/app/admin/scrum-cadence"},
  {id:"ceremonies",icon:"◫",resources:["settings"],href:"/app/admin/settings/ceremonies",status:"partial",mode:"scrum"},
  {id:"capacity",icon:"▤",resources:["settings"],status:"planned"},
  {id:"registries",icon:"▥",resources:["settings"],href:"/app/admin/settings/registries"},
  {id:"links",icon:"🔗",resources:["settings"],href:"/app/admin/settings/links",status:"partial"}
 ]},
 {id:"calendar",label:"settingsCatalog.groups.calendar",entries:[
  {id:"workingDays",icon:"▦",resources:["settings"],href:"/app/admin/settings/working-days",status:"partial",mode:"scrum"},
  {id:"holidaysClosures",icon:"◎",resources:["settings"],href:"/app/admin/settings/holidays-closures"},
  {id:"absences",icon:"◈",resources:["settings"],href:"/app/admin/absence-categories"}
 ]},
 {id:"administration",label:"settingsCatalog.groups.administration",entries:[
  {id:"users",icon:"♙",resources:["accounts"],href:"/app/admin/users"},
  {id:"security",icon:"♧",resources:["settings"],href:"/app/security",status:"partial"},
  {id:"maintenance",icon:"▣",resources:["backups","audit"],href:"/app/admin/settings/maintenance"}
 ]}
];

export function settingsCatalog(mode:"scrum"|"kanban"|null,actor:AccessActor):SettingsGroup[]{
 return catalog.map(group=>({
  id:group.id,label:group.label,
  entries:group.entries.filter(e=>e.resources.some(resource=>
   canAccess(actor,"read",{type:resource,exists:true,inScope:true})))
   .map(e=>{
    const applicable=!e.mode||e.mode===mode;
    const status:SettingsAvailability=applicable?(e.status??"available"):"not-applicable";
    const href=e.id==="cadence"
      ?mode==="scrum"?"/app/admin/scrum-cadence":mode==="kanban"?"/app/admin/kanban-cadence":null
      :e.href??null;
    return {id:e.id,section:group.id,icon:e.icon,
     label:("settingsCatalog.items."+e.id+".title") as TranslationKey,
     description:("settingsCatalog.items."+e.id+".description") as TranslationKey,
     status:!applicable?"not-applicable":e.id==="cadence"&&!href?"planned":status,
     href:applicable?href:null};
   })
 }));
}
