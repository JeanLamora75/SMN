import "server-only";
import { cookies } from "next/headers";
import { SessionStore } from "./session-store";
import { LoginLimiter } from "./rate-limit";
import { accountById, passwordFingerprint, type Account } from "./credentials";
import { withAuthDb } from "./database";
import { SESSION_COOKIE } from "./guards";

type AuthState = { sessions: SessionStore; limiter: LoginLimiter };
declare global { var __smnAuthState: AuthState | undefined; }
function state(): AuthState {
  return globalThis.__smnAuthState ??= { sessions: new SessionStore(), limiter: new LoginLimiter() };
}
export function authLimiter(): LoginLimiter { return state().limiter; }
export function issueSession(account: Account): string {
  return state().sessions.issue(account.id, passwordFingerprint(account.password_hash));
}
export function revokeSession(token: string | undefined): void { state().sessions.revoke(token); }
export function revokeAccountSessions(accountId: string): void { state().sessions.revokeAccount(accountId); }
export async function sessionAccount(token: string | undefined): Promise<Account | null> {
  const session = state().sessions.get(token);
  if (!session) return null;
  try {
    const account = await withAuthDb(client => accountById(client, session.accountId));
    if (!account || passwordFingerprint(account.password_hash) !== session.passwordFingerprint) {
      state().sessions.revoke(token);
      return null;
    }
    return account;
  } catch {
    // Fail closed : une base indisponible ne justifie jamais l'accès privé.
    return null;
  }
}
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies();
  return sessionAccount(jar.get(SESSION_COOKIE)?.value);
}
export async function markUserActivity(token: string | undefined): Promise<boolean> {
  if (!await sessionAccount(token)) return false;
  return state().sessions.userActivity(token);
}
