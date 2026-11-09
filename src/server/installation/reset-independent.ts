import {createHash} from "node:crypto";
import {Client} from "pg";
import {validateSandboxTarget} from "../backup/restore-sandbox-policy";
import {installExpress} from "./install";

export type IndependentResetCandidate=Readonly<{
 status:"independent-installation-verified";sourceUnchanged:true;
 candidateIsolated:true;tablesChecked:number;sourceRows:number;
 newTeams:0;newMembers:0;newSprints:0;newPdfArchives:0;
}>;

/**
 * Creates a FRESH application in an already-created, empty and disposable
 * local PG18 database. The original database is read-only for this workflow.
 * It never changes the active connection URL or any managed file paths.
 */
export async function provisionIndependentResetCandidate(input:{
 sourceUri:string;candidateUri:string;
 administrator:{adminUsername:string;adminEmail:string;password:string};
}):Promise<IndependentResetCandidate>{
 if(!validateSandboxTarget(input.sourceUri,input.candidateUri))
  throw Error("reset-candidate-not-disposable");
 const source=new Client({connectionString:input.sourceUri,connectionTimeoutMillis:3500});
 let expected:Readonly<{signature:string;rows:number;tables:number}>;
 async function sourceSnapshot(){
  const read=await source.query<{name:string}>(
   "SELECT tablename AS name FROM pg_catalog.pg_tables "+
   "WHERE schemaname='public' AND tablename LIKE 'smn_%' ORDER BY tablename");
  if(read.rows.length>400||read.rows.some(r=>!/^[a-z][a-z0-9_]*$/.test(r.name)))
   throw Error("reset-source-schema-unverifiable");
  const counts:string[]=[];let rows=0;
  const digest=createHash("sha256");
  for(const {name} of read.rows){
   const result=await source.query<{n:string}>(
    'SELECT count(*)::text AS n FROM public."'+name+'"');
   const n=Number(result.rows[0]?.n);
   if(!Number.isSafeInteger(n))throw Error("reset-source-count-unverifiable");
   rows+=n;counts.push(name+":"+n);
   const content=await source.query<{v:string}>(
    'SELECT to_jsonb(t)::text AS v FROM public."'+name+'" t');
   digest.update(name+"|");
   for(const v of content.rows.map(x=>x.v).sort())digest.update(v.length+":"+v+"|");
  }
  return {signature:counts.join("|")+"|"+digest.digest("hex"),rows,tables:read.rows.length};
 }
 try{
  await source.connect();
  // Snapshot BEFORE new installation. Never execute data writes against source.
  await source.query("BEGIN TRANSACTION READ ONLY");
  try{expected=await sourceSnapshot();await source.query("COMMIT");}
  catch(e){await source.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await source.end().catch(()=>undefined);}
 const installed=await installExpress(input.administrator,input.candidateUri);
 if(!installed.ok)throw Error("reset-candidate-installation-failed");
 const verify=new Client({connectionString:input.candidateUri,connectionTimeoutMillis:3500});
 try{
  await verify.connect();
  await verify.query("BEGIN TRANSACTION READ ONLY");
  try{
   const exists=await verify.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation "+
    "WHERE id='singleton' AND state='initialized'");
   if(exists.rows.length!==1||exists.rows[0].schema_version!==33)
    throw Error("reset-candidate-not-native-v33");
   const counts=await verify.query<{teams:string;members:string;sprints:string;pdfs:string}>(
    "SELECT (SELECT count(*)::text FROM public.smn_team) AS teams,"+
    "(SELECT count(*)::text FROM public.smn_member) AS members,"+
    "(SELECT count(*)::text FROM public.smn_sprint) AS sprints,"+
    "(SELECT count(*)::text FROM public.smn_report_pdf_archive) AS pdfs");
   const c=counts.rows[0];
   if(!c||c.teams!=="0"||c.members!=="0"||c.sprints!=="0"||c.pdfs!=="0")
    throw Error("reset-candidate-not-empty");
   const accounts=await verify.query<{n:string}>(
    "SELECT count(*)::text AS n FROM public.smn_account WHERE role='admin'");
   if(accounts.rows[0]?.n!=="1")throw Error("reset-candidate-admin-missing");
   await verify.query("COMMIT");
  }catch(e){await verify.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await verify.end().catch(()=>undefined);}
 const reread=new Client({connectionString:input.sourceUri,connectionTimeoutMillis:3500});
 try{
  await reread.connect();
  await reread.query("BEGIN TRANSACTION READ ONLY");
  try{
   const after=await (async()=>{
    const names=await reread.query<{name:string}>(
     "SELECT tablename AS name FROM pg_catalog.pg_tables "+
     "WHERE schemaname='public' AND tablename LIKE 'smn_%' ORDER BY tablename");
    const counts:string[]=[];const digest=createHash("sha256");
    for(const {name} of names.rows){
     if(!/^[a-z][a-z0-9_]*$/.test(name))throw Error("reset-source-schema-unverifiable");
     const row=await reread.query<{n:string}>(
      'SELECT count(*)::text AS n FROM public."'+name+'"');
     counts.push(name+":"+row.rows[0]?.n);
     const content=await reread.query<{v:string}>(
      'SELECT to_jsonb(t)::text AS v FROM public."'+name+'" t');
     digest.update(name+"|");
     for(const v of content.rows.map(x=>x.v).sort())digest.update(v.length+":"+v+"|");
    }
    return counts.join("|")+"|"+digest.digest("hex");
   })();
   if(after!==expected.signature)throw Error("reset-source-changed");
   await reread.query("COMMIT");
  }catch(e){await reread.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await reread.end().catch(()=>undefined);}
 return {status:"independent-installation-verified",sourceUnchanged:true,
  candidateIsolated:true,tablesChecked:expected.tables,sourceRows:expected.rows,
  newTeams:0,newMembers:0,newSprints:0,newPdfArchives:0};
}
