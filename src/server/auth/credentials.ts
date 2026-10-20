import { createHash } from "node:crypto";
import type { Client } from "pg";
import { verifyPassword, passwordHash } from "./password";

export type Account = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  password_hash: string;
  must_change_password: boolean;
  is_active: boolean;
};
const FAKE_PASSWORD_HASH = "scrypt:1:" + "0".repeat(32) + ":" + "0".repeat(128);
export function passwordFingerprint(hash: string): string {
  return createHash("sha256").update(hash).digest("hex");
}
export async function authenticate(client: Client, identity: string, password: string): Promise<Account | null> {
  if (!identity || identity.length > 200 || !password || password.length > 256) return null;
  const query = await client.query<Account>(`
    SELECT a.id, a.username, a.email, a.role, a.password_hash, a.must_change_password, a.is_active
    FROM public.smn_account a
    JOIN public.smn_installation i ON i.id=a.installation_id
    WHERE i.state='initialized' AND a.is_active=true AND (lower(a.username)=lower($1) OR lower(a.email)=lower($1))
    LIMIT 2
  `, [identity.trim()]);
  const account = query.rows.length === 1 ? query.rows[0] : undefined;
  const verified = await verifyPassword(password, account?.password_hash ?? FAKE_PASSWORD_HASH);
  if (!verified || !account || (account.role !== "admin" && account.role !== "user")) return null;
  return account;
}
export async function accountById(client: Client, id: string): Promise<Account | null> {
  const response = await client.query<Account>(`
    SELECT a.id,a.username,a.email,a.role,a.password_hash,a.must_change_password,a.is_active
    FROM public.smn_account a
    JOIN public.smn_installation i ON i.id=a.installation_id
    WHERE a.id=$1 AND i.state='initialized' AND a.is_active=true LIMIT 1
  `, [id]);
  const a = response.rows[0];
  return a && (a.role === "admin" || a.role === "user") ? a : null;
}
export async function changeInitialPassword(client: Client, account: Account, oldPassword: string, nextPassword: string): Promise<boolean> {
  if (nextPassword.length < 4 || nextPassword.length > 256 || !account.must_change_password) return false;
  if (!await verifyPassword(oldPassword, account.password_hash) || await verifyPassword(nextPassword, account.password_hash)) return false;
  const newHash = await passwordHash(nextPassword);
  const r = await client.query(`
    UPDATE public.smn_account SET password_hash=$1, must_change_password=false
    WHERE id=$2 AND password_hash=$3 AND must_change_password=true
  `, [newHash, account.id, account.password_hash]);
  return r.rowCount === 1;
}
