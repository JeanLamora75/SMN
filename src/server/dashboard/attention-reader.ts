import type {Client} from "pg";
import {
 collectionAvailable,collectionUnavailable,
 type DashboardAttention,type DashboardCollection
} from "@/lib/dashboard-data-contract";

type Collection=DashboardCollection<DashboardAttention>;
const exists=async(db:Client,table:string)=>{
 const result=await db.query<{present:boolean}>("SELECT to_regclass($1) IS NOT NULL AS present",["public."+table]);
 return result.rows[0]?.present===true;
};
/** Appartenance explicite au cycle, ou date du registre historique créé avant la liaison. */
export async function readCycleRegistry(db:Client,teamId:string,cycleId:string,
 from:string,to:string,kind:"risk"|"obstacle"):Promise<Collection>{
 if(!await exists(db,"smn_registry_item"))return collectionUnavailable("schema-missing");
 const hasLinks=await exists(db,"smn_registry_cycle_link");
 const associated=hasLinks?
  "(EXISTS(SELECT 1 FROM public.smn_registry_cycle_link l WHERE l.item_id=r.id AND l.sprint_id=$3) OR r.occurred_on BETWEEN $4::date AND $5::date)":
  "r.occurred_on BETWEEN $4::date AND $5::date";
 const closed=kind==="risk"?["resolved"]:["resolved","abandoned"];
 const where=`r.team_id=$1 AND r.type=$2 AND r.status<>ALL($6::text[]) AND ${associated}`;
 const params=[teamId,kind,cycleId,from,to,closed];
 const count=await db.query<{total:number}>(`SELECT COUNT(*)::int AS total FROM public.smn_registry_item r WHERE ${where}`,params);
 const order=kind==="risk"?
  "r.due_on ASC NULLS LAST,r.occurred_on ASC,r.id ASC":
  "r.occurred_on ASC,r.id ASC";
 const rows=await db.query<{id:string;title:string;status:string}>(`
  SELECT r.id,r.title,r.status FROM public.smn_registry_item r WHERE ${where}
  ORDER BY ${order} LIMIT 5`,params);
 return collectionAvailable(rows.rows.map(row=>({
  id:row.id,kind,title:row.title,status:row.status,
  priority:null,href:"/app/admin/registries/"+encodeURIComponent(row.id)
 })),count.rows[0]?.total??rows.rows.length,{source:"manual"});
}
/** Tâches globales : titre traduit côté UI, jamais attribuées artificiellement au Sprint. */
export async function readCycleNotesAndAlerts(db:Client,teamId:string,cycleId:string):Promise<Collection>{
 const hasNotes=await exists(db,"smn_dashboard_note");
 const hasTasks=await exists(db,"smn_configuration_task");
 if(!hasNotes&&!hasTasks)return collectionUnavailable("schema-missing");
 const notes:DashboardAttention[]=[];
 if(hasNotes){
  const rows=await db.query<{id:string;body:string;status:string}>(`
   SELECT n.id,n.body,n.status FROM public.smn_dashboard_note n
   JOIN public.smn_sprint s ON s.id=n.sprint_id AND s.team_id=n.team_id
   WHERE n.team_id=$1 AND n.sprint_id=$2 AND n.status<>'done'
   ORDER BY n.created_at DESC,n.id DESC`,[teamId,cycleId]);
  for(const row of rows.rows)notes.push({
   id:row.id,kind:"note",title:row.body,status:row.status,priority:null
  });
 }
 const alerts:DashboardAttention[]=[];
 const completed:DashboardAttention[]=[];
 if(hasTasks){
  const rows=await db.query<{task_key:string;status:string}>(`
   SELECT task_key,status FROM public.smn_configuration_task
   WHERE installation_id='singleton' AND status IN ('todo','done')
   ORDER BY CASE task_key WHEN 'reference-country' THEN 1
      WHEN 'recovery-phrase' THEN 2 WHEN 'display-preferences' THEN 3 ELSE 4 END`);
  const allowed=new Set(["reference-country","recovery-phrase","display-preferences"]);
  for(const row of rows.rows){
   if(!allowed.has(row.task_key)||!["todo","done"].includes(row.status))continue;
   const item:DashboardAttention={id:"configuration:"+row.task_key,
    kind:row.status==="todo"?"alert":"note",title:row.task_key,
    status:row.status,priority:null,configurationKey:row.task_key as "reference-country"|"recovery-phrase"|"display-preferences"};
   if(row.status==="todo")alerts.push(item);else completed.push(item);
  }
 }
 const all=[...alerts,...notes,...completed];
 return collectionAvailable(all.slice(0,5),all.length,{source:"manual"});
}
