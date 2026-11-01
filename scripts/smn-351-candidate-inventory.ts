import type {Client} from "pg";
import {createHash} from "node:crypto";
export const retiredCandidates=[
 "smn_sprint_story_points","smn_sprint_ticket_counts",
 "smn_sprint_story_points_audit","smn_sprint_ticket_counts_audit"
] as const;
/** Read-only inventory. Never returns business data; digest detects changes between checks. */
export async function inventoryRetiredCandidates(db:Client){
 const output: {table:string;exists:boolean;rows:string|null;digest:string|null}[]=[];
 for(const table of retiredCandidates){
  const present=await db.query<{present:boolean}>("SELECT to_regclass($1) IS NOT NULL AS present",["public."+table]);
  if(!present.rows[0]?.present){output.push({table,exists:false,rows:null,digest:null});continue;}
  const result=await db.query<{payload:string}>(`SELECT row_to_json(t)::text AS payload FROM public."${table}" t ORDER BY row_to_json(t)::text`);
  const hash=createHash("sha256");
  for(const row of result.rows)hash.update(row.payload).update("\n");
  output.push({table,exists:true,rows:String(result.rows.length),digest:hash.digest("hex")});
 }
 return output;
}
