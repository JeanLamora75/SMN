import "server-only";
import type {Client} from "pg";
import {listLinks,type LinkActor} from "@/server/links/catalog";
import {LinkError} from "@/server/links/validation";

export async function readReportLinks(db:Client,sprintId:string){
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_link_selection') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return {ids:[] as string[],revision:0};
 const rows=await db.query<{link_ids:unknown;revision:number}>(`SELECT link_ids,revision FROM public.smn_report_link_selection WHERE sprint_id=$1`,[sprintId]);
 const row=rows.rows[0];return row&&Array.isArray(row.link_ids)?{ids:row.link_ids as string[],revision:row.revision}:{ids:[],revision:0};
}
export async function saveReportLinks(db:Client,actor:LinkActor,sprintId:string,teamId:string,ids:unknown,revision:unknown){
 if(!Array.isArray(ids)||ids.length>100||!ids.every(id=>typeof id==="string")||
  new Set(ids).size!==ids.length||!Number.isSafeInteger(revision)||Number(revision)<0)throw new LinkError("invalid-input");
 const visible=await listLinks(db,actor,teamId);
 const allowed=new Set(visible.map(link=>link.id as string));
 if(!ids.every(id=>allowed.has(id)))throw new LinkError("forbidden");
 await db.query("BEGIN");
 try{
  const cycle=await db.query(`SELECT id FROM public.smn_sprint WHERE id=$1 AND team_id=$2 AND deleted_at IS NULL FOR UPDATE`,[sprintId,teamId]);
  if(cycle.rowCount!==1)throw new LinkError("not-found");
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_report_link_selection(
   sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
   link_ids jsonb NOT NULL,revision integer NOT NULL CHECK(revision>0),
   updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   updated_at timestamptz NOT NULL DEFAULT now())`);
  const old=await db.query<{revision:number}>(`SELECT revision FROM public.smn_report_link_selection WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
  if((old.rows[0]?.revision??0)!==revision)throw new LinkError("conflict");
  const next=Number(revision)+1;
  await db.query(`INSERT INTO public.smn_report_link_selection(sprint_id,link_ids,revision,updated_by)
   VALUES($1,$2::jsonb,$3,$4)
   ON CONFLICT(sprint_id) DO UPDATE SET link_ids=EXCLUDED.link_ids,
   revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=now()`,
   [sprintId,JSON.stringify(ids),next,actor.id]);
  await db.query("COMMIT");
  return {revision:next};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
