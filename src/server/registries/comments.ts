import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const idRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const textMax=4000;
type Failure={ok:false;error:"invalid-input"|"not-found"|"conflict"|"withdrawn"};
type Success={ok:true;id:string;revision:number};
type Reply=Failure|Success;

export function parseNewComment(raw:unknown):{text:string}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).sort().join(",")!=="text"||typeof value.text!=="string"||
  !value.text.trim()||value.text.length>textMax)return null;
 return {text:value.text.trim()};
}
export function parseCommentRevision(raw:unknown):{text:string;revision:number}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).sort().join(",")!=="revision,text"||
  !Number.isSafeInteger(value.revision)||Number(value.revision)<1)return null;
 const parsed=parseNewComment({text:value.text});
 return parsed?{...parsed,revision:value.revision as number}:null;
}
export function parseCommentWithdrawal(raw:unknown):{revision:number}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 return Object.keys(value).join(",")==="revision"&&
  Number.isSafeInteger(value.revision)&&Number(value.revision)>=1?
  {revision:value.revision as number}:null;
}

/** Additive DDL is only run inside a controlled mutation transaction.
 * Readers must never create or backfill records, and no legacy text is copied.
 */
export async function ensureCommentSchema(db:Client):Promise<void>{
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_registry_comment(
  id text PRIMARY KEY,
  item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 4000),
  revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
  author_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  editor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  editor_name text,
  withdrawn_at timestamptz,
  withdrawn_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  withdrawn_by_name text,
  CHECK(withdrawn_at IS NULL OR withdrawn_by_name IS NOT NULL))`);
 await db.query(`CREATE INDEX IF NOT EXISTS smn_registry_comment_item_date
  ON public.smn_registry_comment(item_id,created_at DESC,id DESC)`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_registry_comment_revision(
  id text PRIMARY KEY,
  comment_id text NOT NULL REFERENCES public.smn_registry_comment(id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK(revision>=1),
  action text NOT NULL CHECK(action IN ('created','edited','withdrawn')),
  before_text text,
  after_text text,
  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id,revision))`);
}
async function scopedItem(db:Client,itemId:string,lock:boolean,teamId?:string){
 const result=await db.query<{id:string;comment:string|null}>(`SELECT r.id,r.comment
  FROM public.smn_registry_item r
  JOIN public.smn_team t ON t.id=r.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'
   AND lower(i.mode) IN ('scrum','kanban')
   AND ($2::text IS NULL OR r.team_id=$2)
   AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
  ${lock?"FOR UPDATE OF r":""}`,[itemId,teamId??null]);
 return result.rows.length===1?result.rows[0]:null;
}
async function actorIdentity(db:Client,actorId:string){
 const result=await db.query<{username:string}>(`SELECT username FROM public.smn_account
  WHERE id=$1 AND is_active=true`,[actorId]);
 return result.rows.length===1&&typeof result.rows[0].username==="string"?
  result.rows[0].username:null;
}
function missingLegacy(text:string|null|undefined,admin:boolean){
 return admin&&typeof text==="string"&&text.length>0?
  {text,author:null,recordedAt:null,origin:"legacy" as const}:null;
}

export async function createRegistryComment(db:Client,actorId:string,itemId:string,raw:unknown,
 scope?:Readonly<{actor:TeamActor;teamId:string}>):Promise<Reply>{
 const parsed=parseNewComment(raw);
 if(!parsed||!idRx.test(itemId)||!actorId)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const team=scope?await resolveAdminTeam(db,scope.actor,scope.teamId):null;
  if(scope&&scope.actor.accountId!==actorId)throw Error("team-access-forbidden");
  const item=await scopedItem(db,itemId,true,team?.team_id);
  if(!item){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  const name=await actorIdentity(db,actorId);
  if(!name){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  await ensureCommentSchema(db);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_registry_comment(
   id,item_id,body,revision,author_id,author_name)
   VALUES($1,$2,$3,1,$4,$5)`,[id,itemId,parsed.text,actorId,name]);
  await db.query(`INSERT INTO public.smn_registry_comment_revision(
   id,comment_id,revision,action,before_text,after_text,actor_id,actor_name)
   VALUES($1,$2,1,'created',NULL,$3,$4,$5)`,
   [randomUUID(),id,parsed.text,actorId,name]);
  await db.query("COMMIT");
  return {ok:true,id,revision:1};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
type Current={id:string;body:string;revision:number;withdrawnAt:string|null};
export async function reviseRegistryComment(db:Client,actorId:string,itemId:string,
 commentId:string,action:"edit"|"withdraw",raw:unknown):Promise<Reply>{
 const parsedEdit=action==="edit"?parseCommentRevision(raw):null;
 const parsedWithdrawal=action==="withdraw"?parseCommentWithdrawal(raw):null;
 const parsed=parsedEdit??parsedWithdrawal;
 if(!parsed||!idRx.test(itemId)||!idRx.test(commentId)||!actorId)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  if(!await scopedItem(db,itemId,true)){
   await db.query("ROLLBACK");return {ok:false,error:"not-found"};
  }
  const installed=await db.query<{installed:boolean}>(`SELECT
   to_regclass('public.smn_registry_comment') IS NOT NULL AS installed`);
  if(!installed.rows[0]?.installed){
   await db.query("ROLLBACK");return {ok:false,error:"not-found"};
  }
  const record=await db.query<Current>(`SELECT c.id,c.revision,c.body,
   c.withdrawn_at::text AS "withdrawnAt" FROM public.smn_registry_comment c
   WHERE c.id=$1 AND c.item_id=$2 FOR UPDATE`,[commentId,itemId]);
  const old=record.rows[0];
  if(!old){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  if(old.revision!==parsed.revision){
   await db.query("ROLLBACK");return {ok:false,error:"conflict"};
  }
  if(old.withdrawnAt!==null){
   await db.query("ROLLBACK");return {ok:false,error:"withdrawn"};
  }
  const name=await actorIdentity(db,actorId);
  if(!name){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  if(parsedEdit!==null&&old.body===parsedEdit.text){
   await db.query("ROLLBACK");return {ok:false,error:"invalid-input"};
  }
  const revision=old.revision+1;
  const text=parsedEdit?.text??null;
  if(action==="edit")await db.query(`UPDATE public.smn_registry_comment SET body=$2,
   revision=$3,edited_at=now(),editor_id=$4,editor_name=$5 WHERE id=$1`,
   [commentId,text,revision,actorId,name]);
  else await db.query(`UPDATE public.smn_registry_comment
   SET withdrawn_at=now(),withdrawn_by=$2,withdrawn_by_name=$3,revision=$4
   WHERE id=$1`,[commentId,actorId,name,revision]);
  await db.query(`INSERT INTO public.smn_registry_comment_revision(
   id,comment_id,revision,action,before_text,after_text,actor_id,actor_name)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
   [randomUUID(),commentId,revision,action==="edit"?"edited":"withdrawn",
    old.body,text,actorId,name]);
  await db.query("COMMIT");
  return {ok:true,id:commentId,revision};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}

type CommentRow={
 id:string;body:string;revision:number;authorName:string;
 createdAt:string;editedAt:string|null;editorName:string|null;
 withdrawnAt:string|null;withdrawnByName:string|null
};
export async function readRegistryComments(db:Client,itemId:string,admin:boolean){
 if(!idRx.test(itemId))return null;
 const item=await scopedItem(db,itemId,false);
 if(!item)return null;
 const legacy=missingLegacy(item.comment,admin);
 const available=await db.query<{installed:boolean}>(`SELECT
  to_regclass('public.smn_registry_comment') IS NOT NULL AS installed`);
 if(!available.rows[0]?.installed)return {comments:[],legacy};
 const rows=await db.query<CommentRow>(`SELECT c.id,c.body,c.revision,
  c.author_name AS "authorName",c.created_at::text AS "createdAt",
  c.edited_at::text AS "editedAt",c.editor_name AS "editorName",
  c.withdrawn_at::text AS "withdrawnAt",
  c.withdrawn_by_name AS "withdrawnByName"
  FROM public.smn_registry_comment c WHERE c.item_id=$1
  ORDER BY c.created_at DESC,c.id DESC`,[itemId]);
 return {comments:rows.rows.map(x=>({
  id:x.id,
  text:x.withdrawnAt===null?x.body:null,
  revision:x.revision,
  createdAt:x.createdAt,
  editedAt:x.editedAt,
  withdrawnAt:x.withdrawnAt,
  edited:x.editedAt!==null,
  withdrawn:x.withdrawnAt!==null,
  authorName:admin?x.authorName:null,
  editorName:admin?x.editorName:null,
  withdrawnByName:admin?x.withdrawnByName:null
 })),legacy};
}

type VersionRow={revision:number;action:string;beforeText:string|null;
 afterText:string|null;actorName:string;changedAt:string};
export async function readCommentRevisions(db:Client,itemId:string,commentId:string){
 if(!idRx.test(itemId)||!idRx.test(commentId))return null;
 if(!await scopedItem(db,itemId,false))return null;
 const available=await db.query<{installed:boolean}>(`SELECT
  to_regclass('public.smn_registry_comment') IS NOT NULL AND
  to_regclass('public.smn_registry_comment_revision') IS NOT NULL AS installed`);
 if(!available.rows[0]?.installed)return null;
 const exists=await db.query<{id:string}>(`SELECT id FROM public.smn_registry_comment
  WHERE id=$1 AND item_id=$2`,[commentId,itemId]);
 if(exists.rows.length!==1)return null;
 const versions=await db.query<VersionRow>(`SELECT v.revision,v.action,
  v.before_text AS "beforeText",v.after_text AS "afterText",
  v.actor_name AS "actorName",v.changed_at::text AS "changedAt"
  FROM public.smn_registry_comment_revision v
  WHERE v.comment_id=$1 ORDER BY v.revision DESC`,[commentId]);
 return {versions:versions.rows};
}
