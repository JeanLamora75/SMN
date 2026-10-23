import type {Client} from "pg";
import {readActualCapacity} from "@/server/capacity/actual";
import {readInitialSnapshot} from "@/server/capacity/opening";
import {readDevelopmentCapacity} from "@/server/capacity/engine";
import {
 collectionAvailable,collectionUnavailable,metricAvailable,metricNotRecorded,
 metricUnavailable,type DashboardMetric,type DashboardGoal,
 type CollectiveCycleProjection
} from "@/lib/dashboard-data-contract";
import type {SprintContextItem} from "@/lib/sprint-context";
import {eventsFromClosureSnapshot,readCurrentSprintEvents} from "@/server/dashboard/events-reader";
import {sprintWorkingDaysRemaining} from "@/lib/sprint-working-days";

const object=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;
const evaluations=new Set(["not_evaluated","achieved","partially_achieved","not_achieved"]);
type DataSource="manual"|"calculated"|"closure-snapshot";

function metric(value:unknown,source:DataSource,version:number|null=null):DashboardMetric{
 if(value===null||value===undefined)return metricNotRecorded();
 if(typeof value!=="number"&&typeof value!=="string")return metricUnavailable("read-failed");
 if(typeof value==="string"&&value.trim()==="")return metricUnavailable("read-failed");
 const n=Number(value);
 if(!Number.isFinite(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER)return metricUnavailable("read-failed");
 return metricAvailable(n,{source,quality:"known",snapshotVersion:version});
}
function dateAt(instant:string,zone:string):string{
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:zone,day:"2-digit",month:"2-digit",year:"numeric"
 }).formatToParts(new Date(instant));
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
/** Le Sprint est [startAt,endAt) ; les périodes de capacité sont inclusives. */
export function sprintCapacityDates(sprint:SprintContextItem){
 return {start:dateAt(sprint.startAt,sprint.timeZone),
  end:dateAt(new Date(Date.parse(sprint.endAt)-1).toISOString(),sprint.timeZone)};
}
function goalsFrom(raw:unknown,version:number|null):CollectiveCycleProjection["goals"]{
 if(!Array.isArray(raw))return collectionUnavailable("read-failed");
 const items:DashboardGoal[]=[];
 for(const g of raw){
  const row=object(g);
  if(!row||typeof row.id!=="string"||typeof row.title!=="string"||
    typeof row.evaluation!=="string"||!evaluations.has(row.evaluation))
   return collectionUnavailable("read-failed");
  items.push({id:row.id,title:row.title,
   evaluation:row.evaluation as DashboardGoal["evaluation"]});
 }
 return collectionAvailable(items,items.length,{
  source:version===null?"manual":"closure-snapshot",snapshotVersion:version
 });
}
function pointsFrom(raw:unknown,version:number|null):CollectiveCycleProjection["storyPoints"]{
 if(raw===null||raw===undefined)return {initial:metricNotRecorded(),done:metricNotRecorded()};
 const row=object(raw);
 if(!row)return {initial:metricUnavailable("read-failed"),done:metricUnavailable("read-failed")};
 return {
  initial:metric(row.initial_sp,version===null?"manual":"closure-snapshot",version),
  done:metric(row.done_sp,version===null?"manual":"closure-snapshot",version)
 };
}
/** La source Tickets n'est jamais dérivée des Story Points. */
function ticketsFrom(raw:unknown,source:"manual"|"closure-snapshot",
 version:number|null=null):CollectiveCycleProjection["tickets"]{
 if(raw===null||raw===undefined)
  return {initial:metricNotRecorded(),done:metricNotRecorded()};
 const row=object(raw);
 if(!row)return {initial:metricUnavailable("read-failed"),done:metricUnavailable("read-failed")};
 return {
  initial:metric(row.initial_tickets,source,version),
  done:metric(row.done_tickets,source,version)
 };
}
async function currentTickets(db:Client,sprintId:string):
 Promise<CollectiveCycleProjection["tickets"]>{
 if(!await tableExists(db,"smn_sprint_ticket_counts"))return {
  initial:metricUnavailable("schema-missing"),done:metricUnavailable("schema-missing")
 };
 const rows=await db.query<{initial_tickets:string|null;done_tickets:string|null}>(`
  SELECT initial_tickets::text,done_tickets::text
  FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1`,[sprintId]);
 return ticketsFrom(rows.rows[0]??null,"manual");
}
const capacityUnavailable=(reason:"producer-not-ready"|"schema-missing"|"history-missing"|"read-failed"):
 CollectiveCycleProjection["capacity"]=>({
  initialJh:metricUnavailable(reason),actualJh:metricUnavailable(reason)
 });
export function closedSnapshotProjection(raw:unknown,version:number):
 Pick<CollectiveCycleProjection,"goals"|"storyPoints"|"capacity"|"tickets">{
 const snapshot=object(raw);
 if(!snapshot)return {
  goals:collectionUnavailable("read-failed"),
  storyPoints:{initial:metricUnavailable("read-failed"),done:metricUnavailable("read-failed")},
  capacity:capacityUnavailable("read-failed"),
  tickets:{initial:metricUnavailable("read-failed"),done:metricUnavailable("read-failed")}
 };
 const cap=object(snapshot.capacity);
 return {
  goals:snapshot.goals===undefined?collectionUnavailable("history-missing"):
   goalsFrom(snapshot.goals,version),
  storyPoints:snapshot.storyPoints===undefined?{
   initial:metricUnavailable("history-missing"),done:metricUnavailable("history-missing")
  }:pointsFrom(snapshot.storyPoints,version),
  capacity:cap?{
   initialJh:metric(cap.initial_jh,"closure-snapshot",version),
   actualJh:metric(cap.actual_jh,"closure-snapshot",version)
  }:capacityUnavailable("history-missing"),
  tickets:snapshot.ticketCounts===undefined?
   {initial:metricUnavailable("history-missing"),done:metricUnavailable("history-missing")}:
   ticketsFrom(snapshot.ticketCounts,"closure-snapshot",version)
 };
}
async function tableExists(db:Client,name:string):Promise<boolean>{
 const q=await db.query<{present:boolean}>("SELECT to_regclass($1) IS NOT NULL AS present",["public."+name]);
 return q.rows[0]?.present===true;
}
async function readCapacity(db:Client,teamId:string,sprint:SprintContextItem):
 Promise<CollectiveCycleProjection["capacity"]>{
 const {start,end}=sprintCapacityDates(sprint);
 if(!await tableExists(db,"smn_capacity_period_override")||
    !await tableExists(db,"smn_capacity_initial_snapshot"))return capacityUnavailable("schema-missing");
 // L'état initial est immuable. Ne pas calculer rétroactivement en son absence.
 const initial=await readInitialSnapshot(db,teamId,start,end);
 const initialMetric=initial?.initialJh===null||!initial?metricNotRecorded():
  metric(initial.initialJh,initial.provenance==="Saisie"?"manual":"calculated");
 let actualMetric:DashboardMetric=metricUnavailable("schema-missing");
 const required=["smn_capacity_actual_override","smn_capacity_actual_snapshot","smn_capacity_settings"];
 if((await Promise.all(required.map(name=>tableExists(db,name)))).every(Boolean)){
  // L'ancien moteur peut rencontrer une table optionnelle manquante.
  // SAVEPOINT isole l'échec sans perdre les objectifs/SP de la même transaction.
  await db.query("SAVEPOINT dashboard_capacity");
  try{
   const actual=await readActualCapacity(db,start,end,readDevelopmentCapacity,
    {externalTransaction:true});
   if(actual.source==="Non renseigné"){
    actualMetric=actual.missingSources.length?
     metricUnavailable("producer-not-ready"):metricNotRecorded();
   }else if(actual.retainedJh!==null){
    actualMetric=metric(actual.retainedJh,actual.source==="Saisie"?"manual":"calculated");
   }else actualMetric=metricNotRecorded();
   await db.query("RELEASE SAVEPOINT dashboard_capacity");
  }catch(error){
   await db.query("ROLLBACK TO SAVEPOINT dashboard_capacity");
   await db.query("RELEASE SAVEPOINT dashboard_capacity");
   actualMetric=metricUnavailable("read-failed");
   // Ne pas journaliser l'erreur : les détails peuvent contenir des informations individuelles.
   void error;
  }
 }
 return {initialJh:initialMetric,actualJh:actualMetric};
}
/**
 * À appeler uniquement sous REPEATABLE READ READ ONLY. Le contrôle d'équipe
 * s'effectue côté serveur, et les producteurs ne créent aucune table.
 */
export async function readCycleDashboard(db:Client,teamId:string,sprint:SprintContextItem):
 Promise<CollectiveCycleProjection>{
 const check=await db.query<{status:string}>(`SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
    AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,
  [sprint.id,teamId]);
 if(check.rows.length!==1)throw Error("dashboard-cycle-out-of-scope");
 const status=check.rows[0].status;
 let goals:CollectiveCycleProjection["goals"]=collectionUnavailable("producer-not-ready");
 let storyPoints:CollectiveCycleProjection["storyPoints"]={
  initial:metricUnavailable("producer-not-ready"),done:metricUnavailable("producer-not-ready")
 };
 let capacity:CollectiveCycleProjection["capacity"]=capacityUnavailable("producer-not-ready");
 let tickets:CollectiveCycleProjection["tickets"]={
  initial:metricUnavailable("producer-not-ready"),
  done:metricUnavailable("producer-not-ready")
 };
 let version:number|null=null;
 let events:CollectiveCycleProjection["events"]=collectionUnavailable("producer-not-ready");
 if(status==="closed"){
  if(await tableExists(db,"smn_sprint_closure_snapshot")){
   const r=await db.query<{version:number;snapshot:unknown}>(`
    SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
    WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprint.id]);
   const row=r.rows[0];
   if(row&&Number.isSafeInteger(row.version)&&row.version>=1){
    version=row.version;
    ({goals,storyPoints,capacity,tickets}=closedSnapshotProjection(row.snapshot,version));
    events=eventsFromClosureSnapshot(row.snapshot,version);
   }else{
    goals=collectionUnavailable("history-missing");
    storyPoints={initial:metricUnavailable("history-missing"),done:metricUnavailable("history-missing")};
    capacity=capacityUnavailable("history-missing");
    tickets={initial:metricUnavailable("history-missing"),
     done:metricUnavailable("history-missing")};
   }
  }else{
   goals=collectionUnavailable("history-missing");
   storyPoints={initial:metricUnavailable("history-missing"),done:metricUnavailable("history-missing")};
   capacity=capacityUnavailable("history-missing");
   tickets={initial:metricUnavailable("history-missing"),
    done:metricUnavailable("history-missing")};
  }
 }else{
  if(await tableExists(db,"smn_sprint_goal")){
   const r=await db.query<{id:string;title:string;evaluation:string}>(`
    SELECT id,title,evaluation FROM public.smn_sprint_goal
    WHERE sprint_id=$1 ORDER BY created_at,id`,[sprint.id]);
   goals=goalsFrom(r.rows,null);
  }else goals=collectionUnavailable("schema-missing");
  if(await tableExists(db,"smn_sprint_story_points")){
   const r=await db.query<{initial_sp:string|null;done_sp:string|null}>(`
    SELECT initial_sp::text,done_sp::text FROM public.smn_sprint_story_points
    WHERE sprint_id=$1`,[sprint.id]);
   storyPoints=pointsFrom(r.rows[0]??null,null);
  }else storyPoints={initial:metricUnavailable("schema-missing"),
    done:metricUnavailable("schema-missing")};
  await db.query("SAVEPOINT dashboard_current_tickets");
  try{
   tickets=await currentTickets(db,sprint.id);
   await db.query("RELEASE SAVEPOINT dashboard_current_tickets");
  }catch(error){
   await db.query("ROLLBACK TO SAVEPOINT dashboard_current_tickets");
   await db.query("RELEASE SAVEPOINT dashboard_current_tickets");
   tickets={initial:metricUnavailable("read-failed"),done:metricUnavailable("read-failed")};
   void error;
  }
  // Une lecture de capacité partiellement migrée ne doit pas rendre
  // indisponibles les objectifs ou les SP déjà récupérés.
  await db.query("SAVEPOINT dashboard_current_capacity");
  try{
   capacity=await readCapacity(db,teamId,sprint);
   await db.query("RELEASE SAVEPOINT dashboard_current_capacity");
  }catch(error){
   await db.query("ROLLBACK TO SAVEPOINT dashboard_current_capacity");
   await db.query("RELEASE SAVEPOINT dashboard_current_capacity");
   capacity=capacityUnavailable("read-failed");
   void error;
  }
  // Le calendrier ne doit pas rendre les autres cartes indisponibles si
  // une table historique possède un schéma inattendu.
  await db.query("SAVEPOINT dashboard_current_events");
  try{
   const now=await db.query<{now_at:Date|string}>("SELECT now() AS now_at");
   const instant=new Date(now.rows[0]?.now_at??Date.now());
   const historical=Date.parse(sprint.endAt)<=instant.getTime();
   events=await readCurrentSprintEvents(db,sprint.id,instant,historical);
   await db.query("RELEASE SAVEPOINT dashboard_current_events");
  }catch(error){
   await db.query("ROLLBACK TO SAVEPOINT dashboard_current_events");
   await db.query("RELEASE SAVEPOINT dashboard_current_events");
   events=collectionUnavailable("read-failed");
   void error;
  }
 }
 // Même instant transactionnel pour Sprint/KPI et échéance.
 const dbTime=await db.query<{at:Date|string}>("SELECT now() AS at");
 const instant=new Date(dbTime.rows[0]?.at??Date.now());
 // Le compteur de J ouvrés est une mesure temporelle actuelle et non une
 // donnée censée être figée dans les instantanés de clôture.
 let remaining:DashboardMetric=metricUnavailable("read-failed");
 try{
  remaining=sprint.suspended?metricUnavailable("producer-not-ready"):
   metricAvailable(status==="closed"||status==="finished"?0:
    sprintWorkingDaysRemaining(sprint,instant,"include-today").days,{
    source:"calculated",quality:"known"
   });
 }catch{remaining=metricUnavailable("read-failed");}
 return {teamId,cycleId:sprint.id,cycleStatus:status,snapshotVersion:version,
  goals,storyPoints,capacity,
  tickets,workingDaysRemaining:remaining,
  events,
  obstacles:collectionUnavailable("producer-not-ready"),
  risks:collectionUnavailable("producer-not-ready"),
  notesAndAlerts:collectionUnavailable("producer-not-ready")};
}
