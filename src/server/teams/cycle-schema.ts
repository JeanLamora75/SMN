import type {Client} from "pg";

/** Read-only SQL contract check. Never creates or migrates schema objects. */
export async function requireScopedCycleSchema(db:Client,mode:"scrum"|"kanban"):Promise<void>{
 const required=mode==="scrum"
  ?["smn_team","smn_scrum_cadence","smn_sprint","smn_sprint_audit","smn_scrum_ceremony_template","smn_scrum_template_occurrence"]
  :["smn_team","smn_kanban_cadence","smn_kanban_period","smn_kanban_period_audit"];
 const tables=await db.query<{name:string}>(`
  SELECT c.relname AS name FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND c.relname=ANY($1::text[])`,[required]);
 if(tables.rows.length!==required.length)throw Error("cycle-schema-not-ready");
 const teamColumns=await db.query<{column_name:string}>(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_team'
    AND column_name IN ('agile_mode','is_archived')`);
 if(teamColumns.rows.length!==2)throw Error("cycle-schema-not-ready");
 const columns=mode==="scrum"
  ?{smn_scrum_cadence:["team_id","revision","duration_weeks","start_day","end_day","start_time","end_time","time_zone"],
    smn_sprint:["id","team_id","number","name","start_at","end_at","time_zone","created_by","deleted_at"],
    smn_sprint_audit:["id","sprint_id","action","actor_id","details"],
    smn_scrum_template_occurrence:["id","template_id","template_revision","sprint_id","name","starts_at","ends_at","generation_source","status","status_explicit","actual_minutes"]}
  :{smn_kanban_cadence:["team_id","revision","frequency","time_zone"],
    smn_kanban_period:["id","team_id","name","start_on","end_on","time_zone","created_by","deleted_at"],
    smn_kanban_period_audit:["id","period_id","action","details","actor_id"]};
 const checks=Object.entries(columns) as [string,string[]][];
 const found=await db.query<{table_name:string;column_name:string}>(`
  SELECT table_name,column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name=ANY($1::text[])`,[checks.map(([table])=>table)]);
 const available=new Set(found.rows.map(row=>row.table_name+"."+row.column_name));
 if(checks.some(([table,names])=>names.some(name=>!available.has(table+"."+name))))
  throw Error("cycle-schema-not-ready");
}
