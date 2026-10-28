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
  const cols=await db.query<{table_name:string;column_name:string}>(`SELECT table_name,column_name
   FROM information_schema.columns WHERE table_schema='public'
   AND table_name IN ('smn_sprint','smn_kanban_period')`);
  const columns=(table:string)=>new Set(cols.rows.filter(r=>r.table_name===table).map(r=>r.column_name));
  const sprint=columns("smn_sprint"),kanban=columns("smn_kanban_period");
  const source=(table:string,alias:string,columns:Set<string>)=>{
   if(!["team_id","start_on","end_on"].every(c=>columns.has(c)))return null;
   const filters=[
    ...(columns.has("deleted_at")?[`${alias}.deleted_at IS NULL`]:[]),
    ...(columns.has("closed_at")?[`${alias}.closed_at IS NULL`]:[]),
    ...(columns.has("status")?[`${alias}.status NOT IN ('closed','finished','cancelled')`]:[])
   ];
   return `SELECT ${alias}.team_id,${alias}.start_on::text AS start_on,${alias}.end_on::text AS end_on
    FROM public.${table} ${alias} ${filters.length?"WHERE "+filters.join(" AND "):""}`;
  };
  const cycles=[source("smn_sprint","s",sprint),source("smn_kanban_period","k",kanban)]
   .filter((sql):sql is string=>sql!==null);
  const periods=await db.query<{team_id:string;start_on:string;end_on:string}>(`
   SELECT DISTINCT p.team_id,p.start_on,p.end_on
   FROM (
    SELECT team_id,start_on::text AS start_on,end_on::text AS end_on
    FROM public.smn_capacity_period_override
    WHERE closed_at IS NULL AND frozen_at IS NULL AND manual_jh IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.smn_capacity_actual_override actual
       WHERE actual.period_id=smn_capacity_period_override.id AND actual.manual_jh IS NOT NULL)
    ${cycles.length?"UNION ALL "+cycles.join(" UNION ALL "):""}
   ) p
   JOIN public.smn_member_assignment a ON a.team_id=p.team_id
   JOIN public.smn_member m ON m.id=a.member_id AND m.installation_id='singleton'
   WHERE m.company_id=$1 AND p.start_on::date<=$3::date AND p.end_on::date>=$2::date
    AND a.start_on<=p.end_on::date AND (a.end_on IS NULL OR a.end_on>=p.start_on::date)
    AND NOT EXISTS (SELECT 1 FROM public.smn_capacity_period_override protected
      WHERE protected.team_id=p.team_id AND protected.start_on=p.start_on::date
      AND protected.end_on=p.end_on::date AND
      (protected.closed_at IS NOT NULL OR protected.frozen_at IS NOT NULL OR protected.manual_jh IS NOT NULL
       OR EXISTS (SELECT 1 FROM public.smn_capacity_actual_override actual
         WHERE actual.period_id=protected.id AND actual.manual_jh IS NOT NULL)))
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
