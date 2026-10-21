import type {TranslationKey} from "@/i18n/catalog";

export type PrivateMode = "scrum" | "kanban";
export type PrivateRole = "admin" | "user";
export type NavigationEntry = Readonly<{
  id: string;
  label: TranslationKey;
  href: string | null;
  icon: string;
}>;
export type NavigationGroup = Readonly<{
  id: string;
  label: TranslationKey;
  entries: readonly NavigationEntry[];
}>;

/** Navigation explicite : aucune route de fonctionnalité future n'est cliquable. */
export function privateNavigation(mode: PrivateMode | null, role: PrivateRole): readonly NavigationGroup[] {
  if (mode !== null && mode !== "scrum" && mode !== "kanban") throw new Error("navigation-mode-unsupported");
  if (role !== "admin" && role !== "user") throw new Error("navigation-role-unsupported");
  const groups: NavigationGroup[] = [
    {id:"pilotage",label:"navigation.groups.pilotage",entries:[
      {id:"dashboard",label:"navigation.entries.dashboard",href:"/app",icon:"▦"},
      {id:"security",label:"navigation.entries.security",href:"/app/security",icon:"♧"},
    ]},
    {id:"calendar",label:"navigation.groups.calendar",entries:[
      {id:"centralCalendar",label:"centralCalendar.title",href:"/app/team-calendar",icon:"◫"},
      {id:"events",label:"navigation.entries.events",href:null,icon:"◫"},
    ]},
    {id:"cycles",label:"navigation.groups.cycles",entries:[
      {id:"cycles",label:mode==="scrum"?"navigation.entries.sprints":mode==="kanban"?"navigation.entries.kanbanPeriods":"navigation.entries.cyclesUnknown",href:mode==="scrum"&&role==="admin"?"/app/admin/sprints":null,icon:"◷"},
      {id:"reviews",label:"navigation.entries.reviews",href:null,icon:"▤"},
    ]},
    {id:"registers",label:"navigation.groups.registers",entries:[
      {id:"risks",label:"navigation.entries.risks",href:null,icon:"◇"},
    ]},
    {id:"reports",label:"navigation.groups.reports",entries:[
      {id:"reporting",label:"navigation.entries.reporting",href:null,icon:"▤"},
      {id:"briefs",label:"navigation.entries.briefs",href:null,icon:"◈"},
    ]},
  ];
  if (role === "admin") groups.push({
    id:"admin",label:"navigation.groups.admin",entries:[
      {id:"users",label:"navigation.entries.users",href:"/app/admin/users",icon:"⚙"},
      {id:"settings",label:"navigation.entries.settings",href:"/app/admin/settings",icon:"⚙"},
      {id:"scrumCadence",label:"scrumCadence.title",href:mode==="scrum"?"/app/admin/scrum-cadence":null,icon:"◷"},
      {id:"audit",label:"navigation.entries.audit",href:"/app/admin/audit",icon:"▤"},
      {id:"backups",label:"navigation.entries.backups",href:"/app/admin/backups",icon:"▣"},
      {id:"members",label:"navigation.entries.members",href:"/app/admin/members",icon:"♙"},
      {id:"countries",label:"navigation.entries.countries",href:"/app/admin/countries",icon:"◎"},
    ],
  });
  return groups;
}

/** Seules les pages réellement implémentées sont actives. */
export function activePrivateEntry(pathname: string, entry: NavigationEntry): boolean {
  return entry.href !== null && entry.href === pathname;
}
