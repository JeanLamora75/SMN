import { createHash } from "node:crypto";
export class LoginLimiter {
  private attempts = new Map<string, { count: number; until: number }>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private key(identity: string) {
    return createHash("sha256").update(identity.trim().toLowerCase()).digest("hex");
  }
  blocked(identity: string, now = Date.now()): boolean {
    const key = this.key(identity);
    const entry = this.attempts.get(key);
    if (!entry) return false;
    if (now >= entry.until) { this.attempts.delete(key); return false; }
    return entry.count >= this.MAX_ATTEMPTS;
  }
  failure(identity: string, now = Date.now()): void {
    const key = this.key(identity);
    const old = this.attempts.get(key);
    const entry = !old || now >= old.until
      ? { count: 1, until: now + this.WINDOW_MS }
      : { count: old.count + 1, until: old.until };
    if (this.attempts.size > 1000) this.attempts.clear();
    this.attempts.set(key, entry);
  }
  success(identity: string): void { this.attempts.delete(this.key(identity)); }
}
