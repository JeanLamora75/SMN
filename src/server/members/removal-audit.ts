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

/** Hard blockers: missing schema or any FK pointing to a member. */
export async function memberDeletionBlockers(db:Pick<Client,"query">,id:string){
 const refs=await db.query<{table_name:string;dependent_count:string}>(`
  SELECT c.conrelid::regclass::text AS table_name,'1' AS dependent_count
  FROM pg_catalog.pg_constraint c
  WHERE c.contype='f' AND c.confrelid='public.smn_member'::regclass
  ORDER BY c.conrelid::regclass::text`);
 // Other domain reference tables may be present, including future upgrades:
 // this routine does not claim absence by mere FK catalog enumeration.
 return refs.rows.map(r=>r.table_name);
}
