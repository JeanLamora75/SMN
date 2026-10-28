import type {Client} from "pg";

const validId=(v:unknown):v is string=>
 typeof v==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/u.test(v);

export type TeamChoice=Readonly<{id:string;name:string}>;
export type ActiveTeamState=Readonly<{
 ready:boolean;teamId:string|null;items:readonly TeamChoice[];
}>;
export type TeamPreferenceResult=Readonly<
 {ok:true;teamId:string}|{ok:false;error:"forbidden"|"not-ready"|"invalid-input"|"not-found"}>;

/**
 * Un choix d'équipe n'est pas une habilitation. Le rôle Admin est revalidé
 * en SQL et la préférence n'est jamais consultée pour les comptes user
 * tant que leurs autorisations sont reportées.
 */
async function adminInstallation(db:Client,accountId:string):Promise<{
 id:string;schemaVersion:number}|null>{
 if(!validId(accountId))return null;
 const result=await db.query<{installation_id:string;schema_version:number}>(`
   SELECT a.installation_id,i.schema_version
   FROM public.smn_account a
   JOIN public.smn_installation i ON i.id=a.installation_id
   WHERE a.id=$1 AND a.role='admin' AND a.is_active=true
     AND a.must_change_password=false AND i.state='initialized'`,[accountId]);
 if(result.rows.length!==1)return null;
 return {id:result.rows[0].installation_id,
  schemaVersion:result.rows[0].schema_version};
}

export async function readAdminActiveTeam(db:Client,accountId:string):
 Promise<ActiveTeamState|null>{
 const installation=await adminInstallation(db,accountId);
 if(!installation)return null;
 if(![28,29,30,31].includes(installation.schemaVersion))
  return {ready:false,teamId:null,items:[]};
 const options=await db.query<TeamChoice>(
  "SELECT id,name FROM public.smn_team WHERE installation_id=$1 "+
  "AND COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false "+
  "ORDER BY lower(name),id",[installation.id]);
 const preference=await db.query<{team_id:string}>(`
   SELECT p.team_id FROM public.smn_account_team_preference p
   JOIN public.smn_team t ON t.id=p.team_id
     AND t.installation_id=p.installation_id
   WHERE p.account_id=$1 AND p.installation_id=$2
     AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false`,
  [accountId,installation.id]);
 const selected=preference.rows[0]?.team_id;
 return {
  ready:true,
  teamId:options.rows.some(row=>row.id===selected)?selected:
   options.rows.length===1?options.rows[0].id:null,
  items:options.rows.map(row=>({id:row.id,name:row.name}))
 };
}

/** Préférence personnelle seulement. Le navigateur ne transmet jamais
 * d'installationId ; le serveur le retrouve depuis l'acteur authentifié.
 */
export async function saveAdminActiveTeam(db:Client,accountId:string,
 teamId:unknown):Promise<TeamPreferenceResult>{
 if(!validId(teamId))return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const installation=await adminInstallation(db,accountId);
  if(!installation){await db.query("ROLLBACK");return {ok:false,error:"forbidden"};}
  if(![28,29,30,31].includes(installation.schemaVersion)){
   await db.query("ROLLBACK");return {ok:false,error:"not-ready"};
  }
  const team=await db.query<{id:string}>(
   "SELECT id FROM public.smn_team WHERE id=$1 AND installation_id=$2 "+
   "AND COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false",
   [teamId,installation.id]);
  if(team.rows.length!==1){
   await db.query("ROLLBACK");return {ok:false,error:"not-found"};
  }
  await db.query(`INSERT INTO public.smn_account_team_preference
   (account_id,installation_id,team_id)
   VALUES($1,$2,$3)
   ON CONFLICT(account_id) DO UPDATE
    SET team_id=excluded.team_id,
        installation_id=excluded.installation_id,updated_at=now()`,
   [accountId,installation.id,teamId]);
  await db.query("COMMIT");
  return {ok:true,teamId};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
