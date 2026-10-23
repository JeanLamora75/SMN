import type {Client} from "pg";
import {permittedContextUrl,type TeamContextSources,type TeamContextEntry} from "@/lib/report-team-context";
const empty=():TeamContextSources=>({vision:null,productGoal:null,dod:null,dor:null});
/** Read a known team-owned context producer only. Never query product-wide fallback. */
export async function readTeamReportContext(db:Client,teamId:string):Promise<TeamContextSources>{
 const availability=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_team_context') IS NOT NULL AS present`);
 if(!availability.rows[0]?.present)return empty();
 const cols=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='smn_team_context'`);
 const fields=new Set(cols.rows.map(x=>x.column_name));
 if(!["team_id","vision","product_goal","dod","dor"].every(k=>fields.has(k)))return empty();
 const r=await db.query<Record<string,unknown>>(`SELECT c.* FROM public.smn_team_context c
 JOIN public.smn_team t ON t.id=c.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE c.team_id=$1 AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode) IN ('scrum','kanban') LIMIT 1`,[teamId]);
 const row=r.rows[0];if(!row)return empty();
 const parse=(field:string,kind:"text"|"url"="text"):TeamContextEntry|null=>{
  const v=row[field];if(typeof v!=="string"||!v.trim())return null;
  const trimmed=v.trim();
  const actualKind=kind==="url"||permittedContextUrl(trimmed)?"url":"text";
  if(actualKind==="url"&&!permittedContextUrl(trimmed))return null;
  return {kind:actualKind,value:trimmed,language:typeof row.language==="string"?row.language:null,
    recordedAt:row.updated_at instanceof Date?row.updated_at.toISOString():
    typeof row.updated_at==="string"?row.updated_at:null};
 };
 return {vision:parse("vision"),productGoal:parse("product_goal"),
 dod:parse("dod"),dor:parse("dor")};
}
