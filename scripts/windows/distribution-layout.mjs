// Distribution contract: updates may replace application files only.
// Persistent roots are never valid targets for a future updater.
import path from "node:path";

const PERSISTENT = ["data", "runtime", "updates"];
const PRIVATE_NAMES = new Set([".env", ".env.local", ".settings-key", "runtime.json", "postgres-connection.json"]);

function segments(relative) {
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative) ||
      relative.includes("\\") || relative.includes(":") || /[\x00-\x1f\x7f]/.test(relative) ||
      relative.split("/").includes("..") || relative.startsWith("/"))
    throw new Error("distribution-path-invalid");
  const parts=relative.split("/");
  if (parts.some(part => !part || part === "." || /[. ]$/.test(part) ||
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)))
    throw new Error("distribution-path-invalid");
  return parts;
}

export function classifyDistributionPath(relative) {
  const parts=segments(relative);
  if (parts.some(part=>PRIVATE_NAMES.has(part.toLowerCase())))
    return "private";
  if (PERSISTENT.includes(parts[0].toLowerCase()))
    return "persistent";
  return "application";
}

export function assertApplicationPayload(paths) {
  for (const candidate of paths) {
    if (classifyDistributionPath(candidate)!=="application")
      throw new Error("distribution-protected-path");
  }
}
