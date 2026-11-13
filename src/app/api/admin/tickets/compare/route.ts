import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSessionReadDb} from "@/server/auth/database";
import {
 readTicketSnapshot,TicketStorageError,type TicketScope,
} from "@/server/tickets/snapshot-storage";
import {
 compareTicketSnapshots,TicketComparisonError,type TicketSnapshotRef,
} from "@/lib/ticket-csv-compare";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const idPattern=/^[a-zA-Z0-9_-]{1,100}$/;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=new Set(["teamId","cycleId","mode","firstDate","firstId","secondDate","secondId","kind","search","page","pageSize"]);

function reject(error:string,status:number):Response{
 return Response.json({error},{status,headers:{"Cache-Control":"no-store"}});
}
function safeDate(value:string):boolean{
 if(!datePattern.test(value))return false;
 const time=Date.parse(value+"T00:00:00Z");
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;
}

/** Read-only, paginated comparison of two distinct snapshots in the same authorized cycle. */
export async function GET(request:NextRequest):Promise<Response>{
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return reject("forbidden",403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(key=>!allowed.has(key)||params.getAll(key).length!==1))
  return reject("invalid-input",400);
 const teamId=params.get("teamId")??"",cycleId=params.get("cycleId")??"";
 const mode=params.get("mode"),firstDate=params.get("firstDate")??"";
 const secondDate=params.get("secondDate")??"";
 const firstId=params.get("firstId")??"",secondId=params.get("secondId")??"";
 const rawPage=params.get("page")??"1",rawSize=params.get("pageSize")??"50";
 const kind=params.get("kind")??"all",search=(params.get("search")??"").trim().slice(0,120);
 const kinds=["all","added","removed","completed","reopened","storyPointsChanged","otherChanged"] as const;
 if(!kinds.some(item=>item===kind))return reject("invalid-input",400);
 if(!idPattern.test(teamId)||!idPattern.test(cycleId)||
  (mode!=="scrum"&&mode!=="kanban")||
  !safeDate(firstDate)||!safeDate(secondDate)||
  !uuid.test(firstId)||!uuid.test(secondId)||
  firstDate===secondDate||firstId===secondId||
  !/^\d{1,6}$/.test(rawPage)||!["25","50","100"].includes(rawSize))
  return reject("invalid-input",400);
 const scope:TicketScope={teamId,cycleId,mode};
 try{
  const authorized=await withSessionReadDb(async db=>{
   const table=mode==="scrum"?"smn_sprint":"smn_kanban_period";
   const result=await db.query(`
    SELECT 1 FROM public.${table} c
    JOIN public.smn_team t ON t.id=c.team_id
    JOIN public.smn_account a ON a.installation_id=t.installation_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL
      AND a.id=$3 AND a.is_active=true AND a.must_change_password=false
      AND a.role IN ('admin','user') AND i.state='initialized'
      AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))=$4
      AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
    LIMIT 1`,[cycleId,teamId,actor.id,mode]);
   return result.rows.length===1;
  });
  if(!authorized)return reject("forbidden",403);
  const [first,second]=await Promise.all([
   readTicketSnapshot(scope,firstDate,{authorize:async()=>{}}),
   readTicketSnapshot(scope,secondDate,{authorize:async()=>{}}),
  ]);
  if(!first||!second)return reject("snapshot-not-found",404);
  if(first.metadata.snapshotId!==firstId||second.metadata.snapshotId!==secondId)
   return reject("stale-snapshot",409);
  const ref=(businessDate:string,snapshotId:string):TicketSnapshotRef=>({
   ...scope,businessDate,snapshotId,
  });
  const compared=compareTicketSnapshots(
   {reference:ref(firstDate,firstId),csv:first.csv},
   {reference:ref(secondDate,secondId),csv:second.csv},
  );
  const normalizedSearch=search.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
  const filtered=compared.changes.filter(item=>
   (kind==="all"||item.kinds.some(value=>value===kind))&&
   (!normalizedSearch||[item.jiraId,item.before?.title??"",item.after?.title??""].some(value=>
    value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().includes(normalizedSearch))));
  const pageSize=Number(rawSize),total=filtered.length;
  const pageCount=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.max(1,Math.min(Number(rawPage),pageCount));
  return Response.json({
   older:compared.older,newer:compared.newer,counts:compared.counts,
   total,page,pageSize,pageCount,
   changes:filtered.slice((page-1)*pageSize,page*pageSize),
  },{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TicketComparisonError){
   return reject(error.code,error.code==="invalid-csv"?422:400);
  }
  if(error instanceof TicketStorageError){
   if(error.code==="integrity-failure"||error.code==="invalid-metadata")
    return reject("snapshot-invalid",422);
   if(error.code==="invalid-scope"||error.code==="invalid-business-date")
    return reject("invalid-input",400);
  }
  return reject("tickets-unavailable",503);
 }
}
