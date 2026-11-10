// Paquet Windows autonome pour un pilote. N'installe aucun service Windows.
// À exécuter uniquement après pnpm build (Next standalone) sous GitHub Actions.
import { cp, copyFile, mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { acquirePgArchive, PG_ARCHIVE } from "./postgres-archive.mjs";

if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("Le packaging Windows est réservé au runner GitHub Actions");
}
const target = path.resolve(process.env.SMN_PACKAGE_DIR || path.join(process.cwd(), "_package", "SMN-Windows"));
if (!existsSync(".next/standalone/server.js")) throw new Error("Next standalone manquant. Vérifier next.config et pnpm build.");
await mkdir(target, { recursive: true });
// A stable installed version is required for explicit offline patch preconditions.
// GitHub RUN_NUMBER is per-workflow. RUN_ID is globally monotonic across
// the setup and update workflows, preventing accidental signed downgrades.
const runId=process.env.GITHUB_RUN_ID;
const buildSha=process.env.GITHUB_SHA;
if(!/^\d+$/.test(runId??"") || !Number.isSafeInteger(Number(runId)) ||
   !/^[0-9a-f]{40}$/.test(buildSha??""))
  throw new Error("Identifiant de run GitHub ou commit absent");
const buildVersion="33.0."+runId;
await writeFile(path.join(target,"distribution-version.json"),
  JSON.stringify({product:"SMN",version:buildVersion,sourceCommit:buildSha})+"\n","utf8");
// Trust anchor is only supplied from the CI signing secret, never by the ZIP.
// Existing installations without this anchor cannot verify signed updates.
const signingSecret=process.env.SMN_UPDATE_SIGNING_KEY_PEM_B64;
if(signingSecret){
  const privateKey=createPrivateKey(Buffer.from(signingSecret,"base64").toString("utf8"));
  if(privateKey.asymmetricKeyType!=="ed25519")throw Error("update-signing-key-invalid");
  const pub=createPublicKey(privateKey).export({format:"pem",type:"spki"});
  await mkdir(path.join(target,"runtime","trust"),{recursive:true});
  await writeFile(path.join(target,"runtime","trust","update-signing-public.pem"),pub,
    {encoding:"utf8",flag:"wx"});
}
const appDir = path.join(target, "app");
await mkdir(appDir, { recursive: true });
// pnpm/Next produisent des liens symboliques vers .next/standalone ; un paquet
// autonome doit copier leurs cibles, sinon Node cherchera les fichiers source.
await cp(".next/standalone", appDir, { recursive: true, force: true, dereference: true });
// The installed application may be replaced independently of its persistent data.
// Next standalone changes cwd to the bundle directory; preserve SMN root as cwd
// because existing database, Office and schema paths are anchored there.
const serverEntry = path.join(appDir, "server.js");
const serverSource = await readFile(serverEntry, "utf8");
if (!serverSource.includes("process.chdir(__dirname)")) {
  throw new Error("Next standalone bootstrap changed: refusing an unverified distribution layout");
}
await writeFile(serverEntry, serverSource.replace("process.chdir(__dirname)",
  "process.chdir(path.resolve(__dirname, '..'))"), "utf8");
 // Next standalone can omit optional native platform packages selected by the
 // resvg loader. The portable runtime must include both packages explicitly.
 const nodeRequire=createRequire(import.meta.url);
 const resvgEntry=nodeRequire.resolve("@resvg/resvg-js");
 for(const name of ["resvg-js","resvg-js-win32-x64-msvc"]){
   const entry=name==="resvg-js"?resvgEntry:
     nodeRequire.resolve("@resvg/resvg-js-win32-x64-msvc",{paths:[path.dirname(resvgEntry)]});
   const source=path.dirname(entry);
   const destination=path.join(appDir,"node_modules","@resvg",name);
   await mkdir(path.dirname(destination),{recursive:true});
   await cp(source,destination,{recursive:true,force:true,dereference:true});
 }

await mkdir(path.join(appDir, ".next", "static"), { recursive: true });
await cp(".next/static", path.join(appDir, ".next", "static"), { recursive: true, force: true });
if (existsSync("public")) await cp("public", path.join(appDir, "public"), { recursive: true, force: true });
// Runtime schema snapshots are resolved relative to process.cwd() by the installer.
// Explicitly include them: Next standalone tracing does not guarantee dynamic SQL paths.
for(const file of [
 "prisma/baseline/v33/schema.sql",
 "prisma/baseline/v32/schema.sql",
 "_bmad-output/planning-artifacts/SMN-338-DDL-ADDITIF-DRAFT.sql",
 "prisma/migrations/20261101_smn_dashboard_slots_additive/migration.sql",
 "prisma/migrations/20261108_smn416_chart_styles/migration.sql",
 "prisma/migrations/20261109_smn39_privacy_receipt/migration.sql",
 "prisma/migrations/20261109_smn40_member_delete_guard/migration.sql",
]){
 const destination=path.join(target,file);
 await mkdir(path.dirname(destination),{recursive:true});
 await copyFile(file,destination);
}

await mkdir(path.join(target, "runtime", "node"), { recursive: true });
await copyFile(process.execPath, path.join(target, "runtime", "node", "node.exe"));
await copyFile("scripts/windows/launch-portable.mjs", path.join(target, "launch-portable.mjs"));
await mkdir(path.join(target,"scripts"),{recursive:true});
await copyFile("scripts/office-dirs.mjs",path.join(target,"scripts","office-dirs.mjs"));
await mkdir(path.join(target,"scripts","windows"),{recursive:true});
for(const file of [
 "distribution-layout.mjs",
 "update-contract.mjs",
 "unpack-update.mjs",
 "import-update.mjs",
 "verify-staged-update.mjs",
 "update-apply.mjs",
 "update-transaction.mjs",
 "schema-update-policy.mjs",
 "verify-delivery.mjs"
])await copyFile(path.join("scripts","windows",file),
  path.join(target,"scripts","windows",file));
for(const name of ["templates","reports"])await mkdir(path.join(target,"data","office",name),{recursive:true});
await mkdir(path.join(target,"updates"), { recursive: true });
await copyFile("scripts/recover-admin.mjs", path.join(appDir, "recover-admin.mjs"));
const recoverLaunch = `@echo off\r\ncd /d "%~dp0"\r\n"%~dp0runtime\\node\\node.exe" "%~dp0app\\recover-admin.mjs"\r\nif errorlevel 1 pause\r\n`;
await writeFile(path.join(target, "Recuperer admin SMN.cmd"), recoverLaunch, "utf8");
const launch = `@echo off\r\ncd /d "%~dp0"\r\n"%~dp0runtime\\node\\node.exe" "%~dp0launch-portable.mjs"\r\nif errorlevel 1 pause\r\n`;
await writeFile(path.join(target, "Demarrer SMN.cmd"), launch, "utf8");
const pgFolder = path.join(target, "runtime", "postgres");
await mkdir(pgFolder, { recursive: true });
// CI update builds never redistribute the PostgreSQL archive. The full setup
// workflow still downloads and validates the complete binary distribution.
if (process.env.SMN_UPDATE_SKIP_PG_ARCHIVE !== "1") {
  const zip = await acquirePgArchive(path.join(pgFolder, PG_ARCHIVE));
  const size = (await stat(zip)).size;
  console.log("SMN portable préparé pour Windows x64, archive PostgreSQL SHA-256 validée (" + size + " octets).");
} else {
  console.log("Application SMN préparée pour mise à jour sans distribution PostgreSQL.");
}
console.log("Paquet : " + target);
