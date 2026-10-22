import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {listEditableCeremonies} from "@/server/sprints/ceremony-edits";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({ceremonies:await withAuthDb(listEditableCeremonies)});}
 catch{return jsonResult({error:"unavailable"},503);}
}
