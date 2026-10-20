import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, lstat, readdir, rm, symlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { archiveIncompleteCluster } from "../src/server/bootstrap/recovery";

async function withRoot(task: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), "smn-archive-"));
  try { await task(root); } finally { await rm(root, { recursive: true, force: true }); }
}
describe("SMN-12 — récupération non destructive de cluster interrompu", () => {
  it("archive l'ancien dossier avec son contenu sans l'effacer", async () => withRoot(async root => {
    const data = path.join(root, "data");
    await mkdir(data);
    await writeFile(path.join(data, "PG_VERSION"), "18");
    await writeFile(path.join(data, "unfinished.txt"), "données intactes");
    const result = await archiveIncompleteCluster(root);
    const backup = path.join(root, "recovery", result.archivedAt);
    assert.equal(await readFile(path.join(backup, "unfinished.txt"), "utf8"), "données intactes");
    assert.equal(await readFile(path.join(backup, "PG_VERSION"), "utf8"), "18");
    await assert.rejects(lstat(data), { code: "ENOENT" });
    assert.equal((await readdir(path.join(root, "recovery"))).length, 1);
  }));
  it("refuse de déplacer un cluster potentiellement actif", async () => withRoot(async root => {
    const data = path.join(root, "data");
    await mkdir(data);
    await writeFile(path.join(data, "postmaster.pid"), "54321");
    await assert.rejects(() => archiveIncompleteCluster(root), /managed-cluster-running-or-unclean/);
    assert.equal((await lstat(data)).isDirectory(), true);
  }));
  it("ne suit jamais un lien symbolique hors du répertoire SMN", {
    skip: process.platform === "win32",
  }, async () => withRoot(async root => {
    const other = path.join(root, "foreign");
    await mkdir(other);
    await writeFile(path.join(other, "leave-me.txt"), "safe");
    await symlink(other, path.join(root, "data"), "dir");
    await assert.rejects(() => archiveIncompleteCluster(root), /managed-cluster-unsafe/);
    assert.equal(await readFile(path.join(other, "leave-me.txt"), "utf8"), "safe");
  }));
});
