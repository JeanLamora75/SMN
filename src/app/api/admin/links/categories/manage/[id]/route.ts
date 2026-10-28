import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {mapLinkError} from "@/server/links/validation";
import {renameCategory,deleteCategory} from "@/server/links/categories-admin";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;
type Context={params:Promise<{id:string}>};
export async function PUT(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,2048);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const {id}=await params;return jsonResult({item:await withAuthDb(db=>renameCategory(db,actor,id,body.name))});}
 catch(e){const x=mapLinkError(e);return jsonResult({error:x.error},x.status);}
}
export async function DELETE(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const {id}=await params;return jsonResult(await withAuthDb(db=>deleteCategory(db,actor,id)));}
 catch(e){const x=mapLinkError(e);return jsonResult({error:x.error},x.status);}
}
