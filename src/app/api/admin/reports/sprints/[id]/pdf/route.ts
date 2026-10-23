import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {SESSION_COOKIE} from "@/server/auth/guards";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readFrozenReportReference} from "@/server/reports/render-reference";
import {generateFrozenPdf} from "@/server/reports/frozen-pdf";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"generate",{type:"documents",exists:true,inScope:true,collection:true});
 if(!actor)return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 const body=await req.json().catch(()=>null) as {reference?:unknown}|null;
 if(!body||typeof body.reference!=="string"||!/^[a-f0-9-]{36}$/i.test(body.reference))return Response.json({error:"invalid-input"},{status:400});
 const referenceId=body.reference;
 const cookie=req.cookies.get(SESSION_COOKIE)?.value;
 if(!cookie)return Response.json({error:"forbidden"},{status:403});
 const reference=await withSprintIndexDb(db=>readFrozenReportReference(db,referenceId,id)).catch(()=>null);
 if(!reference)return Response.json({error:"reference-unavailable"},{status:409});
 const configured=process.env.SMN_PDF_INTERNAL_ORIGIN??"http://127.0.0.1:3003";
 let origin:URL;
 try{origin=new URL(configured);
 if(origin.protocol!=="http:"||!["127.0.0.1","localhost"].includes(origin.hostname)||origin.username||origin.password||origin.pathname!=="/")throw Error();}
 catch{return Response.json({error:"pdf-origin-invalid"},{status:503});}
 const url=new URL("/app/admin/sprints/"+id+"/report/preview",origin);
 url.searchParams.set("reference",reference.id);
 try{
 const bytes=await generateFrozenPdf(url.toString(),{name:SESSION_COOKIE,value:cookie});
 return new Response(new Uint8Array(bytes),{status:200,headers:{
  "Content-Type":"application/pdf",
  "Content-Disposition":'attachment; filename="SMN-report-'+id+'-'+reference.id+'.pdf"',
  "Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff"
 }});
 }catch{return Response.json({error:"pdf-generation-failed"},{status:503});}
}
