import type {Client} from "pg";
export type AnalysisJournalFilter={type?:"human"|"ai";cycleId?:string;from?:string;to?:string};
export type AnalysisJournalEntry={id:string;type:"human"|"ai";cycleId:string;scope:string;content:string;authorId:string;createdAt:string;updatedAt:string;archiveId:string|null;origin:string};
export function normalizeAnalysisFilters(x:Record<string,string|undefined>):AnalysisJournalFilter|null{
 const result:AnalysisJournalFilter={};
 if(x.type){if(x.type!=="human"&&x.type!=="ai")return null;result.type=x.type;}
 if(x.cycleId){if(!/^[0-9a-f-]{36}$/i.test(x.cycleId))return null;result.cycleId=x.cycleId;}
 for(const key of ["from","to"] as const)if(x[key]){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x[key]!)||Number.isNaN(Date.parse(x[key]!)))return null;
  result[key]=x[key];
 }
 if(result.from&&result.to&&result.from>result.to)return null;
 return result;
}
export async function readAnalysisJournal(db:Client,teamId:string,filter:AnalysisJournalFilter):Promise<AnalysisJournalEntry[]>{
 const present=await db.query<{human:boolean;ai:boolean}>(`SELECT to_regclass('public.smn_human_analysis') IS NOT NULL AS human,
  to_regclass('public.smn_ai_brief_response') IS NOT NULL AS ai`);
 const kinds=present.rows[0];
 const sources:string[]=[];
 if(kinds?.human&&filter.type!=="ai")sources.push(`
 SELECT h.id::text AS id,'human'::text AS type,h.cycle_id AS "cycleId",
 h.scope AS scope,h.content AS content,h.author_id AS "authorId",
 h.created_at AS "createdAt",h.updated_at AS "updatedAt",
 h.archive_id::text AS "archiveId",'Humaine'::text AS origin
 FROM public.smn_human_analysis h WHERE h.team_id=$1`);
 if(kinds?.ai&&filter.type!=="human")sources.push(`
 SELECT r.id::text AS id,'ai'::text AS type,a.cycle_id AS "cycleId",
 COALESCE(r.model,r.provider,'Réponse IA manuelle') AS scope,r.response_text AS content,
 r.author_id AS "authorId",r.created_at AS "createdAt",
 r.updated_at AS "updatedAt",r.archive_id::text AS "archiveId",'IA (réponse collée)'::text AS origin
 FROM public.smn_ai_brief_response r JOIN public.smn_ai_brief_archive a ON a.id=r.archive_id
 WHERE r.team_id=$1 AND a.team_id=$1 AND r.deleted_at IS NULL`);
 if(!sources.length)return [];
 const query=`SELECT * FROM (${sources.join(" UNION ALL ")}) j
 WHERE ($2::text IS NULL OR j."cycleId"=$2)
 AND ($3::date IS NULL OR j."createdAt">=$3::date)
 AND ($4::date IS NULL OR j."createdAt"<($4::date+INTERVAL '1 day'))
 ORDER BY j."createdAt" DESC,j.id DESC LIMIT 300`;
 const rows=await db.query<AnalysisJournalEntry>(query,[teamId,filter.cycleId??null,filter.from??null,filter.to??null]);
 return rows.rows.map(r=>({...r,createdAt:new Date(r.createdAt).toISOString(),updatedAt:new Date(r.updatedAt).toISOString()}));
}
