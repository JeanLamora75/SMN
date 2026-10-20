import "server-only";
import {Client} from "pg";
import {installedDatabaseUri} from "@/server/auth/database";
import {validRecordId,type DashboardContext} from "./read";
import {readTeamDetail} from "./team-detail";

/** Connexion isolée, transaction SQL en lecture seule ; aucune migration sur la fiche. */
export async function readInstalledTeamDetail(id:string):Promise<DashboardContext|null>{
  if(!validRecordId(id))return null;
  const uri=await installedDatabaseUri();
  const client=new Client({
    connectionString:uri,connectionTimeoutMillis:3500,statement_timeout:5000,
    query_timeout:5000,application_name:"smn-team-readonly",
  });
  let begun=false;
  try{
    await client.connect();
    await client.query("BEGIN READ ONLY");
    begun=true;
    const team=await readTeamDetail(client,id);
    await client.query("COMMIT");
    begun=false;
    return team;
  }catch(error){
    if(begun)await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }finally{
    await client.end().catch(()=>undefined);
  }
}
