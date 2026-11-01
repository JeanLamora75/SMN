import type {Client} from "pg";
import type {TeamActor} from "../teams/resolve";

/** Explicit, revocable grants. Team preferences and requested IDs confer no permissions. */
export async function indicatorTeams(db:Client, actor:TeamActor):Promise<{id:string;name:string}[]> {
 const r=await db.query<{id:string;name:string}>(`
 SELECT t.id,t.name FROM public.smn_team t
 JOIN public.smn_account a ON a.installation_id=t.installation_id
 JOIN public.smn_installation i ON i.id=a.installation_id
 WHERE a.id=$1 AND a.role=$2 AND a.is_active=true AND a.must_change_password=false
 AND i.state='initialized' AND i.schema_version=33
 AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
 AND (a.role='admin' OR EXISTS (
 SELECT 1 FROM public.smn_indicator_team_grant g
 WHERE g.installation_id=a.installation_id AND g.team_id=t.id
 AND g.account_id=a.id AND g.can_manage=true))
 ORDER BY t.name,t.id`,[actor.accountId,actor.role]);
 return r.rows;
}
export async function requireIndicatorTeam(db:Client,actor:TeamActor,teamId:string):Promise<void>{
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(teamId))throw Error("team-access-forbidden");
 const teams=await indicatorTeams(db,actor);
 if(!teams.some(t=>t.id===teamId))throw Error("team-access-forbidden");
}
export async function updateIndicatorGrant(db:Client,admin:TeamActor,accountId:string,teamId:string,enabled:boolean){
 if(admin.role!=="admin"||typeof enabled!=="boolean")throw Error("team-access-forbidden");
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(accountId))throw Error("invalid-input");
 await requireIndicatorTeam(db,admin,teamId);
 const target=await db.query("SELECT 1 FROM public.smn_account WHERE id=$1 AND role='user' AND is_active=true AND must_change_password=false AND installation_id='singleton'",[accountId]);
 if(target.rows.length!==1)throw Error("team-access-forbidden");
 if(enabled)await db.query(`INSERT INTO public.smn_indicator_team_grant(installation_id,account_id,team_id,can_manage)
 VALUES('singleton',$1,$2,true) ON CONFLICT(installation_id,account_id,team_id)
 DO UPDATE SET can_manage=true`,[accountId,teamId]);
 else await db.query("DELETE FROM public.smn_indicator_team_grant WHERE installation_id='singleton' AND account_id=$1 AND team_id=$2",[accountId,teamId]);
}
