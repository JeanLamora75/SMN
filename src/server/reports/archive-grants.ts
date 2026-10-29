import type {Client} from "pg";
export async function archiveUserAuthorized(db:Client,archiveId:string,userId:string):Promise<boolean>{
 const has=await db.query<{yes:boolean}>("SELECT to_regclass('public.smn_report_archive_grant') IS NOT NULL AS yes");
 if(!has.rows[0]?.yes)return false;
 const r=await db.query(`SELECT 1 FROM public.smn_report_archive_grant
 WHERE archive_id=$1 AND user_id=$2 AND revoked_at IS NULL`,[archiveId,userId]);
 return r.rows.length===1;
}
export async function grantArchiveUser(db:Client,archiveId:string,userId:string,actorId:string){
 if(!/^[a-f0-9-]{36}$/i.test(archiveId)||!userId||!actorId)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const visibility=await db.query<{yes:boolean}>("SELECT to_regclass('public.smn_report_archive_visibility') IS NOT NULL AS yes");
  const hidden=visibility.rows[0]?.yes?"AND NOT EXISTS (SELECT 1 FROM public.smn_report_archive_visibility h WHERE h.archive_id=a.id)":"";
  const scope=await db.query(`SELECT 1 FROM public.smn_report_pdf_archive a
  JOIN public.smn_sprint s ON s.id=a.cycle_id AND s.team_id=a.team_id
  JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE a.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
  AND lower(i.mode)='scrum' ${hidden}`,[archiveId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT to_regclass('public.smn_report_archive_grant') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  const user=await db.query(`SELECT 1 FROM public.smn_account WHERE id=$1 AND role='user' AND is_active=true`,[userId]);
  if(user.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query(`INSERT INTO public.smn_report_archive_grant(archive_id,user_id,granted_by)
   VALUES($1,$2,$3) ON CONFLICT(archive_id,user_id) DO UPDATE SET revoked_at=NULL,granted_by=EXCLUDED.granted_by,granted_at=now()`,[archiveId,userId,actorId]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

export async function revokeArchiveUser(db:Client,archiveId:string,userId:string){
 if(!/^[a-f0-9-]{36}$/i.test(archiveId)||!userId)return {ok:false as const,error:"invalid-input"};
 const has=await db.query<{yes:boolean}>("SELECT to_regclass('public.smn_report_archive_grant') IS NOT NULL AS yes");
 if(!has.rows[0]?.yes)return {ok:false as const,error:"not-found"};
 const result=await db.query(`UPDATE public.smn_report_archive_grant SET revoked_at=now()
 WHERE archive_id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING archive_id`,[archiveId,userId]);
 return result.rows.length?{ok:true as const}:{ok:false as const,error:"not-found"};
}
