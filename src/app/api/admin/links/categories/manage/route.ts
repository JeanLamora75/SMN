import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {mapLinkError} from "@/server/links/validation";
import {listCategoryUsage,createCategory} from "@/server/links/categories-admin";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{return jsonResult({items:await withAuthDb(db=>listCategoryUsage(db,actor))});}
 catch(e){const x=mapLinkError(e);return jsonResult({error:x.error},x.status);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,2048);if(!body)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult({item:await withAuthDb(db=>createCategory(db,actor,body.name))},201);}
 catch(e){const x=mapLinkError(e);return jsonResult({error:x.error},x.status);}
}
