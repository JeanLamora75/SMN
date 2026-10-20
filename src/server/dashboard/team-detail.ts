import {Client} from "pg";
import {installedDatabaseUri} from "@/server/auth/database";
import {validRecordId, type DashboardContext} from "./read";

/** Fiche collective courante uniquement : ni données personnelles ni vue historique inventée. */
export async function readTeamDetail(client: Client, id: string): Promise<DashboardContext|null> {
  if (!validRecordId(id)) return null;
  const response=await client.query<{
    product_id:string; product:string; team_id:string; team:string; mode:string;
  }>(`SELECT p.id AS product_id,p.name AS product,t.id AS team_id,t.name AS team,i.mode
       FROM public.smn_installation i
       JOIN public.smn_product p ON p.installation_id=i.id
       JOIN public.smn_team t ON t.installation_id=i.id AND t.product_id=p.id
       WHERE i.id='singleton' AND i.state='initialized'
         AND t.installation_id='singleton' AND t.id=$1
       LIMIT 2`,[id]);
  if (response.rows.length!==1) return null;
  const row=response.rows[0];
  if (!validRecordId(row.product_id) || row.team_id!==id ||
      (row.mode!=="scrum" && row.mode!=="kanban") ||
      typeof row.product!=="string" || typeof row.team!=="string") return null;
  return {productId:row.product_id,product:row.product,teamId:id,team:row.team,mode:row.mode};
}

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
