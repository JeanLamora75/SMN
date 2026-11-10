/**
 * SMN-34 sandbox fixture: a tiny isolated HTTP worker, NOT the SMN application.
 * It runs with synthetic sessions and a TEMP-only maintenance marker.
 * No production session cookie, user database or external bind is used.
 */
import {createServer} from "node:http";
import {SessionStore} from "../../src/server/auth/session-store";
import {restoreMaintenanceActive} from "../../src/server/backup/restore-maintenance";

const sessions=new SessionStore();
const key="sandbox-fingerprint";
const server=createServer(async(req,res)=>{
 try{
  res.setHeader("Cache-Control","no-store");
  if(await restoreMaintenanceActive()){
   res.writeHead(503,{"Content-Type":"application/json"});
   res.end(JSON.stringify({state:"maintenance"}));return;
  }
  if(req.method==="POST"&&req.url==="/session"){
   const token=sessions.issue("synthetic-account",key,Date.now(),"admin");
   res.writeHead(200,{"Content-Type":"application/json"});
   res.end(JSON.stringify({token}));return;
  }
  if(req.method==="GET"&&req.url==="/session"){
   const token=req.headers.authorization?.replace(/^Bearer /,"");
   const valid=sessions.get(token)?.passwordFingerprint===key;
   res.writeHead(valid?200:401,{"Content-Type":"application/json"});
   res.end(JSON.stringify({state:valid?"active":"unauthorized"}));return;
  }
  res.writeHead(404);res.end();
 }catch{
  res.writeHead(503);res.end(JSON.stringify({state:"unavailable"}));
 }
});
server.listen({host:"127.0.0.1",port:0},()=>{
 const addr=server.address();
 if(!addr||typeof addr==="string")throw Error("sandbox-listener-unavailable");
 process.send?.({ready:true,port:addr.port});
});
process.on("message",message=>{
 if(message==="shutdown")server.close(()=>process.exit(0));
});
