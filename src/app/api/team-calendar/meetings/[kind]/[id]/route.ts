import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readCalendarMeeting,validCalendarMeetingRef} from "@/server/sprints/calendar-meeting-detail";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{kind:string;id:string}>};
const target={type:"collective",exists:true,inScope:true} as const;

export async function GET(request:NextRequest,{params}:Context){
 if(!await authorizeApi(request,"read",target))return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 try{
  const meeting=await withAuthDb(db=>readCalendarMeeting(db,kind,id));
  return meeting?jsonResult({meeting}):jsonResult({error:"not-found"},404);
 }catch{
  console.error("calendar-meeting-detail-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
