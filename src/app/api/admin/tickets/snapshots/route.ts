import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSessionReadDb} from "@/server/auth/database";
import {
  saveTicketSnapshot,listTicketSnapshots,deleteTicketSnapshot,TicketStorageError,
  type TicketScope,type TicketStorageOptions,
} from "@/server/tickets/snapshot-storage";

export const dynamic="force-dynamic";
type Body={teamId?:unknown;cycleId?:unknown;mode?:unknown;businessDate?:unknown;
 filename?:unknown;csv?:unknown;expectedSnapshotId?:unknown};
function validScope(obj:Body):TicketScope|null{
 if(!obj||typeof obj.teamId!=="string"||typeof obj.cycleId!=="string"||
 (obj.mode!=="scrum"&&obj.mode!=="kanban"))return null;
 return {teamId:obj.teamId,cycleId:obj.cycleId,mode:obj.mode};
}
async function scopeExists(scope:TicketScope):Promise<{exists:boolean;closed:boolean}>{
 const table=scope.mode==="scrum"?"smn_sprint":"smn_kanban_period";
 return withSessionReadDb(async db=>{
  const found=await db.query<{status:string}>(`SELECT c.status FROM public.${table} c
   JOIN public.smn_team t ON t.id=c.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized'
   AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))=$3
   AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
   LIMIT 1`,[scope.cycleId,scope.teamId,scope.mode]);
  return {exists:found.rows.length===1,closed:scope.mode==="scrum"&&found.rows[0]?.status==="closed"};
 });
}
function options():TicketStorageOptions{
 return {
  async authorize(scope,action){
   const context=await scopeExists(scope);
   if(!context.exists)throw new TicketStorageError("cycle-not-found");
   if(action==="delete"&&context.closed)throw new TicketStorageError("closed-sprint");
  },
 };
}
function responseError(error:unknown):Response{
 if(error instanceof TicketStorageError){
  const status=error.code==="confirmation-required"||error.code==="stale-confirmation"||error.code==="snapshot-busy"?409:
   error.code==="closed-sprint"?409:error.code==="cycle-not-found"?404:
   error.code==="invalid-csv"||error.code.startsWith("invalid-")?422:500;
  return Response.json({error:error.code},{status,headers:{"Cache-Control":"no-store"}});
 }
 return Response.json({error:"tickets-unavailable"},{status:500,headers:{"Cache-Control":"no-store"}});
}
async function jsonBody(req:NextRequest):Promise<Body|null>{
 try{const value:unknown=await req.json();return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Body:null;}
 catch{return null;}
}
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return Response.json({error:"forbidden"},{status:403});
 const scope=validScope({
  teamId:req.nextUrl.searchParams.get("teamId"),
  cycleId:req.nextUrl.searchParams.get("cycleId"),
  mode:req.nextUrl.searchParams.get("mode"),
 });
 if(!scope)return Response.json({error:"invalid-input"},{status:400});
 try{
  const context=await scopeExists(scope);
  if(!context.exists)return Response.json({error:"cycle-not-found"},{status:404});
  return Response.json({snapshots:await listTicketSnapshots(scope,options()),closed:context.closed},{headers:{"Cache-Control":"no-store"}});
 }
 catch(e){return responseError(e);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 const body=await jsonBody(req),scope=body?validScope(body):null;
 if(!scope||!body||typeof body.businessDate!=="string"||typeof body.filename!=="string"||
 typeof body.csv!=="string"||!(body.expectedSnapshotId===undefined||body.expectedSnapshotId===null||typeof body.expectedSnapshotId==="string"))
  return Response.json({error:"invalid-input"},{status:400});
 try{
  const snapshot=await saveTicketSnapshot(scope,{
   businessDate:body.businessDate,filename:body.filename,csv:body.csv,
   actorId:actor.id,expectedSnapshotId:body.expectedSnapshotId as string|null|undefined,
  },options());
  return Response.json({snapshot},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return responseError(e);}
}
export async function DELETE(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 const body=await jsonBody(req),scope=body?validScope(body):null;
 if(!scope||!body||typeof body.businessDate!=="string"||typeof body.expectedSnapshotId!=="string")
  return Response.json({error:"invalid-input"},{status:400});
 try{
  const removed=await deleteTicketSnapshot(scope,body.businessDate,body.expectedSnapshotId,options());
  return Response.json({removed},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return responseError(e);}
}
