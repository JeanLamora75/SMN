import type {Client} from "pg";

export type TeamSummary=Readonly<{
 id:string;
 name:string;
 agileMode:"scrum"|"kanban";
 isArchived:boolean;
 canChangeMode:boolean;
 productName:string|null;
 vision:string|null;
 productGoal:string|null;
 revision:number;
}>;

/** Liste strictement limitée à l'installation de la session administrateur. */
export async function listInstallationTeams(db:Client,installationId:string):Promise<TeamSummary[]>{
 if(!installationId||!/^[a-zA-Z0-9_-]{1,80}$/u.test(installationId))
  throw Error("invalid-installation");
 const table=await db.query<{exists:boolean}>(
  "SELECT to_regclass('public.smn_team_context') IS NOT NULL AS exists");
 const context=table.rows[0]?.exists===true;
 const query=context?
  `SELECT t.id,t.name,COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode) AS agile_mode,t.is_archived,p.name AS product_name,
    c.vision,c.product_goal,c.revision
   FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   LEFT JOIN public.smn_product p ON p.id=t.product_id AND p.installation_id=t.installation_id
   LEFT JOIN public.smn_team_context c ON c.team_id=t.id
   WHERE t.installation_id=$1 ORDER BY lower(t.name),t.id`:
  `SELECT t.id,t.name,COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode) AS agile_mode,p.name AS product_name,
    NULL::text AS vision,NULL::text AS product_goal,0::integer AS revision
   FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   LEFT JOIN public.smn_product p ON p.id=t.product_id AND p.installation_id=t.installation_id
   WHERE t.installation_id=$1 ORDER BY lower(t.name),t.id`;
 const result=await db.query<{
  id:string;name:string;agile_mode:"scrum"|"kanban";is_archived:boolean;product_name:string|null;vision:string|null;
  product_goal:string|null;revision:number|null;
 }>(query,[installationId]);
 const tables=await db.query<{sprint:boolean;kanban:boolean}>(
  "SELECT to_regclass('public.smn_sprint') IS NOT NULL AS sprint,"+
  "to_regclass('public.smn_kanban_period') IS NOT NULL AS kanban");
 const checks=[...(tables.rows[0]?.sprint?["smn_sprint"]:[]),
  ...(tables.rows[0]?.kanban?["smn_kanban_period"]:[])];
 const locked=new Set<string>();
 for(const tableName of checks){
  const sql=tableName==="smn_sprint"?"public.smn_sprint":"public.smn_kanban_period";
  const used=await db.query<{team_id:string}>(
   "SELECT DISTINCT team_id FROM "+sql+" WHERE team_id=ANY($1::text[])",
   [result.rows.map(row=>row.id)]);
  for(const row of used.rows)locked.add(row.team_id);
 }
 return result.rows.map(row=>({
  id:row.id,name:row.name,agileMode:row.agile_mode,isArchived:row.is_archived,canChangeMode:!locked.has(row.id),productName:row.product_name??null,
  vision:row.vision??null,productGoal:row.product_goal??null,
  revision:row.revision??0
 }));
}
