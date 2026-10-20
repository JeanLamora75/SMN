import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { runManagedProcess } from "../src/server/bootstrap/managed-process.ts";

async function within(promise, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), 5000); }),
    ]);
  } finally { clearTimeout(timer); }
}

test("a launcher completes while its detached descendant retains inherited stdio", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "smn-process-test-"));
  const marker = path.join(dir, "descendant.pid");
  const descendant = path.join(dir, "descendant.cjs");
  const launcher = path.join(dir, "launcher.cjs");
  let pid;
  let running;
  try {
    await writeFile(descendant, `
      require("node:fs").writeFileSync(process.argv[2], String(process.pid));
      setInterval(() => {}, 1000);
    `);
    await writeFile(launcher, `
      const child = require("node:child_process").spawn(process.execPath, process.argv.slice(2), {
        detached: true, stdio: "inherit", windowsHide: true, shell: false,
      });
      child.unref();
    `);
    running = runManagedProcess(process.execPath, [launcher, descendant, marker]);
    // Observe rejection immediately, even if startup fails before the PID is written.
    running.catch(() => {});
    pid = await within((async () => {
      const deadline = Date.now() + 4500;
      while (Date.now() < deadline) {
        const value = await readFile(marker, "utf8").catch(() => null);
        if (value) return Number(value);
        await delay(20);
      }
      throw new Error("descendant did not write its PID");
    })(), "descendant did not start");
    await within(running, "launcher completion is blocked by descendant stdio");
    assert.doesNotThrow(() => process.kill(pid, 0), "descendant must still be alive when the helper resolves");
  } finally {
    if (!pid) pid = Number(await readFile(marker, "utf8").catch(() => "0"));
    if (pid) { try { process.kill(pid); } catch { /* Already stopped. */ } }
    if (running) await within(running.catch(() => {}), "launcher did not finish during teardown");
    await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test("nonzero exit rejects without exposing arguments or process output", async () => {
  const secret = "private-db-password";
  await assert.rejects(runManagedProcess(process.execPath, ["-e",
    `console.log(${JSON.stringify(secret)}); console.error(${JSON.stringify(secret)}); process.exit(17);`, secret]),
  { message: "managed-process-failed:" + path.basename(process.execPath) });
});

test("spawn failures expose only the executable basename", async () => {
  const exe = path.join(os.tmpdir(), "private-db-password", "missing-smn-command.exe");
  await assert.rejects(runManagedProcess(exe, ["private-argument"]),
    { message: "managed-process-failed:missing-smn-command.exe" });
});

test("synchronous spawn validation failures are sanitized", async () => {
  await assert.rejects(runManagedProcess(process.execPath, ["private-db-password\0"]),
    { message: "managed-process-failed:" + path.basename(process.execPath) });
});
