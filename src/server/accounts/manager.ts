import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { passwordHash } from "../auth/password";

export type Role = "admin" | "user";
export type ListedAccount = {
  id: string; username: string; email: string; role: Role;
  is_active: boolean; must_change_password: boolean; created_at: Date;
};
export type AccountResult<T> = { ok: true; data: T } | {
  ok: false; error: "invalid-input" | "duplicate-account" | "account-not-found" | "last-admin" | "self-protected" | "update-failed";
};
const invalid = (): AccountResult<never> => ({ok:false,error:"invalid-input"});

export function parseNewAccount(raw: unknown): {
  username:string;email:string;role:Role; password:string;
} | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v=raw as Record<string,unknown>;
  const username=typeof v.username==="string"?v.username.trim():"";
  const email=typeof v.email==="string"?v.email.trim().toLowerCase():"";
  const password=v.password;
  if (!/^[A-Za-z0-9_.-]{2,50}$/.test(username) ||
      !/^[^\s@]{1,80}@[^\s@]{1,100}\.[^\s@]{2,20}$/.test(email) ||
      typeof password!=="string" || password.length<4 || password.length>256 ||
      (v.role!=="admin" && v.role!=="user")) return null;
  return {username,email,password,role:v.role};
}
export function parseAccountChange(raw: unknown): {role:Role;isActive:boolean} | null {
  if (!raw || typeof raw!=="object" || Array.isArray(raw)) return null;
  const v=raw as Record<string,unknown>;
  return (v.role==="admin" || v.role==="user") && typeof v.isActive==="boolean"
    ? {role:v.role,isActive:v.isActive} : null;
}
export async function listAccounts(client: Client): Promise<ListedAccount[]> {
  const r=await client.query<ListedAccount>(`
    SELECT id,username,email,role,is_active,must_change_password,created_at
    FROM public.smn_account ORDER BY created_at ASC,username ASC LIMIT 500`);
  return r.rows;
}
export async function createAccount(client:Client,body:unknown):Promise<AccountResult<ListedAccount>> {
  const input=parseNewAccount(body);
  if (!input) return invalid();
  const hash=await passwordHash(input.password);
  try {
    const r=await client.query<ListedAccount>(`
      INSERT INTO public.smn_account
        (id,installation_id,username,email,role,password_hash,must_change_password,is_active)
      VALUES($1,'singleton',$2,$3,$4,$5,true,true)
      RETURNING id,username,email,role,is_active,must_change_password,created_at
    `,[randomUUID(),input.username,input.email,input.role,hash]);
    return {ok:true,data:r.rows[0]};
  } catch(error) {
    if (error && typeof error==="object" && "code" in error && error.code==="23505")
      return {ok:false,error:"duplicate-account"};
    throw error;
  }
}
export async function updateAccount(
  client:Client,id:string,actorId:string,body:unknown,
):Promise<AccountResult<ListedAccount>> {
  const input=parseAccountChange(body);
  if (!input || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return invalid();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(20261020, 15)");
    const row=await client.query<ListedAccount>(`
      SELECT id,username,email,role,is_active,must_change_password,created_at
      FROM public.smn_account WHERE id=$1 FOR UPDATE`,[id]);
    const current=row.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return {ok:false,error:"account-not-found"};
    }
    if (id===actorId && (input.role!==current.role || input.isActive!==current.is_active)) {
      await client.query("ROLLBACK");
      return {ok:false,error:"self-protected"};
    }
    if (current.role==="admin" && current.is_active && (input.role!=="admin" || !input.isActive)) {
      const count=await client.query<{count:string}>(`
        SELECT count(*)::text AS count FROM public.smn_account
        WHERE role='admin' AND is_active=true`);
      if (Number(count.rows[0]?.count)<=1) {
        await client.query("ROLLBACK");
        return {ok:false,error:"last-admin"};
      }
    }
    const result=await client.query<ListedAccount>(`
      UPDATE public.smn_account SET role=$2,is_active=$3 WHERE id=$1
      RETURNING id,username,email,role,is_active,must_change_password,created_at`,
      [id,input.role,input.isActive]);
    await client.query("COMMIT");
    return {ok:true,data:result.rows[0]};
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
