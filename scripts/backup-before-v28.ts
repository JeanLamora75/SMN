/** Sauvegarde explicite de la base SMN avec les binaires PostgreSQL portables.
 * Aucun DDL, aucune écriture en base, aucune information de connexion affichée.
 */
import {spawnSync} from "node:child_process";
import {existsSync,mkdirSync,statSync,rmSync} from "node:fs";
import {join,resolve} from "node:path";
import {installedDatabaseUri} from "../src/server/auth/database";

async function main(){
 for(const path of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL&&existsSync(path))process.loadEnvFile(path);
 }
 const pgBin=join(process.env.LOCALAPPDATA??"","ScrumMasterNotebook","pgsql","bin");
 const pgDump=join(pgBin,"pg_dump.exe"),pgRestore=join(pgBin,"pg_restore.exe");
 if(!existsSync(pgDump)||!existsSync(pgRestore))
  throw Error("Outils PostgreSQL portables absents. Sauvegarde non effectuée.");
 const url=new URL(await installedDatabaseUri());
 if(url.protocol!=="postgresql:"&&url.protocol!=="postgres:")throw Error("URI PostgreSQL invalide");
 if(!["127.0.0.1","localhost"].includes(url.hostname))
  throw Error("Sauvegarde locale uniquement : hôte non autorisé");
 const database=decodeURIComponent(url.pathname.slice(1));
 if(!database)throw Error("Nom de base manquant");
 const outputDir=resolve("backups");
 mkdirSync(outputDir,{recursive:true});
 const timestamp=new Date().toISOString().replace(/[:.]/g,"-");
 const backup=join(outputDir,"smn-before-v28-"+timestamp+".backup");
 if(existsSync(backup))throw Error("Une sauvegarde du même nom existe déjà");
 const env={...process.env,PGPASSWORD:decodeURIComponent(url.password),PGCONNECT_TIMEOUT:"8"};
 const args=["-h",url.hostname,"-p",url.port||"5432","-U",
  decodeURIComponent(url.username),"-d",database,"-Fc","--no-password","-f",backup];
 const result=spawnSync(pgDump,args,{env,encoding:"utf8",timeout:180000});
 if(result.error||result.status!==0){
  rmSync(backup,{force:true});
  throw Error("Échec pg_dump : "+(result.error?.message??result.stderr?.trim()??"cause inconnue"));
 }
 const check=spawnSync(pgRestore,["--list",backup],{env,encoding:"utf8",timeout:30000});
 if(check.error||check.status!==0||!check.stdout.includes("TABLE")){
  throw Error("Sauvegarde créée mais vérification pg_restore non concluante : "+backup);
 }
 const bytes=statSync(backup).size;
 if(bytes<1024)throw Error("Sauvegarde trop petite : "+backup);
 console.log("Sauvegarde créée et archive lisible par pg_restore.");
 console.log("Taille : "+bytes+" octets");
 console.log("Chemin : "+backup);
 console.log("Note : cette vérification ne remplace pas un essai complet de restauration.");
}
main().catch(error=>{
 console.error(error instanceof Error?error.message:"Sauvegarde impossible");
 process.exitCode=1;
});
