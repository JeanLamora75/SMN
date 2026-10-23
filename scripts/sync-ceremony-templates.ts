// Mise à niveau explicite et répétable des modèles Scrum sur un poste pilote.
// Respecte la configuration SMN_DATABASE_URL ou PostgreSQL portable chiffré.
// Ne modifie aucun Sprint/aucune occurrence existante et n'affiche aucun secret.
import {existsSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {DEFAULT_SCRUM_CEREMONY_TEMPLATES,seedDefaultScrumCeremonyTemplates} from "../src/server/sprints/ceremony-templates";

async function main(){
 // Next lit .env.local/.env au démarrage ; ce script doit respecter ces fichiers
 // sans afficher le mot de passe et sans écraser une variable déjà fournie.
 for(const filename of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL && existsSync(filename))process.loadEnvFile(filename);
 }
 const db=new Client({connectionString:await installedDatabaseUri(),
  connectionTimeoutMillis:3500,statement_timeout:15000,application_name:"smn-ceremony-bootstrap"});
 await db.connect();
 let started=false;
 try{
  await db.query("BEGIN");started=true;
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
  if(teams.rows.length!==1)throw Error("scrum-installation-required");
  const added=await seedDefaultScrumCeremonyTemplates(db,teams.rows[0].id);
  const found=await db.query<{name:string;active:boolean}>(`
    SELECT name,active FROM public.smn_scrum_ceremony_template
    WHERE team_id=$1 ORDER BY name`,[teams.rows[0].id]);
  const present=DEFAULT_SCRUM_CEREMONY_TEMPLATES.every(t=>
    found.rows.some(row=>row.name.trim().toLowerCase()===t.name.toLowerCase()));
  if(!present)throw Error("ceremony-templates-incomplete");
  await db.query("COMMIT");started=false;
  console.log(`Modèles Scrum : ${added} ajouté(s), ${found.rows.length} modèle(s) disponibles. Aucune occurrence de Sprint modifiée.`);
 }catch(e){
  if(started)await db.query("ROLLBACK").catch(()=>undefined);
  throw e;
 }finally{await db.end().catch(()=>undefined);}
}
main().catch(error=>{
 console.error("Échec de synchronisation des modèles Scrum :",error instanceof Error?error.message:"erreur");
 process.exitCode=1;
});
