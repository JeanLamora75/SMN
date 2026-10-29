import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {createReportDocument,getReportDocument,listReportDocuments,updateReportDocument} from "../src/server/reports/report-documents";
import {canAccess} from "../src/server/access-policy";

const sprintId="11111111-1111-4111-8111-111111111111";
const actorId="22222222-2222-4222-8222-222222222222";
const teamId="33333333-3333-4333-8333-333333333333";
function fakeDb(){
 const docs=new Map<string,Record<string,unknown>>();
 const sequences=new Map<string,number>();
 const query=async (sql:string,args:unknown[]=[])=>{
  if(sql.includes("SELECT s.team_id"))return {rows:[{team_id:teamId}]};
  if(sql.includes("SELECT s.id,s.name,s.status"))return {rows:[{id:sprintId,name:"Sprint test",status:"active",teamId,team:"Équipe",product:"Produit",startAt:"2026-10-19",endAt:"2026-10-30",timeZone:"Europe/Paris"}]};
  if(sql.includes("to_regclass(\'public.smn_sprint_goal\')"))return {rows:[{goals:false,closures:false}]};
  if(sql.includes("FROM public.smn_report_template")&&sql.includes("information_schema"))return {rows:[]};
  if(sql.includes("to_regclass('public.smn_report_template')"))return {rows:[{exists:false}]};
  if(sql.includes("to_regclass('public.smn_report_document')"))return {rows:[{present:true}]};
  if(sql.includes("INSERT INTO public.smn_report_document")){
   const [id,sprint,team,title,language,templateId,templateVersion,json]=args;
   docs.set(id as string,{id,sprintId:sprint,teamId:team,title,language,status:"draft",templateId,templateVersion,content:JSON.parse(json as string),revision:1,updatedAt:"now"});
   return {rows:[]};
  }
  if(sql.includes("SELECT id,content FROM public.smn_report_document")){
   const row=docs.get(args[0] as string);
   return {rows:row&&row.sprintId===args[1]?[structuredClone(row)]:[]};
  }
  if(sql.includes("SELECT last_sequence FROM public.smn_report_document_session_write")){
   const n=sequences.get(String(args[0])+":"+String(args[1]));
   return {rows:n===undefined?[]:[{last_sequence:n}]};
  }
  if(sql.includes("INSERT INTO public.smn_report_document_session_write")){
   sequences.set(String(args[0])+":"+String(args[1]),Number(args[2]));return {rows:[]};
  }
  if(sql.includes("UPDATE public.smn_report_document")){
   const [id,sprint,json]=args,row=docs.get(id as string);
   if(!row||row.sprintId!==sprint)return {rows:[]};
   row.content=JSON.parse(json as string);row.revision=Number(row.revision)+1;
   return {rows:[{revision:row.revision}]};
  }
  if(sql.includes("SELECT id FROM public.smn_report_document"))return {rows:docs.has(args[0] as string)?[{id:args[0]}]:[]};
  if(sql.includes("FROM public.smn_report_document")&&sql.includes("AND sprint_id=$2")){
   const row=docs.get(args[0] as string);
   return {rows:row&&row.sprintId===args[1]?[structuredClone(row)]:[]};
  }
  if(sql.includes("FROM public.smn_report_document")&&sql.includes("WHERE sprint_id=$1")){
   return {rows:[...docs.values()].filter(v=>v.sprintId===args[0]).map(v=>structuredClone(v))};
  }
  return {rows:[]};
 };
 return {db:{query} as unknown as Client,docs};
}
test("Two draft reports have distinct IDs, pinned templates and independent content",async()=>{
 const {db}=fakeDb();
 const input={title:"Bilan",language:"fr",templateId:"standard"};
 const a=await createReportDocument(db,actorId,sprintId,input);
 const b=await createReportDocument(db,actorId,sprintId,{...input,title:"Direction"});
 assert.equal(a.ok,true);assert.equal(b.ok,true);
 if(!a.ok||!b.ok)throw Error("creation failed");
 assert.notEqual(a.id,b.id);
 const first=await getReportDocument(db,sprintId,a.id);
 const second=await getReportDocument(db,sprintId,b.id);
 assert.equal(first?.templateId,"standard");assert.equal(first?.templateVersion,0);
 assert.equal(second?.title,"Direction");
 const newContent={...first!.content as object,notes:{introduction:{text:"Texte A",included:true,language:"fr"}}};
 const sessionId="44444444-4444-4444-8444-444444444444";
 const saved=await updateReportDocument(db,actorId,sprintId,a.id,{content:newContent,sessionId,sequence:1});
 assert.deepEqual(saved,{ok:true,revision:2});
 assert.deepEqual((await getReportDocument(db,sprintId,b.id))?.content,second?.content);
 assert.equal((await listReportDocuments(db,sprintId))?.length,2);
 assert.deepEqual(await updateReportDocument(db,actorId,sprintId,a.id,{content:newContent,sessionId,sequence:1}),{ok:false,error:"stale"});
 assert.equal(await getReportDocument(db,sprintId,"44444444-4444-4444-8444-444444444444"),null);
});
test("User cannot write, admin can; user can read collective reporting",()=>{
 const user={role:"user",is_active:true,must_change_password:false};
 const admin={...user,role:"admin"};
 assert.equal(canAccess(user,"write",{type:"settings",exists:true,inScope:true}),false);
 assert.equal(canAccess(user,"read",{type:"collective",exists:true,inScope:true}),true);
 assert.equal(canAccess(admin,"write",{type:"settings",exists:true,inScope:true}),true);
 assert.equal(canAccess(admin,"write",{type:"settings",exists:true,inScope:false}),false);
});
