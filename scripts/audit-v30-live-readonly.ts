import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {Client} from "pg";
import {parseConnectionSettings} from "../src/server/db/config";
import {loadExistingUri} from "../src/server/bootstrap/settings";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {resolveAdminTeam} from "../src/server/teams/resolve";
import {readTeamRegistryItem} from "../src/server/registries/team-item-read";

async function main(){
 for(const file of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL&&existsSync(file))process.loadEnvFile(file);
 }
 const parsed=parseConnectionSettings(process.env.SMN_DATABASE_URL);
 if(!parsed.ok&&parsed.status!=="configuration-missing")
  throw Error("Configuration PostgreSQL invalide");
 const uri=parsed.ok?parsed.uri:(await loadExistingUri()??await existingManagedUri());
 if(!uri)throw Error("PostgreSQL introuvable");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:5000,application_name:"smn-v30-isolation-readonly"});
 await db.connect();
 try{
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const state=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  assert.equal(state.rows[0]?.schema_version,30,"schéma v30 exigé");
  const accounts=await db.query<{id:string}>(
   "SELECT a.id FROM public.smn_account a WHERE a.installation_id='singleton' "+ 
   "AND a.role='admin' AND a.is_active=true AND a.must_change_password=false ORDER BY id LIMIT 1");
  const actorId=accounts.rows[0]?.id;
  assert.ok(actorId,"compte admin actif nécessaire");
  const actor={accountId:actorId,role:"admin" as const};
  const teams=await db.query<{id:string}>(
   "SELECT t.id FROM public.smn_team t WHERE t.installation_id='singleton' "+
   "AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false ORDER BY t.id LIMIT 3");
  assert.ok(teams.rows.length>=1,"aucune équipe active");
  for(const team of teams.rows){
   const context=await resolveAdminTeam(db,actor,team.id);
   assert.equal(context.team_id,team.id);
  }
  console.log("PASS: schéma v30 et contexte administrateur ; équipes actives :",teams.rows.length);
  await assert.rejects(resolveAdminTeam(db,{accountId:actorId,role:"user"},teams.rows[0].id),
   /team-access-forbidden/);
  console.log("PASS: refus de choix d'équipe pour rôle user");
  if(teams.rows.length<2){
   throw Error("RECETTE INCOMPLETE : deux équipes actives sont nécessaires");
  }else{
   const [a,b]=teams.rows;
   const records=await db.query<{id:string;team_id:string}>(
    "SELECT r.id,r.team_id FROM public.smn_registry_item r "+
    "WHERE r.team_id IN ($1,$2) ORDER BY r.id LIMIT 20",[a.id,b.id]);
   let checks=0;
   for(const item of records.rows){
    const owner=item.team_id===a.id?a.id:b.id;
    const other=item.team_id===a.id?b.id:a.id;
    const own=await readTeamRegistryItem(db,actor,owner,item.id);
    assert.equal(own?.id,item.id,"la fiche doit être accessible dans son équipe");
    const crossing=await readTeamRegistryItem(db,actor,other,item.id);
    assert.equal(crossing,null,"fuite interéquipes sur une fiche");
    checks++;
   }
   if(!checks)throw Error("RECETTE INCOMPLETE : aucune fiche disponible pour tester une lecture croisée");
   else console.log("PASS: lectures croisées refusées ; fiches vérifiées :",checks);
  }
  await db.query("ROLLBACK");
  console.log("Fin : transaction en lecture seule annulée, aucune donnée modifiée");
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }finally{await db.end().catch(()=>undefined);}
}
main().catch(error=>{
 console.error("ECHEC recette v30 :",error instanceof Error?error.message:String(error));
 process.exitCode=1;
});
