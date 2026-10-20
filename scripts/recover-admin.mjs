#!/usr/bin/env node
// SMN-17 — Récupération locale. Ne reçoit aucun secret via argv, URL ou fichier de log.
import { randomUUID, scryptSync, timingSafeEqual, randomBytes, createDecipheriv } from "node:crypto";
import { readFile, lstat } from "node:fs/promises";
import path from "node:path";
import * as readline from "node:readline";
import { Client } from "pg";

function privateRoot() {
  if (process.platform!=="win32" || !process.env.LOCALAPPDATA) throw new Error("SMN doit être lancé depuis le profil Windows de l'installation.");
  return path.join(process.env.LOCALAPPDATA,"ScrumMasterNotebook");
}
function checkUri(uri) {
  const url=new URL(uri);
  if (!["postgresql:","postgres:"].includes(url.protocol) ||
      !["localhost","127.0.0.1"].includes(url.hostname) || url.pathname!=="/smn" ||
      url.search || url.hash || !url.username || !url.password) throw new Error("Connexion SMN locale invalide.");
  return uri;
}
async function privateFile(root,name) {
  // Do not follow a manually injected symlink outside the SMN profile.
  const filename=path.join(root,name);
  let info;
  try { info=await lstat(filename); } catch(e) {if(e?.code==="ENOENT") throw e; throw new Error("Configuration locale SMN inaccessible.");}
  if(!info.isFile() || info.isSymbolicLink() || info.size<1 || info.size>16384)
    throw new Error("Configuration locale SMN invalide.");
  return readFile(filename);
}
async function decrypt(value,root) {
  const [nonce,tag,ciphertext,...rest]=value.split(":");
  if (rest.length || !/^[a-f0-9]{24}$/.test(nonce||"") || !/^[a-f0-9]{32}$/.test(tag||"") ||
      !/^(?:[a-f0-9]{2})+$/.test(ciphertext||"")) throw new Error("Configuration de récupération invalide.");
  const key=await privateFile(root,".settings-key");
  if (key.length!==32) throw new Error("Clé locale SMN invalide.");
  const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(nonce,"hex"));
  decipher.setAuthTag(Buffer.from(tag,"hex"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext,"hex")),decipher.final()]).toString("utf8");
}
async function localUri() {
  if (process.env.SMN_DATABASE_URL) return checkUri(process.env.SMN_DATABASE_URL);
  const root=privateRoot();
  let cfg;
  try {
    cfg=JSON.parse((await privateFile(root,"postgres-connection.json")).toString("utf8"));
    if (cfg.version!==1 || cfg.kind!=="existing" || !/^[A-Za-z_][\w.-]{0,62}$/.test(cfg.user||"") ||
        !Number.isInteger(cfg.port) || cfg.port<1 || cfg.port>65535) throw new Error("Configuration invalide.");
    return checkUri("postgresql://"+encodeURIComponent(cfg.user)+":"+
      encodeURIComponent(await decrypt(cfg.passwordEncrypted,root))+"@127.0.0.1:"+cfg.port+"/smn");
  } catch(e) {
    if (!(e && e.code==="ENOENT")) throw e;
  }
  cfg=JSON.parse((await privateFile(root,"runtime.json")).toString("utf8"));
  if (cfg.version!==1 || cfg.user!=="smn_owner" ||
      cfg.pgBin!==path.join(root,"pgsql","bin") || cfg.cluster!==path.join(root,"data") ||
      !Number.isInteger(cfg.port) || cfg.port<1024 || cfg.port>65535) throw new Error("Cluster SMN non reconnu.");
  return checkUri("postgresql://smn_owner:"+encodeURIComponent(await decrypt(cfg.encryptedPassword,root))+
    "@127.0.0.1:"+cfg.port+"/smn");
}
function masked(label) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode!=="function")
    throw new Error("Un terminal interactif est obligatoire ; aucune saisie par redirection n'est acceptée.");
  return new Promise((resolve,reject)=>{
    let value="";
    process.stdout.write(label+" : ");
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true); process.stdin.resume();
    function finish(err) {
      process.stdin.removeListener("keypress",onKey);
      process.stdin.setRawMode(false); process.stdin.pause();
      process.stdout.write("\n");
      if(err) reject(err); else resolve(value);
    }
    function onKey(str,key) {
      if(key?.ctrl && key.name==="c") return finish(new Error("Opération annulée."));
      if(key?.name==="return" || key?.name==="enter") return finish();
      if(key?.name==="backspace") { value=Array.from(value).slice(0,-1).join(""); return; }
      if(str && !key?.ctrl && !key?.meta && !key?.name?.startsWith("f") &&
        !/[\x00-\x1f\x7f]/.test(str) && value.length<256) value+=str;
    }
    process.stdin.on("keypress",onKey);
  });
}
function verify(value,hash) {
  const parts=hash?.split(":")||[];
  if(parts.length!==4 || parts[0]!=="scrypt" || parts[1]!=="1" ||
    !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{128}$/.test(parts[3])) return false;
  const actual=scryptSync(value,Buffer.from(parts[2],"hex"),64);
  return timingSafeEqual(actual,Buffer.from(parts[3],"hex"));
}
function hash(value) {
  const salt=randomBytes(16);
  return "scrypt:1:"+salt.toString("hex")+":"+scryptSync(value,salt,64).toString("hex");
}
async function recover() {
  if(process.argv.length!==2) throw new Error("Aucun argument n'est accepté, en particulier aucun secret.");
  if(!process.stdin.isTTY) throw new Error("Ouvrez un terminal interactif Windows.");
  console.log("SMN — récupération locale d'un Administrateur EXISTANT.");
  console.log("Une phrase de secours préparée avant la perte du mot de passe est obligatoire.");
  const identity=await masked("Identifiant Administrateur");
  const phrase=await masked("Phrase de secours");
  const password=await masked("Nouveau mot de passe");
  const confirmation=await masked("Confirmation");
  if (!identity || identity.length>200 || phrase.length<20 || phrase.length>256 ||
      password.length<4 || password.length>256 || password!==confirmation || password===phrase)
    throw new Error("Saisie invalide, aucun accès modifié.");
  const client=new Client({connectionString:await localUri(),connectionTimeoutMillis:3500,statement_timeout:5000,
    query_timeout:5000,application_name:"smn-local-recovery"});
  try {
    await client.connect();
    await client.query("BEGIN");
    const a=await client.query(`SELECT a.id,a.password_hash FROM public.smn_account a
      JOIN public.smn_installation i ON i.id=a.installation_id
      WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version IN (3,4)
        AND a.role='admin' AND a.is_active=true
        AND (lower(a.username)=lower($1) OR lower(a.email)=lower($1)) FOR UPDATE OF a`,[identity.trim()]);
    if(a.rowCount!==1) throw new Error("Récupération refusée.");
    const recovery=await client.query(`SELECT phrase_hash FROM public.smn_recovery_phrase
      WHERE account_id=$1 FOR UPDATE`,[a.rows[0].id]);
    if(recovery.rowCount!==1 || !verify(phrase,recovery.rows[0].phrase_hash) ||
      verify(password,a.rows[0].password_hash)) throw new Error("Récupération refusée.");
    const result=await client.query(`UPDATE public.smn_account SET password_hash=$1,must_change_password=true
      WHERE id=$2 AND installation_id='singleton' AND role='admin' AND is_active=true`,
      [hash(password),a.rows[0].id]);
    if(result.rowCount!==1) throw new Error("Récupération refusée.");
    const used=await client.query("DELETE FROM public.smn_recovery_phrase WHERE account_id=$1",[a.rows[0].id]);
    if(used.rowCount!==1) throw new Error("Récupération refusée.");
    await client.query(`INSERT INTO public.smn_auth_audit(id,account_id,action)
      VALUES($1,$2,'recovery_used')`,[randomUUID(),a.rows[0].id]);
    await client.query("COMMIT");
    console.log("Mot de passe renouvelé. Toutes les anciennes sessions sont invalidées.");
    console.log("À la prochaine connexion, un changement de ce mot de passe sera imposé.");
    console.log("La phrase de secours est consommée ; préparez-en une nouvelle après connexion.");
  } catch(e) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw new Error(e instanceof Error && e.message==="Récupération refusée."?e.message:
      "Récupération impossible : vérifiez que PostgreSQL SMN est démarré et que la base est prête.");
  } finally {
    await client.end().catch(()=>undefined);
  }
}
recover().catch(err=>{console.error(err instanceof Error?err.message:"Récupération impossible.");process.exitCode=1;});
