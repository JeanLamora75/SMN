import "server-only";
import type {Client} from "pg";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {LinkError,validId} from "./validation";
import type {LinkActor} from "./catalog";

/** Full installation inventory, admin only; no cross-installation rows. */
export async function listAdminLinks(db:Client,actor:LinkActor){
 if(actor.role!=="admin"||!validId(actor.id))throw new LinkError("forbidden");
 await resolveAdminTeam(db,{accountId:actor.id,role:"admin"});
 const result=await db.query(`SELECT l.id,l.title,l.url,l.description,l.scope,
  l.team_id AS "teamId",t.name AS "teamName",
  c.id AS "categoryId",c.name AS "categoryName",l.revision,
  l.updated_at AS "updatedAt"
 FROM public.smn_link l
 JOIN public.smn_account a ON a.installation_id=l.installation_id
 JOIN public.smn_installation i ON i.id=l.installation_id
 JOIN public.smn_link_category c ON c.id=l.category_id AND c.installation_id=l.installation_id
 LEFT JOIN public.smn_team t ON t.id=l.team_id AND t.installation_id=l.installation_id
 WHERE a.id=$1 AND a.role='admin' AND a.is_active=true AND a.must_change_password=false
 AND i.state='initialized' AND i.schema_version IN (29,30,31)
 ORDER BY lower(l.title),l.id`,[actor.id]);
 return result.rows;
}
export async function listAdminTeams(db:Client,actor:LinkActor){
 if(actor.role!=="admin"||!validId(actor.id))throw new LinkError("forbidden");
 await resolveAdminTeam(db,{accountId:actor.id,role:"admin"});
 return (await db.query(`SELECT t.id,t.name FROM public.smn_team t
 JOIN public.smn_account a ON a.installation_id=t.installation_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE a.id=$1 AND a.role='admin' AND a.is_active=true
 AND i.state='initialized' AND i.schema_version IN (29,30,31)
 ORDER BY lower(t.name),t.id`,[actor.id])).rows;
}
