import type {Client} from "pg";

/** Read-only compatibility layer for installations up to schema v32.
 * Callers must branch on schema version before invoking these functions. */
export async function readLegacyReportPoints(db:Client,sprintId:string){
 const table=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_sprint_story_points') IS NOT NULL AS present");
 if(!table.rows[0]?.present)return null;
 const values=await db.query<{initial_sp:string|null;done_sp:string|null}>(
  "SELECT initial_sp::text,done_sp::text FROM public.smn_sprint_story_points WHERE sprint_id=$1",[sprintId]);
 return values.rows[0]??null;
}
export async function readLegacyReportTickets(db:Client,sprintId:string){
 const table=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_sprint_ticket_counts') IS NOT NULL AS present");
 if(!table.rows[0]?.present)return null;
 const values=await db.query<{initial_tickets:string|null;done_tickets:string|null}>(
  "SELECT initial_tickets::text,done_tickets::text FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1",[sprintId]);
 return values.rows[0]??null;
}

export async function readLegacyReschedulePoints(db:Client,sprintId:string){
 const available=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_sprint_story_points') IS NOT NULL AS present");
 if(!available.rows[0]?.present)return null;
 const result=await db.query(`SELECT initial_sp::text AS initial,added_sp::text AS added,
 removed_sp::text AS removed,done_sp::text AS done
 FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[sprintId]);
 return result.rows[0]??null;
}

export async function readLegacyClosurePoints(db:Client,sprintId:string){
 const rows=await db.query(`SELECT initial_sp::text,added_sp::text,removed_sp::text,
 done_sp::text,revision FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[sprintId]);
 return rows.rows[0]??null;
}
export async function readLegacyClosureTickets(db:Client,sprintId:string){
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_sprint_ticket_counts') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return null;
 const rows=await db.query(`SELECT initial_tickets::text,done_tickets::text
 FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1`,[sprintId]);
 return rows.rows[0]??null;
}

export async function readLegacyDetailMetrics(db:Client,sprintId:string){
 const present=await db.query<{points:boolean;tickets:boolean;scores:boolean}>(`SELECT
 to_regclass('public.smn_sprint_story_points') IS NOT NULL AS points,
 to_regclass('public.smn_sprint_ticket_counts') IS NOT NULL AS tickets,
 to_regclass('public.smn_sprint_scores') IS NOT NULL AS scores`);
 const tables=present.rows[0]??{points:false,tickets:false,scores:false};
 const points=tables.points?await db.query(`SELECT initial_sp::text AS initial,added_sp::text AS added,
 removed_sp::text AS removed,done_sp::text AS done,revision
 FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[sprintId]):null;
 const tickets=tables.tickets?await db.query(`SELECT initial_tickets::text AS initial,
 done_tickets::text AS done,revision FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1`,[sprintId]):null;
 const scores=tables.scores?await db.query(`SELECT confidence,clarity,revision
 FROM public.smn_sprint_scores WHERE sprint_id=$1`,[sprintId]):null;
 return {points:points?.rows[0]??null,tickets:tickets?.rows[0]??null,scores:scores?.rows[0]??null};
}
