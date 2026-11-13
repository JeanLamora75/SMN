import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSessionReadDb} from "@/server/auth/database";
import {readTicketSnapshot,TicketStorageError,type TicketScope} from "@/server/tickets/snapshot-storage";
import {browseTicketCsv,type TicketBrowseSort,type TicketBrowseDirection} from "@/lib/ticket-csv-browse";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const idPattern=/^[a-zA-Z0-9_-]{1,100}$/;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sorts:readonly TicketBrowseSort[]=["jiraId","issueType","title","priority","status","storyPoints"];
const directions:readonly TicketBrowseDirection[]=["asc","desc"];

function reject(code:string,status:number):Response{
 return Response.json({error:code},{status,headers:{"Cache-Control":"no-store"}});
}

/** All scopes are checked against the authenticated account and current cycle. */
export async function GET(request:NextRequest):Promise<Response>{
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return reject("forbidden",403);
 const params=request.nextUrl.searchParams;
 const allowed=["teamId","cycleId","mode","businessDate","snapshotId","search","issueType",
  "status","priority","prefix","sort","direction","page","pageSize"];
 if([...params.keys()].some(key=>!allowed.includes(key)||params.getAll(key).length!==1))
  return reject("invalid-input",400);
 const teamId=params.get("teamId")??"",cycleId=params.get("cycleId")??"";
 const mode=params.get("mode"),businessDate=params.get("businessDate")??"";
 const snapshotId=params.get("snapshotId")??"";
 if(!idPattern.test(teamId)||!idPattern.test(cycleId)||
  (mode!=="scrum"&&mode!=="kanban")||!datePattern.test(businessDate)||
  !uuid.test(snapshotId))return reject("invalid-input",400);
 const sort=(params.get("sort")??"jiraId") as TicketBrowseSort;
 const direction=(params.get("direction")??"asc") as TicketBrowseDirection;
 if(!sorts.includes(sort)||!directions.includes(direction))
  return reject("invalid-input",400);
 const pageRaw=params.get("page")??"1",sizeRaw=params.get("pageSize")??"50";
 if(!/^\d{1,6}$/.test(pageRaw)||!["25","50","100"].includes(sizeRaw))
  return reject("invalid-input",400);
 const scope:TicketScope={teamId,cycleId,mode};
 const page=Number(pageRaw),pageSize=Number(sizeRaw);
 try{
  const canRead=await withSessionReadDb(async db=>{
   const table=mode==="scrum"?"smn_sprint":"smn_kanban_period";
   const result=await db.query<{id:string}>(`
    SELECT c.id FROM public.${table} c
    JOIN public.smn_team t ON t.id=c.team_id
    JOIN public.smn_account a ON a.installation_id=t.installation_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL
      AND a.id=$3 AND a.is_active=true AND a.must_change_password=false
      AND a.role='admin' AND i.state='initialized'
      AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))=$4
      AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
    LIMIT 1`,[cycleId,teamId,actor.id,mode]);
   return result.rows.length===1;
  });
  if(!canRead)return reject("forbidden",403);
  const stored=await readTicketSnapshot(scope,businessDate,{authorize:async()=>{}});
  if(!stored)return reject("snapshot-not-found",404);
  if(stored.metadata.snapshotId!==snapshotId)return reject("stale-snapshot",409);
  const browse=browseTicketCsv(stored.csv,{
   search:(params.get("search")??"").slice(0,120),
   issueType:params.get("issueType")??"",status:params.get("status")??"",
   priority:params.get("priority")??"",prefix:params.get("prefix")??"",
   sort,direction,page,pageSize,
  });
  return Response.json({snapshot:stored.metadata,...browse,jiraBaseUrl:null},
   {headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TicketStorageError){
   if(error.code==="invalid-business-date"||error.code==="invalid-scope")
    return reject("invalid-input",400);
   if(error.code==="integrity-failure"||error.code==="invalid-metadata")
    return reject("snapshot-invalid",422);
  }
  return reject("tickets-unavailable",503);
 }
}
