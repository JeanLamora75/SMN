import type {Client} from "pg";
/** Read-only guard: Kanban business flows must not create database objects. */
export async function assertKanbanSchema(db:Client,table:string){
 if(!/^smn_kanban_[a-z_]+$/.test(table))throw Error("kanban-schema-identifier-invalid");
 const result=await db.query<{ready:boolean}>("SELECT to_regclass($1) IS NOT NULL AS ready",["public."+table]);
 if(!result.rows[0]?.ready)throw Error("kanban-schema-missing: "+table+"; run pnpm exec tsx scripts/apply-kanban-schema-v32.ts --apply");
}
