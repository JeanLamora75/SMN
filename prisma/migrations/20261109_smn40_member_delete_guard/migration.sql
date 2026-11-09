-- SMN-40: close the legacy ordinary-delete bypass for member data.
-- Every DELETE of smn_member must have a transaction-local immutable SMN-39
-- receipt already inserted in the *same* transaction (including row count).
-- Additive to native v33; never rewrite the native baseline.
CREATE OR REPLACE FUNCTION public.smn40_guard_member_delete()
RETURNS trigger LANGUAGE plpgsql AS $smn40$
DECLARE
 receipt_id text := nullif(current_setting('smn.privacy_receipt_id',true),'');
BEGIN
 IF receipt_id IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.smn_privacy_erasure_receipt r
  WHERE r.id::text=receipt_id AND r.operation='erase'
   AND r.affected_rows>=1
 ) THEN
  RAISE EXCEPTION 'smn40-member-delete-requires-audited-intent'
   USING ERRCODE='55000';
 END IF;
 RETURN OLD;
END;
$smn40$;
DROP TRIGGER IF EXISTS smn40_member_delete_guard ON public.smn_member;
CREATE TRIGGER smn40_member_delete_guard
 BEFORE DELETE ON public.smn_member
 FOR EACH ROW EXECUTE FUNCTION public.smn40_guard_member_delete();
