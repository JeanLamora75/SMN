import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {previewBackup} from "@/server/backup/preview";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const id=request.nextUrl.searchParams.get("id");
 if(!id||!/^[0-9a-f-]{36}$/i.test(id))return jsonResult({error:"invalid-id"},400);
 try{return jsonResult(await previewBackup(id));}
 catch{return jsonResult({error:"preview-unavailable"},503);}
}
