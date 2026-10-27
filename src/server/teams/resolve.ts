import type {Client} from "pg";
const validRecordId=(id:unknown):id is string=>
 typeof id==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id);

/** Un teamId d'URL ou une préférence n'est jamais un droit.
 * Jusqu'à la V1, seuls les comptes Admin peuvent résoudre le contexte v28.
 * Les comptes user existants restent un arbitrage explicitement reporté.
 */
export type TeamActor=Readonly<{accountId:string;role:"admin"|"user"}>;
export type TeamContextRow=Readonly<{
 product_id:string|null;product:string|null;team_id:string;team:string;
 mode:string;
}>;

export async function resolveAdminTeam(db:Client,actor:TeamActor,
 requestedTeamId?:string|null):Promise<TeamContextRow>{
 if(!validRecordId(actor.accountId)||actor.role!=="admin")
  throw new Error("team-access-forbidden");
 if(requestedTeamId!=null&&!validRecordId(requestedTeamId))
  throw new Error("team-id-invalid");
 const details=await db.query<{
  installation_id:string;schema_version:number;
 }>(`SELECT a.installation_id,i.schema_version
 FROM public.smn_account a
 JOIN public.smn_installation i ON i.id=a.installation_id
 WHERE a.id=$1 AND a.role='admin' AND a.is_active=true
   AND a.must_change_password=false AND i.state='initialized'`,
 [actor.accountId]);
 if(details.rows.length!==1||![28,29].includes(details.rows[0].schema_version))
  throw new Error("team-context-not-ready");
 const installation=details.rows[0].installation_id;
 // Ne jamais conserver une préférence devenue invalide.
 const chosen=await db.query<{team_id:string}>(`
  SELECT t.id AS team_id FROM public.smn_account_team_preference p
  JOIN public.smn_team t ON t.id=p.team_id
   AND t.installation_id=p.installation_id
  WHERE p.account_id=$1 AND p.installation_id=$2
   AND ($3::integer<29 OR t.is_archived=false)`,
  [actor.accountId,installation,details.rows[0].schema_version]);
 const id=requestedTeamId??chosen.rows[0]?.team_id;
 if(!id||!validRecordId(id))throw new Error("team-context-unavailable");
 const row=await db.query<TeamContextRow>(`
  SELECT p.id AS product_id,p.name AS product,t.id AS team_id,
    t.name AS team,${modeColumn} AS mode
  FROM public.smn_team t
  JOIN public.smn_installation i ON i.id=t.installation_id
  LEFT JOIN public.smn_product p ON p.id=t.product_id
   AND p.installation_id=t.installation_id
  WHERE t.id=$1 AND t.installation_id=$2
   AND i.state='initialized' AND i.schema_version=$3 ${activeClause}
  LIMIT 2`,[id,installation,details.rows[0].schema_version]);
 if(row.rows.length!==1||!["scrum","kanban"].includes(row.rows[0].mode))
  throw new Error("team-context-unavailable");
 return row.rows[0];
}
