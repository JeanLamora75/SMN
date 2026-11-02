import type { Client } from "pg";
import type { LayoutScope } from "./layout";

export type DashboardAction = "read" | "edit";
export type DashboardPermission = Readonly<{ canRead:boolean;canEdit:boolean }>;
const validId=(s:unknown):s is string=>typeof s==="string"&&/^[a-zA-Z0-9_-]{1,100}$/.test(s);

/** Always evaluate the installation, account, target team and grants in PostgreSQL.
 * Administrator rights cover their own installation; normal users need explicit grants.
 * A revocation never mutates the personal layout.
 */
export async function dashboardPermission(db:Client,scope:LayoutScope):Promise<DashboardPermission>{
 if(![scope.installationId,scope.accountId,scope.teamId].every(validId))
  throw new Error("dashboard-scope-forbidden");
 const result=await db.query<{role:string;can_read:boolean;can_edit:boolean}>(`
 SELECT a.role,COALESCE(g.can_read,false) AS can_read,
 COALESCE(g.can_edit,false) AS can_edit
 FROM public.smn_account a
 JOIN public.smn_installation i ON i.id=a.installation_id AND i.state='initialized'
 JOIN public.smn_team t ON t.installation_id=i.id AND t.id=$3
 LEFT JOIN public.smn_dashboard_team_grant g ON g.installation_id=i.id
   AND g.account_id=a.id AND g.team_id=t.id
 WHERE i.id=$1 AND a.id=$2 AND a.is_active=true
 AND a.must_change_password=false
 AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
 LIMIT 1`,[scope.installationId,scope.accountId,scope.teamId]);
 if(result.rows.length!==1)return {canRead:false,canEdit:false};
 const row=result.rows[0];
 if(row.role==="admin")return {canRead:true,canEdit:true};
 if(row.role!=="user")return {canRead:false,canEdit:false};
 return {canRead:row.can_read,canEdit:row.can_read&&row.can_edit};
}
export async function requireDashboardPermission(db:Client,scope:LayoutScope,action:DashboardAction):Promise<DashboardPermission>{
 const rights=await dashboardPermission(db,scope);
 if(action==="read"?!rights.canRead:!rights.canEdit)throw new Error("dashboard-scope-forbidden");
 return rights;
}
