import type {Client} from "pg";
import {criticality,type Level} from "@/lib/risk-criticality";
import {
 collectionAvailable,collectionUnavailable,
 type DashboardAttention,type DashboardCollection
} from "@/lib/dashboard-data-contract";

type Collection=DashboardCollection<DashboardAttention>;
const exists=async(db:Client,table:string)=>{
 const result=await db.query<{present:boolean}>("SELECT to_regclass($1) IS NOT NULL AS present",["public."+table]);
 return result.rows[0]?.present===true;
};
/** Une liaison explicite prime ; les fiches sans liaison restent des éléments d’équipe. */
export async function readCycleRegistry(db:Client,teamId:string,cycleId:string,
 kind:"risk"|"obstacle",allowOwner=false):Promise<Collection>{
 if(!await exists(db,"smn_registry_item"))return collectionUnavailable("schema-missing");
 const hasLinks=await exists(db,"smn_registry_cycle_link");
 const hasRoam=kind==="risk"&&await exists(db,"smn_risk_roam");
 const hasAssessment=kind==="risk"&&await exists(db,"smn_risk_assessment");
 const linked="EXISTS(SELECT 1 FROM public.smn_registry_cycle_link l WHERE l.item_id=r.id AND l.sprint_id=$3)";
 // Les fiches héritées sans Sprint restent visibles comme points d’équipe,
 // jamais présentées comme si elles appartenaient au Sprint sélectionné.
 const associated=hasLinks?
  `(${linked} OR NOT EXISTS(SELECT 1 FROM public.smn_registry_cycle_link any_link WHERE any_link.item_id=r.id))`:
  "TRUE";
 const closed=kind==="risk"?["resolved"]:["resolved","abandoned"];
 const roamClause=hasRoam?
  " AND NOT EXISTS(SELECT 1 FROM public.smn_risk_roam roam WHERE roam.item_id=r.id AND roam.classification=\'resolved\')":"";
 const statusSql=hasLinks?"$4::text[]":"$3::text[]";
 const where=`r.team_id=$1 AND r.type=$2 AND r.status<>ALL(${statusSql}) AND ${associated}${roamClause}`;
 const params=hasLinks?[teamId,kind,cycleId,closed]:[teamId,kind,closed];
 const count=await db.query<{total:number}>(`SELECT COUNT(*)::int AS total FROM public.smn_registry_item r WHERE ${where}`,params);
 const joins=hasAssessment?" LEFT JOIN public.smn_risk_assessment a ON a.item_id=r.id":"";
 const score=hasAssessment?"a.probability*a.impact DESC NULLS LAST,":"";
 const order=kind==="risk"?
  score+"r.due_on ASC NULLS LAST,r.occurred_on ASC,r.id ASC":
  "r.occurred_on ASC,r.id ASC";
 const scopeSelect=hasLinks?`CASE WHEN ${linked} THEN \'cycle\' ELSE \'team\' END`:"\'team\'";
 const linkedOrder=hasLinks?`CASE WHEN ${linked} THEN 0 ELSE 1 END,`:"";
 const ownerColumn=allowOwner?"r.owner_name":"NULL::text AS owner_name";
 const rows=await db.query<{id:string;title:string;status:string;description:string|null;owner_name:string|null;due_on:string|null;occurred_on:string;scope:"cycle"|"team";probability:Level|null;impact:Level|null}>(`
  SELECT r.id,r.title,r.status,r.description,${ownerColumn},r.due_on::text,r.occurred_on::text,${scopeSelect} AS scope${hasAssessment?",a.probability,a.impact":",NULL::smallint AS probability,NULL::smallint AS impact"}
  FROM public.smn_registry_item r${joins} WHERE ${where}
  ORDER BY ${linkedOrder}${order} LIMIT 5`,params);
 return collectionAvailable(rows.rows.map(row=>({
  id:row.id,kind,title:row.title,status:row.status,scope:row.scope,
  description:row.description??null,owner:row.owner_name??null,
  dueOn:row.due_on??null,occurredOn:row.occurred_on??null,
  priority:kind==="risk"?(criticality(row.probability,row.impact).level==="unassessed"?null:
   criticality(row.probability,row.impact).level as "low"|"medium"|"high"):null,
  href:"/app/admin/registries/"+encodeURIComponent(row.id)
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
 if(hasTasks){
  const rows=await db.query<{task_key:string;status:string}>(`
   SELECT task_key,status FROM public.smn_configuration_task
   WHERE installation_id='singleton' AND status='todo'
   ORDER BY CASE task_key WHEN 'reference-country' THEN 1
      WHEN 'recovery-phrase' THEN 2 WHEN 'display-preferences' THEN 3 ELSE 4 END`);
  const allowed=new Set(["reference-country","recovery-phrase","display-preferences"]);
  for(const row of rows.rows){
   if(!allowed.has(row.task_key)||row.status!=="todo")continue;
   alerts.push({id:"configuration:"+row.task_key,
    kind:"alert",title:row.task_key,
    status:row.status,priority:null,configurationKey:row.task_key as "reference-country"|"recovery-phrase"|"display-preferences"});
  }
 }
 // Ne compter que les notes ouvertes et les alertes à traiter.
 const all=[...alerts,...notes];
 return collectionAvailable(all.slice(0,5),all.length,{source:"manual"});
}
