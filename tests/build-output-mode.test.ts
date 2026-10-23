import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nextConfig, { standaloneOutputFor } from "../next.config";

describe("Production build output on restricted Windows hosts", () => {
  it("avoids symlinks for a regular pnpm build on Windows", () => {
    assert.equal(standaloneOutputFor("win32", false), undefined);
  });

  it("preserves standalone output when the Windows package opts in", () => {
    assert.equal(standaloneOutputFor("win32", true), "standalone");
  });

  it("preserves existing standalone output on other platforms", () => {
    assert.equal(standaloneOutputFor("linux", false), "standalone");
    assert.equal(standaloneOutputFor("darwin", false), "standalone");
  });

  it("wires the actual Next configuration to the packaging flag", () => {
    assert.equal(
      nextConfig.output,
      standaloneOutputFor(process.platform, process.env.SMN_BUILD_STANDALONE === "1"),
    );
  });
});
