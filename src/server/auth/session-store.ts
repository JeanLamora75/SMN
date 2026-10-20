import { createHash, randomBytes } from "node:crypto";

export type StoredSession = {
  accountId: string;
  passwordFingerprint: string;
  createdAt: number;
  lastActivityAt: number;
};
export const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
const keyOf = (token: string) => createHash("sha256").update(token).digest("hex");

export class SessionStore {
  private readonly sessions = new Map<string, StoredSession>();
  issue(accountId: string, passwordFingerprint: string, now = Date.now()): string {
    this.prune(now);
    const token = randomBytes(32).toString("hex");
    this.sessions.set(keyOf(token), { accountId, passwordFingerprint, createdAt: now, lastActivityAt: now });
    return token;
  }
  get(token: string | undefined, now = Date.now()): StoredSession | null {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const key = keyOf(token);
    const item = this.sessions.get(key);
    if (!item) return null;
    if (now >= item.createdAt + SESSION_ABSOLUTE_MS || now >= item.lastActivityAt + SESSION_IDLE_MS) {
      this.sessions.delete(key);
      return null;
    }
    return { ...item };
  }
  userActivity(token: string | undefined, now = Date.now()): boolean {
    const valid = this.get(token, now);
    if (!valid || !token) return false;
    const key = keyOf(token);
    this.sessions.set(key, { ...valid, lastActivityAt: now });
    return true;
  }
  revoke(token: string | undefined): void {
    if (token && /^[a-f0-9]{64}$/.test(token)) this.sessions.delete(keyOf(token));
  }
  revokeAccount(accountId: string): void {
    for (const [key, value] of this.sessions) if (value.accountId === accountId) this.sessions.delete(key);
  }
  private prune(now: number): void {
    for (const [key, s] of this.sessions) {
      if (now >= s.createdAt + SESSION_ABSOLUTE_MS || now >= s.lastActivityAt + SESSION_IDLE_MS) this.sessions.delete(key);
    }
    // Le pilote local ne garde jamais une collection de sessions illimitée.
    while (this.sessions.size >= 1000) this.sessions.delete(this.sessions.keys().next().value!);
  }
}
