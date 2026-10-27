import type {Client} from "pg";
export async function hidePdfArchive(db:Client,id:string,actorId:string,reason:string,expectedTeamId?:string){
 if(!/^[a-f0-9-]{36}$/i.test(id)||!actorId||!reason.trim()||reason.length>1000)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const t=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present");
 if(!t.rows[0]?.present){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_report_archive_visibility(
 archive_id text PRIMARY KEY REFERENCES public.smn_report_pdf_archive(id) ON DELETE RESTRICT,
 hidden_at timestamptz NOT NULL DEFAULT now(),hidden_by text NOT NULL,reason text NOT NULL)`);
 const record=await db.query(`SELECT a.id FROM public.smn_report_pdf_archive a
 JOIN public.smn_sprint s ON s.id=a.cycle_id AND s.team_id=a.team_id
 JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE a.id=$1 AND i.id='singleton' AND i.state='initialized'
 AND ($2::text IS NULL OR a.team_id=$2) AND s.deleted_at IS NULL FOR UPDATE OF a`,[id,expectedTeamId??null]);
 if(!record.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 await db.query(`INSERT INTO public.smn_report_archive_visibility(archive_id,hidden_by,reason)
 VALUES($1,$2,$3) ON CONFLICT(archive_id) DO NOTHING`,[id,actorId,reason.trim()]);
 await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export function authorizeExceptionalArchiveDeletion():false{return false;}
