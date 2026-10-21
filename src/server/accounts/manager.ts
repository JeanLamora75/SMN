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
    FROM public.smn_account WHERE installation_id='singleton' ORDER BY created_at ASC,username ASC LIMIT 500`);
  return r.rows;
}
export async function createAccount(client:Client,body:unknown,actorId:string):Promise<AccountResult<ListedAccount>> {
  const input=parseNewAccount(body);
  if (!input || !actorId) return invalid();
  const hash=await passwordHash(input.password);
  await client.query("BEGIN");
  try {
    const r=await client.query<ListedAccount>(`
      INSERT INTO public.smn_account
        (id,installation_id,username,email,role,password_hash,must_change_password,is_active)
      VALUES($1,'singleton',$2,$3,$4,$5,true,true)
      RETURNING id,username,email,role,is_active,must_change_password,created_at
    `,[randomUUID(),input.username,input.email,input.role,hash]);
    if(r.rowCount!==1 || !r.rows[0])throw new Error("account-create-unavailable");
    await client.query(`INSERT INTO public.smn_account_audit
      (id,installation_id,actor_id,object_id,action,old_values,new_values)
      VALUES($1,'singleton',$2,$3,'account_created',$4::jsonb,$5::jsonb)`,
      [randomUUID(),actorId,r.rows[0].id,"{}",JSON.stringify({role:input.role,isActive:true})]);
    await client.query("COMMIT");
    return {ok:true,data:r.rows[0]};
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
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
      FROM public.smn_account WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[id]);
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
        WHERE installation_id='singleton' AND role='admin' AND is_active=true`);
      if (Number(count.rows[0]?.count)<=1) {
        await client.query("ROLLBACK");
        return {ok:false,error:"last-admin"};
      }
    }
    if(current.role===input.role&&current.is_active===input.isActive){
      await client.query("COMMIT");
      return {ok:true,data:current};
    }
    const result=await client.query<ListedAccount>(`
      UPDATE public.smn_account SET role=$2,is_active=$3 WHERE id=$1 AND installation_id='singleton'
      RETURNING id,username,email,role,is_active,must_change_password,created_at`,
      [id,input.role,input.isActive]);
    if(result.rowCount!==1||!result.rows[0])throw new Error("account-update-unavailable");
    await client.query(`INSERT INTO public.smn_account_audit
      (id,installation_id,actor_id,object_id,action,old_values,new_values)
      VALUES($1,'singleton',$2,$3,'account_updated',$4::jsonb,$5::jsonb)`,
      [randomUUID(),actorId,id,JSON.stringify({role:current.role,isActive:current.is_active}),
        JSON.stringify({role:input.role,isActive:input.isActive})]);
    await client.query("COMMIT");
    return {ok:true,data:result.rows[0]};
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
