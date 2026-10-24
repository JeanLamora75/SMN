import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createHumanAnalysis,listHumanAnalyses,updateHumanAnalysis} from "@/server/ai-briefs/human-analyses";
export const dynamic="force-dynamic";
async function team(db:import("pg").Client){
 const q=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
 return q.rows.length===1?q.rows[0].id:null;
}
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const cycleId=new URL(req.url).searchParams.get("cycleId");
 if(!cycleId||!/^[a-f0-9-]{36}$/i.test(cycleId))return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(async db=>{const id=await team(db);return id?listHumanAnalyses(db,cycleId,id):null;});
 return jsonResult(result===null?{error:"not-found"}:{analyses:result},result===null?404:200);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,230000);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>createHumanAnalysis(db,actor.id,body));
 return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,230000);
 if(!body||typeof body.id!=="string"||typeof body.content!=="string")return jsonResult({error:"invalid-input"},400);
 try{const updated=await withAuthDb(async db=>{const id=await team(db);return id?updateHumanAnalysis(db,body.id as string,id,body.content as string):false;});
 return jsonResult({ok:updated},updated?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
