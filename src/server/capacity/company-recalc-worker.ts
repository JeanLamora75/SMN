import type {Client} from "pg";
import {readDevelopmentCapacity} from "./engine";
import {claimRecalculation,finishRecalculation,recoverStaleRecalculations} from "./company-recalc-outbox";

/** Persists recalculated reference values only. Frozen, closed and manually overridden
 * capacities are never mutated. The consumer may use these results for cache refresh.
 */
export async function processCompanyRecalculation(db:Client){
 await recoverStaleRecalculations(db);
 const job=await claimRecalculation(db);
 if(!job)return {processed:false};
 try{
  const periods=await db.query<{team_id:string;start_on:string;end_on:string}>(`
   SELECT DISTINCT p.team_id,p.start_on::text AS start_on,p.end_on::text AS end_on
   FROM public.smn_capacity_period_override p
   JOIN public.smn_member_assignment a ON a.team_id=p.team_id
   JOIN public.smn_member m ON m.id=a.member_id AND m.installation_id='singleton'
   WHERE m.company_id=$1 AND p.closed_at IS NULL AND p.frozen_at IS NULL
    AND p.manual_jh IS NULL
    AND p.start_on<=$3::date AND p.end_on>=$2::date
    AND a.start_on<=p.end_on AND (a.end_on IS NULL OR a.end_on>=p.start_on)
   ORDER BY p.team_id,p.start_on LIMIT 501`,[job.company_id,job.start_on,job.end_on]);
  if(periods.rows.length>500)throw Error("recalc-period-limit");
  const results=[];
  for(const p of periods.rows){
   const report=await readDevelopmentCapacity(db,p.start_on,p.end_on,{teamId:p.team_id});
   results.push({teamId:p.team_id,startOn:p.start_on,endOn:p.end_on,
    referenceJh:report.totalJh,status:report.status,
    affectedMembers:report.members.filter(m=>m.days.some(day=>day.date>=job.start_on&&day.date<=job.end_on))
     .map(m=>({memberId:m.memberId,totalJh:m.totalJh,status:m.status}))});
  }
  await finishRecalculation(db,job.id,undefined,{periods:results});
  return {processed:true,id:job.id,periods:results.length};
 }catch(error){
  await finishRecalculation(db,job.id,error instanceof Error?error.message:"recalculation-failed");
  return {processed:true,id:job.id,failed:true};
 }
}
