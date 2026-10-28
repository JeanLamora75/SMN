import type {TranslationKey} from "@/i18n/catalog";
import {canAccess,type AccessActor} from "@/server/access-policy";

export type SettingsAvailability="available"|"partial"|"planned"|"not-applicable";
export type SettingsSection="application"|"agile"|"calendar"|"administration";
export type SettingsEntry=Readonly<{id:string;label:TranslationKey;description:TranslationKey;icon:string;
 href:string|null;status:SettingsAvailability;section:SettingsSection}>;
export type SettingsGroup=Readonly<{id:SettingsSection;label:TranslationKey;entries:SettingsEntry[]}>;
type RecordEntry={id:string;icon:string;resource:"settings"|"accounts"|"backups"|"audit";
 mode?:"scrum"|"kanban";href?:string;status?:SettingsAvailability};
const catalog:ReadonlyArray<{id:SettingsSection;label:TranslationKey;entries:readonly RecordEntry[]}>= [
 {id:"application",label:"settingsCatalog.groups.application",entries:[
  {id:"general",icon:"⚙",resource:"settings",href:"/app/admin/settings/general"},
  {id:"languages",icon:"文",resource:"settings",href:"/app/admin/settings/general#settings-language"},
  {id:"appearance",icon:"◐",resource:"settings",href:"/app/admin/settings/general#settings-appearance"}
 ]},
 {id:"agile",label:"settingsCatalog.groups.agile",entries:[
  {id:"teams",icon:"♧",resource:"settings",href:"/app/admin/settings/teams",status:"partial"},
  {id:"cadence",icon:"◷",resource:"settings",href:"/app/admin/scrum-cadence",mode:"scrum"},
  {id:"kanbanCadence",icon:"◷",resource:"settings",href:"/app/admin/kanban-cadence",mode:"kanban"},
  {id:"ceremonies",icon:"◫",resource:"settings",href:"/app/admin/settings/ceremonies",status:"partial",mode:"scrum"},
  {id:"capacity",icon:"▤",resource:"settings",status:"partial"},
  {id:"registries",icon:"▥",resource:"settings",href:"/app/admin/settings/registries"},
  {id:"links",icon:"🔗",resource:"settings",href:"/app/admin/settings/links",status:"partial"}
 ]},
 {id:"calendar",label:"settingsCatalog.groups.calendar",entries:[
  {id:"workingDays",icon:"▦",resource:"settings",href:"/app/admin/settings/working-days",status:"partial",mode:"scrum"},
  {id:"countries",icon:"◎",resource:"settings",href:"/app/admin/countries"},
  {id:"closures",icon:"▣",resource:"settings",href:"/app/admin/company-closures"},
  {id:"absences",icon:"◈",resource:"settings",href:"/app/admin/absence-categories"}
 ]},
 {id:"administration",label:"settingsCatalog.groups.administration",entries:[
  {id:"users",icon:"♙",resource:"accounts",href:"/app/admin/users"},
  {id:"security",icon:"♧",resource:"settings",href:"/app/security",status:"partial"},
  {id:"backups",icon:"▣",resource:"backups",href:"/app/admin/backups"},
  {id:"audit",icon:"▤",resource:"audit",href:"/app/admin/audit"}
 ]}
];

/** Read-only ordered catalogue. Never grants access to a destination. */
export function settingsCatalog(mode:"scrum"|"kanban"|null,actor:AccessActor):SettingsGroup[]{
 return catalog.map(group=>({
  id:group.id,label:group.label,
  entries:group.entries.filter(e=>canAccess(actor,"read",{type:e.resource,exists:true,inScope:true}))
   .map(e=>{
    const applicable=!e.mode||e.mode===mode;
    const status:SettingsAvailability=applicable?(e.status??"available"):"not-applicable";
    return {id:e.id,section:group.id,icon:e.icon,
     label:("settingsCatalog.items."+e.id+".title") as TranslationKey,
     description:("settingsCatalog.items."+e.id+".description") as TranslationKey,
     status,href:applicable?e.href??null:null};
   })
 }));
}
