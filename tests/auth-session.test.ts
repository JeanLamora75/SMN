import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SessionStore, SESSION_ABSOLUTE_MS, SESSION_IDLE_MS } from "../src/server/auth/session-store";
import { LoginLimiter } from "../src/server/auth/rate-limit";
import { validLocalHost, validMutationOrigin, cookieSecure } from "../src/server/auth/guards";
import { canVisitPrivate } from "../src/server/access-policy";

describe("SMN-14 — sessions côté serveur", () => {
  it("les lectures de fond ne repoussent pas l'expiration après 30 minutes", () => {
    const store = new SessionStore();
    const token = store.issue("account", "hash", 100_000);
    assert.ok(store.get(token, 100_000 + SESSION_IDLE_MS - 1));
    assert.ok(store.get(token, 100_000 + SESSION_IDLE_MS - 10));
    assert.equal(store.get(token, 100_000 + SESSION_IDLE_MS), null);
  });
  it("activité explicite uniquement : renouvelle 30 min sans repousser 8 h", () => {
    const store = new SessionStore();
    const token = store.issue("account", "hash", 100_000);
    for (let t = 100_000 + 20 * 60_000; t < 100_000 + SESSION_ABSOLUTE_MS; t += 20 * 60_000) {
      assert.equal(store.userActivity(token, t), true);
      assert.equal(store.get(token, t)?.createdAt, 100_000);
    }
    assert.equal(store.get(token, 100_000 + SESSION_ABSOLUTE_MS), null);
    assert.equal(store.userActivity(token, 100_000 + SESSION_ABSOLUTE_MS + 1), false);
  });
  it("déconnexion et révocation de tous les jetons d'un compte", () => {
    const store = new SessionStore();
    const a = store.issue("admin", "hash", 100);
    const b = store.issue("admin", "hash", 100);
    const c = store.issue("user", "hash", 100);
    store.revoke(a);
    assert.equal(store.get(a, 101), null);
    assert.ok(store.get(b, 101));
    store.revokeAccount("admin");
    assert.equal(store.get(b, 101), null);
    assert.ok(store.get(c, 101));
  });
  it("cookies opaques et validation stricte du jeton", () => {
    const store = new SessionStore();
    const one = store.issue("admin","hash", 50);
    const two = store.issue("admin","hash", 50);
    assert.match(one, /^[a-f0-9]{64}$/);
    assert.notEqual(one, two);
    assert.equal(store.get("invalid", 51), null);
    assert.equal(store.get(one.slice(0, -1), 51), null);
    assert.equal(store.get(one, 51)?.passwordFingerprint, "hash");
  });
});
describe("SMN-14 — limitation des tentatives et protections d'origine", () => {
  it("bloque au cinquième échec sans fuite de nom de compte, 15 minutes", () => {
    const limiter = new LoginLimiter();
    const now = 100_000;
    for (let i = 0; i < 5; i++) limiter.failure("Admin", now);
    assert.equal(limiter.blocked("admin", now + 1), true);
    assert.equal(limiter.blocked("admin", now + 15 * 60 * 1000), false);
    limiter.failure("admin", now + 15 * 60 * 1000);
    limiter.success("ADMIN");
    assert.equal(limiter.blocked("admin", now + 15 * 60 * 1000 + 1), false);
  });
  it("n'accepte que l'origine identique et les hosts loopback", () => {
    assert.equal(validMutationOrigin("localhost:3003","http://localhost:3003"), true);
    assert.equal(validMutationOrigin("127.0.0.1:3003","http://127.0.0.1:3003"), true);
    assert.equal(validMutationOrigin("localhost:3003","http://localhost:3004"), false);
    assert.equal(validMutationOrigin("localhost:3003","http://evil.example"), false);
    assert.equal(validMutationOrigin("localhost:3003",null), false);
    assert.equal(validLocalHost("lmn24:3003"), false);
    assert.equal(cookieSecure("https:"), true);
    assert.equal(cookieSecure("http:"), false);
  });
  it("refuse les pages privées sans session et avec mot de passe initial", () => {
    assert.equal(canVisitPrivate(), false);
    assert.equal(canVisitPrivate({role:"admin", mustChangePassword:true}), false);
    assert.equal(canVisitPrivate({role:"user", mustChangePassword:false}), true);
    assert.equal(canVisitPrivate({role:"admin", mustChangePassword:false}), true);
    assert.equal(canVisitPrivate({role:"owner", mustChangePassword:false}), false);
  });
});
