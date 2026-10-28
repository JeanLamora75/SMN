import type {Client} from "pg";
import {isValidDate} from "../members/assignment";

export type SynchronizationStatus="up-to-date"|"pending"|"running"|"failed"|"not-available";
export type CapacitySynchronization={
 status:SynchronizationStatus;pending:number;running:number;failed:number;
 latestCompletedAt:string|null;manualOverride:boolean;protectedPeriod:boolean;
};
export function synchronizationStatus(counts:{pending:number;running:number;failed:number}):SynchronizationStatus{
 if(counts.failed>0)return "failed";
 if(counts.running>0)return "running";
 if(counts.pending>0)return "pending";
 return "up-to-date";
}
/** Consultative only: does not update user edits, period snapshots, or recalc jobs. */
export async function readCapacitySynchronization(db:Client,teamId:string,start:string,end:string):Promise<CapacitySynchronization>{
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(teamId)||
  !isValidDate(start)||!isValidDate(end)||start>end)throw Error("invalid-input");
 const version=await db.query<{schema_version:number}>(
  "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 if(version.rows[0]?.schema_version!==31)return {
  status:"not-available",pending:0,running:0,failed:0,latestCompletedAt:null,
  manualOverride:false,protectedPeriod:false
 };
 const record=await db.query<{closed_at:string|null;frozen_at:string|null;manual_jh:number|null;actual_manual:number|null}>(`
  SELECT p.closed_at::text AS closed_at,p.frozen_at::text AS frozen_at,
   p.manual_jh::float8 AS manual_jh,a.manual_jh::float8 AS actual_manual
  FROM public.smn_capacity_period_override p
  LEFT JOIN public.smn_capacity_actual_override a ON a.period_id=p.id
  WHERE p.team_id=$1 AND p.start_on=$2::date AND p.end_on=$3::date
  LIMIT 1`,[teamId,start,end]);
 const period=record.rows[0];
 const manualOverride=period?.manual_jh!=null||period?.actual_manual!=null;
 const protectedPeriod=period?.closed_at!=null||period?.frozen_at!=null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_company_capacity_recalc') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return {status:"not-available",pending:0,running:0,failed:0,
  latestCompletedAt:null,manualOverride,protectedPeriod};
 const jobs=await db.query<{pending:number;running:number;failed:number;latest_completed_at:string|null}>(`
  SELECT count(*) FILTER(WHERE j.status='pending')::int AS pending,
   count(*) FILTER(WHERE j.status='running')::int AS running,
   count(*) FILTER(WHERE j.status='failed')::int AS failed,
   max(j.updated_at) FILTER(WHERE j.status='done')::text AS latest_completed_at
  FROM public.smn_company_capacity_recalc j
  WHERE j.start_on<=$3::date AND j.end_on>=$2::date
   AND EXISTS(
    SELECT 1 FROM public.smn_member m
    JOIN public.smn_member_assignment a ON a.member_id=m.id
    JOIN public.smn_team t ON t.id=a.team_id AND t.installation_id=m.installation_id
    WHERE a.team_id=$1 AND m.installation_id='singleton' AND m.company_id=j.company_id
     AND a.start_on<=$3::date AND (a.end_on IS NULL OR a.end_on>=$2::date)
   )`,[teamId,start,end]);
 const counts=jobs.rows[0]??{pending:0,running:0,failed:0,latest_completed_at:null};
 return {status:synchronizationStatus(counts),pending:counts.pending,running:counts.running,
  failed:counts.failed,latestCompletedAt:counts.latest_completed_at,manualOverride,protectedPeriod};
}
