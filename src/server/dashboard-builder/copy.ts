import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import type {DashboardLayout,LayoutScope} from "./layout";
import {validateDashboardLayout} from "./layout";
import {requireDashboardPermission,dashboardPermission} from "./permissions";
import {listDashboardSources} from "./sources";

export function prepareDashboardCopy(source:DashboardLayout):DashboardLayout{
 const clone=structuredClone(source);
 const block=(b:DashboardLayout["header"]["blocks"][number])=>({
  ...b,id:randomUUID(),slots:b.slots.map(s=>{
   const filters={...s.filters};
   delete filters.cycleIdOverride;
   return {...s,id:randomUUID(),...(s.filters?{filters}: {})};
  }),
 });
 return {...clone,header:{blocks:clone.header.blocks.map(block)},
  rows:clone.rows.map(r=>({...r,id:randomUUID(),blocks:r.blocks.map(block)}))};
}
export async function listCopyTargets(db:Client,source:LayoutScope){
 await requireDashboardPermission(db,source,"read");
 const teams=await db.query<{id:string;name:string}>(`
 SELECT id,name FROM public.smn_team WHERE installation_id=$1 AND id<>$2
 AND COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false ORDER BY name,id`,[source.installationId,source.teamId]);
 const allowed=[];
 for(const team of teams.rows){
  const target={...source,teamId:team.id};
  if((await dashboardPermission(db,target)).canEdit)allowed.push(team);
 }
 return allowed;
}
/** Copy only the committed source; target revision is locked and checked atomically. */
export async function copySavedDashboard(db:Client,source:LayoutScope,targetTeamId:string,expectedRevision:number){
 if(targetTeamId===source.teamId||!/^[a-zA-Z0-9_-]{1,100}$/.test(targetTeamId)||
 !Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error("dashboard-copy-invalid");
 await db.query("BEGIN");
 try{
  await requireDashboardPermission(db,source,"read");
  const target={...source,teamId:targetTeamId};
  await requireDashboardPermission(db,target,"edit");
  const saved=await db.query<{layout:DashboardLayout}>(`
   SELECT layout FROM public.smn_dashboard_layout WHERE installation_id=$1 AND account_id=$2 AND team_id=$3
   FOR SHARE`,[source.installationId,source.accountId,source.teamId]);
  if(saved.rows.length!==1)throw Error("dashboard-copy-source-not-saved");
  const copied=prepareDashboardCopy(saved.rows[0].layout);
  validateDashboardLayout(copied);
  const current=await db.query<{revision:string}>(`
   SELECT revision FROM public.smn_dashboard_layout WHERE installation_id=$1 AND account_id=$2 AND team_id=$3 FOR UPDATE`,
   [source.installationId,source.accountId,targetTeamId]);
  const revision=current.rows.length?Number(current.rows[0].revision):0;
  if(revision!==expectedRevision)throw Error("dashboard-revision-conflict");
  const result=current.rows.length?await db.query(`
   UPDATE public.smn_dashboard_layout SET layout=$4::jsonb,revision=revision+1,updated_at=now()
   WHERE installation_id=$1 AND account_id=$2 AND team_id=$3`,
   [source.installationId,source.accountId,targetTeamId,JSON.stringify(copied)]):
   await db.query(`
   INSERT INTO public.smn_dashboard_layout(installation_id,account_id,team_id,schema_version,revision,layout)
   VALUES($1,$2,$3,$4,1,$5::jsonb)`,
   [source.installationId,source.accountId,targetTeamId,copied.schemaVersion,JSON.stringify(copied)]);
  void result;
  const catalog=await listDashboardSources(db,target);
  const warnings=[...copied.header.blocks,...copied.rows.flatMap(r=>r.blocks)].flatMap(b=>b.slots)
   .filter(s=>s.source&&!catalog.some(c=>c.code===s.source&&c.status==="available"&&c.views.includes(s.view as never)))
   .map(s=>s.source!);
  await db.query("COMMIT");
  return {revision:revision+1,warnings:[...new Set(warnings)]};
 }catch(error){await db.query("ROLLBACK");throw error;}
}
