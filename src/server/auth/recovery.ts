import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { passwordHash, verifyPassword } from "./password";
import type { Account } from "./credentials";
import { completeConfigurationTask } from "../configuration/tasks";

export function validRecoveryPhrase(value: unknown): value is string {
  return typeof value === "string" && value.length >= 20 && value.length <= 256 &&
    value.trim() === value && !value.includes("\r") && !value.includes("\n") && !value.includes("\0");
}
export function validNewPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 4 && value.length <= 256;
}
export async function renewPassword(
  client: Client, account: Account, currentPassword: string, nextPassword: string,
): Promise<boolean> {
  if (!validNewPassword(nextPassword) || !validNewPassword(currentPassword) ||
    currentPassword === nextPassword || !await verifyPassword(currentPassword, account.password_hash) ||
    await verifyPassword(nextPassword, account.password_hash)) return false;
  const hash = await passwordHash(nextPassword);
  await client.query("BEGIN");
  try {
    const locked = await client.query<{password_hash:string}>(`
      SELECT password_hash FROM public.smn_account
      WHERE id=$1 AND installation_id='singleton' AND is_active=true FOR UPDATE`, [account.id]);
    if (locked.rowCount !== 1 || locked.rows[0].password_hash !== account.password_hash) {
      await client.query("ROLLBACK"); return false;
    }
    await client.query(`UPDATE public.smn_account SET password_hash=$1,must_change_password=false
      WHERE id=$2 AND installation_id='singleton'`,[hash,account.id]);
    // Changer le mot de passe invalide aussi toute phrase de secours antérieure.
    await client.query("DELETE FROM public.smn_recovery_phrase WHERE account_id=$1",[account.id]);
    await client.query(`INSERT INTO public.smn_auth_audit(id,account_id,action)
      VALUES($1,$2,'password_changed')`, [randomUUID(),account.id]);
    await completeConfigurationTask(client,"recovery-phrase");
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
export async function prepareRecoveryPhrase(
  client: Client, account: Account, password: string, phrase: string,
): Promise<boolean> {
  if (account.role !== "admin" || account.must_change_password || !validRecoveryPhrase(phrase) ||
    !await verifyPassword(password, account.password_hash) ||
    await verifyPassword(phrase, account.password_hash)) return false;
  const phraseHash = await passwordHash(phrase);
  await client.query("BEGIN");
  try {
    const locked = await client.query<{password_hash:string}>(`
      SELECT password_hash FROM public.smn_account
      WHERE id=$1 AND installation_id='singleton' AND role='admin'
        AND is_active=true AND must_change_password=false FOR UPDATE`,[account.id]);
    if (locked.rowCount !== 1 || locked.rows[0].password_hash !== account.password_hash) {
      await client.query("ROLLBACK"); return false;
    }
    await client.query(`INSERT INTO public.smn_recovery_phrase(account_id,phrase_hash)
      VALUES($1,$2) ON CONFLICT (account_id) DO UPDATE
      SET phrase_hash=excluded.phrase_hash,created_at=now()`,[account.id,phraseHash]);
    await client.query(`INSERT INTO public.smn_auth_audit(id,account_id,action)
      VALUES($1,$2,'recovery_prepared')`,[randomUUID(),account.id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
