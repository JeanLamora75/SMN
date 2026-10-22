import type {Client} from "pg";
import {readActualCapacity} from "@/server/capacity/actual";
import {readInitialSnapshot} from "@/server/capacity/opening";
import {ensureSprintSchema} from "./creation";
export async function readSprintCapacityReview(db:Client,sprintId:string){
 await ensureSprintSchema(db);
 const q=await db.query<{id:string;team_id:string;name:string;status:string;start_on:string;end_on:string}>(`SELECT s.id,s.team_id,s.name,s.status,
 (s.start_at AT TIME ZONE s.time_zone)::date::text AS start_on,
 (s.end_at AT TIME ZONE s.time_zone)::date::text AS end_on
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[sprintId]);
 const sprint=q.rows[0];if(!sprint)return null;
 // A capacity period is inclusive in the existing capacity engine.
 const actual=await readActualCapacity(db,sprint.start_on,sprint.end_on);
 const initial=await readInitialSnapshot(db,sprint.team_id,sprint.start_on,sprint.end_on);
 const initialJh=initial?.initialJh??null;
 const actualJh=actual.retainedJh;
 const reliable=initialJh!==null&&actualJh!==null&&initial?.provenance!=="Non renseigné"&&actual.source!=="Non renseigné"&&actual.missingSources.length===0;
 return {sprint:{name:sprint.name,start:sprint.start_on,end:sprint.end_on,status:sprint.status},
  initial:{retainedJh:initialJh,source:initial?.provenance??"Non renseigné",referenceJh:null},
  actual:{retainedJh:actualJh,source:actual.source,referenceJh:actual.referenceJh,manualJh:actual.manualJh,missingSources:actual.missingSources},
  differenceJh:reliable?actualJh-initialJh:null,reliable};
}
