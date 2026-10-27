import type {Client} from "pg";

export type TeamSummary=Readonly<{
 id:string;
 name:string;
 productName:string|null;
 vision:string|null;
 productGoal:string|null;
 revision:number;
 agileMode:"scrum"|"kanban"|null;modeLocked:boolean;isArchived:boolean;
}>;

/** Liste strictement limitée à l'installation de la session administrateur. */
export async function listInstallationTeams(db:Client,installationId:string):Promise<TeamSummary[]>{
 if(!installationId||!/^[a-zA-Z0-9_-]{1,80}$/u.test(installationId))
  throw Error("invalid-installation");
 const table=await db.query<{exists:boolean}>(
  "SELECT to_regclass('public.smn_team_context') IS NOT NULL AS exists");
 const context=table.rows[0]?.exists===true;
 const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id=$1",[installationId]);
 const agile=version.rows[0]?.schema_version===29;
 const columns=agile?"t.agile_mode,t.mode_locked,t.is_archived":"NULL::text AS agile_mode,false AS mode_locked,false AS is_archived";
 const query=context?
  `SELECT t.id,t.name,${columns},p.name AS product_name,
    c.vision,c.product_goal,c.revision
   FROM public.smn_team t
   LEFT JOIN public.smn_product p ON p.id=t.product_id AND p.installation_id=t.installation_id
   LEFT JOIN public.smn_team_context c ON c.team_id=t.id
   WHERE t.installation_id=$1 ORDER BY lower(t.name),t.id`:
  `SELECT t.id,t.name,p.name AS product_name,
    NULL::text AS vision,NULL::text AS product_goal,0::integer AS revision
   FROM public.smn_team t
   LEFT JOIN public.smn_product p ON p.id=t.product_id AND p.installation_id=t.installation_id
   WHERE t.installation_id=$1 ORDER BY lower(t.name),t.id`;
 const result=await db.query<{
  id:string;name:string;product_name:string|null;vision:string|null;
  product_goal:string|null;revision:number|null;agile_mode:"scrum"|"kanban"|null;mode_locked:boolean;is_archived:boolean;
 }>(query,[installationId]);
 return result.rows.map(row=>({
  id:row.id,name:row.name,productName:row.product_name??null,
  vision:row.vision??null,productGoal:row.product_goal??null,
  revision:row.revision??0,agileMode:row.agile_mode??null,
  modeLocked:row.mode_locked===true,isArchived:row.is_archived===true
 }));
}
