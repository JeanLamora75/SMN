import type {Client} from "pg";
import {defaultKanbanPeriodId,type KanbanPeriodContextItem} from "@/lib/kanban-context";

/** Consultation seule : ne crée aucune table Kanban au chargement.
 * Le teamId est résolu/autorisé par le point d'entrée serveur.
 */
export async function readKanbanPeriodContext(db:Client,teamId:string,
 now=Date.now()):Promise<{items:KanbanPeriodContextItem[];defaultCycleId:string|null}>{
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_kanban_period') IS NOT NULL AS present");
 if(exists.rows[0]?.present!==true)return {items:[],defaultCycleId:null};
 const periods=await db.query<{
  id:string;name:string;status:string;start_on:string;end_on:string;
  time_zone:string;
 }>(`SELECT k.id,k.name,k.status,k.start_on::text,k.end_on::text,k.time_zone
 FROM public.smn_kanban_period k
 JOIN public.smn_team t ON t.id=k.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized'
   AND lower(i.mode)='kanban' AND k.team_id=$1
   AND k.deleted_at IS NULL
 ORDER BY k.start_on DESC,k.id DESC`,[teamId]);
 const items=periods.rows.map(p=>({
  id:p.id,name:p.name,status:p.status,startOn:p.start_on,endOn:p.end_on,
  timeZone:p.time_zone
 }));
 return {items,defaultCycleId:defaultKanbanPeriodId(items,now)};
}
