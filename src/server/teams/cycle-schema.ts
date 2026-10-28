import type {Client} from "pg";

/** Read-only SQL contract check. Never creates or migrates schema objects. */
export async function requireScopedCycleSchema(db:Client,mode:"scrum"|"kanban"):Promise<void>{
 const required=mode==="scrum"
  ?["smn_team","smn_scrum_cadence","smn_sprint","smn_sprint_audit","smn_scrum_ceremony_template"]
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
}
