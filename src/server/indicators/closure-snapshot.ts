import type {Client} from "pg";
export type FrozenIndicator={id:string;tag:string;name:string;unit:string;type:string;state:"available"|"unavailable"|"not-recorded";value:string|null};
export async function captureCycleIndicators(db:Client,teamId:string,cycleId:string):Promise<FrozenIndicator[]>{
 const result=await db.query<{id:string;tag:string;name:string;unit:string;type:string;manual_value:string|null;computed_value:string|null;result_state:string|null}>(`
 SELECT d.id,d.tag,d.name,d.unit_short AS unit,d.indicator_type AS type,
 m.value::text AS manual_value,r.value::text AS computed_value,r.result_state
 FROM public.smn_indicator_definition d
 JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true
 LEFT JOIN public.smn_indicator_manual_value m ON m.indicator_id=d.id AND m.team_id=$1 AND m.cycle_type='scrum' AND m.cycle_id=$2
 LEFT JOIN public.smn_indicator_computed_result r ON r.indicator_id=d.id AND r.team_id=$1 AND r.cycle_type='scrum' AND r.cycle_id=$2
 WHERE d.archived_at IS NULL ORDER BY d.tag,d.id`,[teamId,cycleId]);
 return result.rows.map(d=>{
  const value=d.type==="manual"?d.manual_value:d.result_state==="available"?d.computed_value:null;
  const state=d.type==="computed"&&d.result_state!==null&&d.result_state!=="available"?"unavailable":value===null?"not-recorded":"available";
  return {id:d.id,tag:d.tag,name:d.name,unit:d.unit,type:d.type,value,state};
 });
}
