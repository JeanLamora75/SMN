import type {Client} from "pg";
import {readDevelopmentCapacity} from "../../capacity/engine";
import type {AgileRole,RoleCapacityFunction,RoleCapacityResolver,Result} from "./index";

export type RoleCapacityScope={teamId:string;cycleType:"scrum"|"kanban";cycleId:string};
const FUNCTIONS=["ROLE_MAX_JH","ROLE_JH_PLANNED","ROLE_JH"] as const;
const ROLES=["DEVELOPER","SCRUM_MASTER","PRODUCT_OWNER"] as const;
export type RoleCapacityRequest={name:RoleCapacityFunction;role:AgileRole};

/** The existing capacity engine is the sole calculation authority for each role and absence mode. */
export async function loadRoleCapacityResolver(db:Client,scope:RoleCapacityScope,requests:readonly RoleCapacityRequest[]):Promise<RoleCapacityResolver>{
 const values=new Map<string,Result>();
 if(requests.length===0)return (name,role)=>({kind:"unavailable",reason:"missing_source",sourceTag:name+":"+role});
 if(requests.length>9||requests.some(r=>!FUNCTIONS.includes(r.name)||!ROLES.includes(r.role)))
  throw Error("role-capacity-request-invalid");
 const table=scope.cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
 const dates=scope.cycleType==="scrum"?
  "to_char(c.start_at AT TIME ZONE c.time_zone,'YYYY-MM-DD') AS start_on,to_char(c.end_at AT TIME ZONE c.time_zone,'YYYY-MM-DD') AS end_on":
  "c.start_on::text AS start_on,c.end_on::text AS end_on";
 const found=await db.query<{start_on:string;end_on:string}>(
  `SELECT ${dates} FROM public.${table} c JOIN public.smn_team t ON t.id=c.team_id
   WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL AND t.agile_mode=$3 AND NOT t.is_archived LIMIT 2`,
  [scope.cycleId,scope.teamId,scope.cycleType]);
 if(found.rows.length!==1)throw Error("role-capacity-cycle-not-found");
 const {start_on:start,end_on:end}=found.rows[0];
 const distinct=[...new Map(requests.map(r=>[r.name+":"+r.role,r])).values()];
 for(const request of distinct){
  const absenceMode=request.name==="ROLE_MAX_JH"?"none":request.name==="ROLE_JH_PLANNED"?"planned":"all";
  const report=await readDevelopmentCapacity(db,start,end,{
   teamId:scope.teamId,externalTransaction:true,role:request.role,absenceMode
  });
  values.set(request.name+":"+request.role,report.status==="calculated"&&report.totalJh!==null?
   {kind:"available",value:String(report.totalJh)}:
   {kind:"unavailable",reason:"missing_source",detail:report.missing.map(m=>m.source).join(",").slice(0,500)});
 }
 return (name,role)=>values.get(name+":"+role)??{kind:"unavailable",reason:"missing_source",sourceTag:name+":"+role};
}
