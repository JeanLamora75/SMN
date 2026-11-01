import type {Client} from "pg";
export const DASHBOARD_BLOCKS=[{key:"story_points",count:4},{key:"tickets",count:2},{key:"complementary",count:2}] as const;
export type DashboardBlockKey=typeof DASHBOARD_BLOCKS[number]["key"];
export type DashboardSlot={block_key:DashboardBlockKey;slot_index:number;indicator_id:string};
export async function readDashboardSlots(db:Client,teamId:string):Promise<DashboardSlot[]>{
 const r=await db.query<DashboardSlot>("SELECT block_key,slot_index,indicator_id FROM public.smn_indicator_dashboard_slot WHERE team_id=$1 ORDER BY block_key,slot_index",[teamId]);
 return r.rows;
}
export async function assignDashboardSlot(db:Client,teamId:string,block:DashboardBlockKey,position:number,indicatorId:string|null){
 const config=DASHBOARD_BLOCKS.find(item=>item.key===block);
 if(!config||!Number.isInteger(position)||position<1||position>config.count||indicatorId!==null&&!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(indicatorId))throw Error("invalid-input");
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1),20261101)",[teamId]);
  if(indicatorId!==null){
   const valid=await db.query("SELECT 1 FROM public.smn_indicator_team_selection s JOIN public.smn_indicator_definition d ON d.id=s.indicator_id WHERE s.team_id=$1 AND s.indicator_id=$2 AND s.is_active=true AND d.archived_at IS NULL",[teamId,indicatorId]);
   if(valid.rows.length!==1)throw Error("indicator-unavailable");
  }
  const occupied=await db.query<{indicator_id:string}>("SELECT indicator_id FROM public.smn_indicator_dashboard_slot WHERE team_id=$1 AND block_key=$2 AND slot_index=$3 FOR UPDATE",[teamId,block,position]);
  // Explicit selection replaces the target slot; the prior choice remains in the catalogue.
  await db.query("DELETE FROM public.smn_indicator_dashboard_slot WHERE team_id=$1 AND block_key=$2 AND slot_index=$3",[teamId,block,position]);
  if(indicatorId!==null){
   await db.query("DELETE FROM public.smn_indicator_dashboard_slot WHERE team_id=$1 AND indicator_id=$2",[teamId,indicatorId]);
   await db.query("INSERT INTO public.smn_indicator_dashboard_slot(team_id,block_key,slot_index,indicator_id) VALUES($1,$2,$3,$4)",[teamId,block,position,indicatorId]);
  }
  await db.query("COMMIT");
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
