import type {Client} from "pg";
export async function prepareSprintReport(db:Client,sprintId:string){
 if(!/^[a-f0-9-]{36}$/i.test(sprintId))return null;
 const result=await db.query<{id:string;name:string;status:string;teamId:string;team:string;product:string|null;startAt:string;endAt:string;timeZone:string}>(`
 SELECT s.id,s.name,s.status,s.team_id AS "teamId",t.name AS team,
 s.start_at::text AS "startAt",s.end_at::text AS "endAt",s.time_zone AS "timeZone",
 p.name AS product
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 JOIN public.smn_product p ON p.id=t.product_id AND p.installation_id=i.id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
 AND i.state='initialized' AND lower(i.mode)='scrum'`,[sprintId]);
 const sprint=result.rows[0];if(!sprint)return null;
 const schema=await db.query<{goals:boolean;closures:boolean}>(`
 SELECT to_regclass('public.smn_sprint_goal') IS NOT NULL AS goals,
 to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS closures`);
 const has=schema.rows[0];
 let snapshotVersion:number|null=null;
 let goals:Array<{id:string;title:string;evaluation:string}>=[];
 if(sprint.status==="closed"){
  if(has?.closures){
   const r=await db.query<{version:number;snapshot:{goals?:Array<{id:string;title:string;evaluation:string}>}}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprintId]);
   if(r.rows[0]){snapshotVersion=r.rows[0].version;goals=Array.isArray(r.rows[0].snapshot?.goals)?r.rows[0].snapshot.goals:[];}
  }
 }else if(has?.goals){
  const r=await db.query<{id:string;title:string;evaluation:string}>(`
   SELECT id,title,evaluation FROM public.smn_sprint_goal WHERE sprint_id=$1 ORDER BY created_at,id`,[sprintId]);goals=r.rows;
 }
 return {sprint,goals,snapshotVersion,provisional:sprint.status!=="closed",template:"standard" as const,
 source:sprint.status==="closed"?(snapshotVersion?"closure-snapshot":"historical-data-unavailable"):"current"};
}
