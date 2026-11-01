import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {previewCsvV33,confirmCsvV33,type CsvV33Request,type CsvV33Choice} from "@/server/historical-csv/v33";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 try{
  const input=await req.json() as {action:unknown;input:CsvV33Request;choices?:CsvV33Choice[]};
  if(!input||!input.input||!["preview","confirm"].includes(String(input.action)))
   return Response.json({error:"invalid-input"},{status:400});
  const result=input.action==="preview"?
   await withAuthDb(db=>previewCsvV33(db,input.input)):
   await withAuthDb(db=>confirmCsvV33(db,actor.id,input.input,input.choices??[]));
  return Response.json(result,{status:result.ok?200:409,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"service-unavailable"},{status:503});}
}
