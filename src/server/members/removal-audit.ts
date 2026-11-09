import type {Client} from "pg";

/**
 * SMN-36 — ordinary deletion is allowed only with explicit, auditable scope.
 * The audit must survive removal of its source member: it has NO foreign key
 * to smn_member and intentionally contains no personal name or email.
 */
export const MEMBER_REMOVAL_AUDIT_SQL=`
CREATE TABLE IF NOT EXISTS public.smn_member_removal_audit (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 member_id text NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 revision integer NOT NULL CHECK(revision >= 0),
 removed_at timestamptz NOT NULL DEFAULT now(),
 operation text NOT NULL DEFAULT 'ordinary_delete'
  CHECK(operation = 'ordinary_delete'),
 reference_count integer NOT NULL DEFAULT 0 CHECK(reference_count = 0),
 preview_confirmation text NOT NULL DEFAULT 'SUPPRIMER'
  CHECK(preview_confirmation = 'SUPPRIMER')
);
CREATE INDEX IF NOT EXISTS smn_member_removal_audit_member_idx
 ON public.smn_member_removal_audit(installation_id,member_id,removed_at DESC);
`;
export async function requireMemberRemovalAudit(db:Pick<Client,"query">){
 const check=await db.query<{present:boolean}>(`
  SELECT to_regclass('public.smn_member_removal_audit') IS NOT NULL AS present`);
 if(check.rows[0]?.present!==true)throw new Error("member-removal-audit-not-ready");
}

/** Inspect actual rows in any single-column FK referring to this member.
 * Always fail closed for multi-column or uninspectable relationships.
 */
export async function inspectMemberForeignReferences(
 db:Pick<Client,"query">,id:string
):Promise<{count:number;unknown:boolean;tables:{name:string;count:number}[]}>{
 const keys=await db.query<{table_name:string;column_name:string;arity:number}>(`
  SELECT format('"%s"."%s"',ns.nspname,rel.relname) AS table_name,
   att.attname AS column_name,cardinality(c.conkey)::int AS arity
  FROM pg_catalog.pg_constraint c
  JOIN pg_catalog.pg_class rel ON rel.oid=c.conrelid
  JOIN pg_catalog.pg_namespace ns ON ns.oid=rel.relnamespace
  LEFT JOIN pg_catalog.pg_attribute att
   ON att.attrelid=c.conrelid AND att.attnum=c.conkey[1]
  WHERE c.contype='f' AND c.confrelid='public.smn_member'::regclass
   AND ns.nspname='public'
  ORDER BY rel.relname,c.conname`);
 let count=0,unknown=false;const tables:{name:string;count:number}[]=[];
 for(const key of keys.rows){
  if(key.arity!==1||!key.column_name||!/^"[a-z0-9_]+"\."[a-z0-9_]+"$/.test(key.table_name)){
   unknown=true;continue;
  }
  const col='"'+key.column_name.replace(/"/g,'""')+'"';
  const rows=await db.query<{n:string}>(`SELECT count(*)::text AS n
   FROM ${key.table_name} WHERE ${col}::text=$1`,[id]);
  const n=Number(rows.rows[0]?.n);
  if(!Number.isSafeInteger(n)||n<0){unknown=true;continue;}
  count+=n;
  tables.push({name:key.table_name,count:n});
 }
 return {count,unknown,tables};
}
