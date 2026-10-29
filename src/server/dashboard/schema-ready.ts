import type {Client} from "pg";
const tables=new Set(["smn_dashboard_note","smn_dashboard_note_audit","smn_dashboard_note_edit_audit","smn_dashboard_event_edit_audit"]);
/** Contrôle en lecture seule : aucune création de schéma dans le code métier. */
export async function assertDashboardTable(db:Client,table:string){
 if(!tables.has(table))throw Error("dashboard-table-unknown");
 const result=await db.query<{ready:boolean}>("SELECT to_regclass($1) IS NOT NULL AS ready",["public."+table]);
 if(!result.rows[0]?.ready)throw Error("dashboard-schema-missing: "+table+"; run pnpm exec tsx scripts/apply-dashboard-schema-v32.ts --apply");
}
