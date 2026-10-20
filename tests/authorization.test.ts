import test from "node:test";
import assert from "node:assert/strict";
import { canAccess, protectedOperation, type AccessActor, type AccessResource } from "../src/server/access-policy";

const actions = ["read", "write", "generate", "download"] as const;
const resources = ["collective", "individual", "accounts", "settings", "documents", "backups"] as const;
const actor = (role: string): AccessActor => ({ role, is_active: true, must_change_password: false });
const resource = (type: string): AccessResource => ({ type, exists: true, inScope: true, format: "PDF", userAuthorized: true });

// Oracle explicite indépendant de l'implémentation.
for (const role of ["admin", "user", "unknown"]) {
  for (const type of resources) for (const action of actions) {
    test(`${role}: ${action} ${type}`, () => {
      const expected = role === "admin"
        ? !(type === "documents" && action === "generate")
        : role === "user" && ((type === "collective" && action === "read") ||
          (type === "documents" && (action === "read" || action === "download")));
      assert.equal(canAccess(actor(role), action, resource(type)), expected);
    });
  }
}
test("fail closed: invalid actors, actions, resources and server metadata", () => {
  for (const a of [null, undefined, { ...actor("admin"), is_active: false },
    { ...actor("admin"), must_change_password: true }, { role: "admin" }]) {
    for (const type of resources) for (const action of actions)
      assert.equal(canAccess(a, action, resource(type)), false);
  }
  for (const role of ["admin", "user"]) for (const action of actions) for (const type of resources) {
    for (const flag of ["exists", "inScope"] as const) for (const value of [false, undefined, "true", 1]) {
      assert.equal(canAccess(actor(role), action, { ...resource(type), [flag]: value }), false);
    }
  }
  assert.equal(canAccess(actor("admin"), "execute", resource("collective")), false);
  assert.equal(canAccess(actor("admin"), "read", resource("unknown")), false);
});
test("documents: known existing PDF/TXT only; explicit user permission; admin generation targets collection", () => {
  for (const role of ["admin", "user"]) for (const format of ["PDF", "TXT", "pdf", "DOCX", undefined]) {
    for (const action of ["read", "download"] as const) {
      assert.equal(canAccess(actor(role), action, { ...resource("documents"), format }), format === "PDF" || format === "TXT");
    }
  }
  for (const userAuthorized of [false, undefined, "true", 1]) {
    assert.equal(canAccess(actor("user"), "read", { ...resource("documents"), userAuthorized }), false);
  }
  assert.equal(canAccess(actor("admin"), "read", { ...resource("documents"), userAuthorized: false }), true);
  assert.equal(canAccess(actor("admin"), "generate", { ...resource("documents"), collection: true, format: undefined }), true);
  assert.equal(canAccess(actor("user"), "generate", { ...resource("documents"), collection: true }), false);
  assert.equal(canAccess(actor("admin"), "read", { ...resource("documents"), collection: true }), false);
});
test("protected operation never invokes callback or releases content after denial", async () => {
  let calls = 0;
  const read = () => { calls++; return { content: "private" }; };
  for (const role of ["admin", "user", "unknown"]) for (const type of resources) for (const action of actions) {
    const before = calls;
    const result = await protectedOperation(actor(role), action, resource(type), read);
    assert.deepEqual(result, canAccess(actor(role), action, resource(type))
      ? { allowed: true, data: { content: "private" } } : { allowed: false });
    assert.equal(calls - before, result.allowed ? 1 : 0);
  }
  for (const invalid of [{ ...resource("documents"), userAuthorized: false },
    { ...resource("collective"), exists: false }, { ...resource("collective"), inScope: false }]) {
    const before = calls;
    assert.deepEqual(await protectedOperation(actor("user"), "read", invalid, read), { allowed: false });
    assert.equal(calls, before);
  }
});

test("protected operation explicitly denies invalid inputs without invoking its callback", async () => {
  const deniedCases: { actor: AccessActor | null; action: string; resource: AccessResource }[] = [
    { actor: null, action: "read", resource: resource("collective") },
    { actor: { ...actor("admin"), is_active: false }, action: "read", resource: resource("collective") },
    { actor: { ...actor("admin"), must_change_password: true }, action: "read", resource: resource("collective") },
    { actor: actor("admin"), action: "execute", resource: resource("collective") },
    { actor: actor("admin"), action: "read", resource: resource("unknown") },
    { actor: actor("admin"), action: "read", resource: { type: "collective", inScope: true } },
    { actor: actor("admin"), action: "read", resource: { type: "collective", exists: true } },
  ];
  let calls = 0;
  const read = () => { calls++; return { content: "private" }; };
  for (const denied of deniedCases) {
    const before = calls;
    assert.deepEqual(await protectedOperation(denied.actor,
      denied.action as Parameters<typeof protectedOperation>[1], denied.resource, read), { allowed: false });
    assert.equal(calls, before);
  }
});
