import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type DatabaseConfig = { version: 1; kind: "existing"; user: string; port: number; passwordEncrypted: string };

export function appDataDirectory(): string {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) throw new Error("windows-required");
  return path.join(process.env.LOCALAPPDATA, "ScrumMasterNotebook");
}

function isMissing(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && error.code === "ENOENT";
}
async function safePrivateDirectory(): Promise<string> {
  const dir=appDataDirectory();
  // A new folder inherits the per-user access policy of the Windows profile.
  await mkdir(dir,{recursive:true,mode:0o700});
  const details=await lstat(dir);
  if(!details.isDirectory() || details.isSymbolicLink()) throw new Error("private-directory-invalid");
  return dir;
}

/** Reject symlinks, directories and oversized files before inspecting any private file. */
export async function readPrivateFile(name: "postgres-connection.json" | "runtime.json" | ".settings-key"): Promise<Buffer|null> {
  const dir=await safePrivateDirectory();
  const filename=path.join(dir,name);
  let info;
  try { info=await lstat(filename); } catch(e) { if(isMissing(e))return null;throw new Error("private-file-unavailable"); }
  if(!info.isFile() || info.isSymbolicLink() || info.size>16384 || info.size===0)
    throw new Error("private-file-invalid");
  try {return await readFile(filename);}catch {throw new Error("private-file-unavailable");}
}

async function privateKey(createIfAbsent=false): Promise<Buffer> {
  const existing=await readPrivateFile(".settings-key");
  if(existing) {
    if(existing.length!==32) throw new Error("configuration-key-invalid");
    return existing;
  }
  // A ciphertext file with a missing key must NEVER be silently re-keyed.
  // This remains true for password changes in existing and managed installations.
  if(!createIfAbsent || await readPrivateFile("postgres-connection.json") ||
    await readPrivateFile("runtime.json")) throw new Error("configuration-key-missing");
  const dir=await safePrivateDirectory();
  const filename=path.join(dir,".settings-key");
  try {
    await writeFile(filename,randomBytes(32),{flag:"wx",mode:0o600});
  }catch(e) {
    if(!e || typeof e!=="object" || !("code" in e) || e.code!=="EEXIST")
      throw new Error("configuration-key-unavailable");
  }
  // Always re-open and validate the file, including races with another process.
  const created=await readPrivateFile(".settings-key");
  if(!created || created.length!==32) throw new Error("configuration-key-invalid");
  return created;
}

export async function encryptSetting(value: string): Promise<string> {
  if(typeof value!=="string" || !value || value.length>2048) throw new Error("configuration-secret-invalid");
  const key=await privateKey(true);
  const nonce=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",key,nonce);
  const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [nonce.toString("hex"),cipher.getAuthTag().toString("hex"),encrypted.toString("hex")].join(":");
}
export async function decryptSetting(value: string): Promise<string> {
  if(typeof value!=="string" || value.length>5000) throw new Error("configuration-encrypted-invalid");
  const parts=value.split(":");
  if(parts.length!==3 || !/^[a-f0-9]{24}$/.test(parts[0]) ||
    !/^[a-f0-9]{32}$/.test(parts[1]) || !/^(?:[a-f0-9]{2})+$/.test(parts[2]))
    throw new Error("configuration-encrypted-invalid");
  // Do not create a replacement key while decrypting previously stored material.
  const key=await privateKey();
  try {
    const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(parts[0],"hex"));
    decipher.setAuthTag(Buffer.from(parts[1],"hex"));
    return Buffer.concat([decipher.update(Buffer.from(parts[2],"hex")),decipher.final()]).toString("utf8");
  }catch {throw new Error("configuration-decryption-failed");}
}
export function existingUri(user:string,password:string,port=5432):string {
  if(!/^[a-zA-Z_][a-zA-Z0-9_.-]{0,62}$/.test(user) ||
    typeof password!=="string" || password.length===0 || password.length>256 ||
    !Number.isInteger(port) || port<1 || port>65535) throw new Error("postgres-credentials-invalid");
  return "postgresql://"+encodeURIComponent(user)+":"+encodeURIComponent(password)+
    "@127.0.0.1:"+port+"/smn";
}
export async function saveExistingConfig(user:string,password:string,port:number):Promise<void> {
  existingUri(user,password,port);
  const config:DatabaseConfig={version:1,kind:"existing",user,port,
    passwordEncrypted:await encryptSetting(password)};
  const dir=await safePrivateDirectory();
  const filename=path.join(dir,"postgres-connection.json");
  // Atomic replace only after encryption succeeds; no predictable .new secret file.
  const tmp=filename+"."+randomBytes(8).toString("hex")+".tmp";
  try {
    await writeFile(tmp,JSON.stringify(config),{mode:0o600,flag:"wx"});
    await rename(tmp,filename);
  }catch {
    throw new Error("postgres-config-save-failed");
  }finally {await rm(tmp,{force:true}).catch(()=>undefined);}
}
export async function loadExistingUri():Promise<string|null> {
  const buffer=await readPrivateFile("postgres-connection.json");
  if(!buffer)return null;
  let config:DatabaseConfig;
  try {config=JSON.parse(buffer.toString("utf8")) as DatabaseConfig;}
  catch {throw new Error("postgres-config-invalid");}
  if(!config || config.version!==1 || config.kind!=="existing" ||
    typeof config.passwordEncrypted!=="string") throw new Error("postgres-config-invalid");
  try{return existingUri(config.user,await decryptSetting(config.passwordEncrypted),config.port);}
  catch(error){
    if(error instanceof Error && [
      "configuration-key-missing","configuration-key-invalid","configuration-decryption-failed",
      "private-file-invalid","private-file-unavailable"
    ].includes(error.message)) throw error;
    throw new Error("postgres-config-invalid");
  }
}
