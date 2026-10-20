import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

type DatabaseConfig = { version: 1; kind: "existing"; user: string; port: number; passwordEncrypted: string };
export function appDataDirectory(): string {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) throw new Error("windows-required");
  return path.join(process.env.LOCALAPPDATA, "ScrumMasterNotebook");
}
async function privateKey(): Promise<Buffer> {
  const dir = appDataDirectory();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const filename = path.join(dir, ".settings-key");
  try {
    const key = randomBytes(32);
    await writeFile(filename, key, { flag: "wx", mode: 0o600 });
    return key;
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "EEXIST")) throw error;
    const existing = await readFile(filename);
    if (existing.length !== 32) throw new Error("configuration-key-invalid");
    return existing;
  }
}
export async function encryptSetting(value: string): Promise<string> {
  const key = await privateKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [nonce.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}
export async function decryptSetting(value: string): Promise<string> {
  const parts = value.split(":");
  if (parts.length !== 3 || !/^[a-f0-9]{24}$/.test(parts[0]) || !/^[a-f0-9]{32}$/.test(parts[1]) ||
      !/^(?:[a-f0-9]{2})+$/.test(parts[2])) throw new Error("configuration-encrypted-invalid");
  const decipher = createDecipheriv("aes-256-gcm", await privateKey(), Buffer.from(parts[0], "hex"));
  decipher.setAuthTag(Buffer.from(parts[1], "hex"));
  return Buffer.concat([decipher.update(Buffer.from(parts[2], "hex")), decipher.final()]).toString("utf8");
}
export function existingUri(user: string, password: string, port = 5432): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_.-]{0,62}$/.test(user) ||
      typeof password !== "string" || password.length === 0 || password.length > 256 ||
      !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("postgres-credentials-invalid");
  return "postgresql://" + encodeURIComponent(user) + ":" + encodeURIComponent(password) +
    "@127.0.0.1:" + port + "/smn";
}
export async function saveExistingConfig(user: string, password: string, port: number): Promise<void> {
  const uri = existingUri(user, password, port);
  void uri;
  const config: DatabaseConfig = { version: 1, kind: "existing", user, port,
    passwordEncrypted: await encryptSetting(password) };
  const filename = path.join(appDataDirectory(), "postgres-connection.json");
  const temp = filename + ".new";
  await writeFile(temp, JSON.stringify(config), { mode: 0o600, flag: "w" });
  await rename(temp, filename);
}
export async function loadExistingUri(): Promise<string | null> {
  const filename = path.join(appDataDirectory(), "postgres-connection.json");
  let config: DatabaseConfig;
  try { config = JSON.parse(await readFile(filename, "utf8")) as DatabaseConfig; }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw new Error("postgres-config-invalid");
  }
  if (config.version !== 1 || config.kind !== "existing" || typeof config.passwordEncrypted !== "string")
    throw new Error("postgres-config-invalid");
  return existingUri(config.user, await decryptSetting(config.passwordEncrypted), config.port);
}
