import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {validateTicketCsv} from "@/lib/ticket-csv-contract";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** Validate content without persisting files or changing v33 indicators. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")
  return Response.json({error:"forbidden"},{status:403,headers:{"Cache-Control":"no-store"}});
 let payload:unknown;
 try{payload=await request.json();}
 catch{return Response.json({error:"invalid-input"},{status:400});}
 if(!payload||typeof payload!=="object"||Array.isArray(payload)||
  typeof (payload as {csv?:unknown}).csv!=="string")
  return Response.json({error:"invalid-input"},{status:400});
 const validated=validateTicketCsv((payload as {csv:string}).csv);
 const {valid,version,delimiter,columns,errors,warnings,rows}=validated;
 return Response.json({valid,version,delimiter,columns,errors,warnings,rowCount:valid?rows.length:0},
  {status:valid?200:422,headers:{"Cache-Control":"no-store"}});
}
