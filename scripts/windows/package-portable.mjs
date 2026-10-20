// Paquet Windows autonome pour un pilote. N'installe aucun service Windows.
// À exécuter uniquement après pnpm build (Next standalone) sous GitHub Actions.
import { cp, copyFile, mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { acquirePgArchive, PG_ARCHIVE } from "./postgres-archive.mjs";

if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("Le packaging Windows est réservé au runner GitHub Actions");
}
const target = path.resolve(process.env.SMN_PACKAGE_DIR || path.join(process.cwd(), "_package", "SMN-Windows"));
if (!existsSync(".next/standalone/server.js")) throw new Error("Next standalone manquant. Vérifier next.config et pnpm build.");
await mkdir(target, { recursive: true });
// pnpm/Next produisent des liens symboliques vers .next/standalone ; un paquet
// autonome doit copier leurs cibles, sinon Node cherchera les fichiers source.
await cp(".next/standalone", target, { recursive: true, force: true, dereference: true });
await mkdir(path.join(target, ".next", "static"), { recursive: true });
await cp(".next/static", path.join(target, ".next", "static"), { recursive: true, force: true });
if (existsSync("public")) await cp("public", path.join(target, "public"), { recursive: true, force: true });
await copyFile(process.execPath, path.join(target, "node.exe"));
await copyFile("scripts/windows/launch-portable.mjs", path.join(target, "launch-portable.mjs"));
const launch = `@echo off\r\ncd /d "%~dp0"\r\n"%~dp0node.exe" "%~dp0launch-portable.mjs"\r\nif errorlevel 1 pause\r\n`;
await writeFile(path.join(target, "Demarrer SMN.cmd"), launch, "utf8");
const pgFolder = path.join(target, "runtime", "postgres");
await mkdir(pgFolder, { recursive: true });
const zip = await acquirePgArchive(path.join(pgFolder, PG_ARCHIVE));
const size = (await stat(zip)).size;
console.log("SMN portable préparé pour Windows x64, archive PostgreSQL SHA-256 validée (" + size + " octets).");
console.log("Paquet : " + target);
