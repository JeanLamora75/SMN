import type {Client} from "pg";
const required:Record<string,string[]>={archive:["smn_ai_brief_archive"],duplicates:["smn_ai_brief_draft"],"human-analyses":["smn_human_analysis"],responses:["smn_ai_brief_response"],templates:["smn_ai_brief_template"]};
/** Read-only guard; schema changes are only allowed in the dedicated migration. */
export async function assertAiBriefSchema(db:Client,scope:string){
 const tables=required[scope];
 if(!tables)throw Error("ai-brief-schema-scope-invalid");
 const result=await db.query<{name:string}>(`SELECT relname AS name FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')
 AND relname=ANY($1::text[])`,[tables]);
 if(tables.some(t=>!result.rows.some(r=>r.name===t)))throw Error("ai-brief-schema-missing: "+scope+"; apply explicit AI brief migration");
}
