"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {BatchRequest,BatchResult} from "@/server/dashboard-builder/batch";
export type SlotLoad=BatchResult|{id:string;state:"loading"};
type Stored=Readonly<{context:string;value:SlotLoad}>;
const identity=(teamId:string,cycleId:string|null,request:BatchRequest)=>
 JSON.stringify([teamId,cycleId,request.source,request.view,request.filters??{},request.cycleId??null]);
/** Scoped results never survive context changes; each isolated retry has its own cancellation. */
export function useDashboardBatch(teamId:string,cycleId:string|null,items:readonly BatchRequest[],refreshMilliseconds=60000){
 const [state,setState]=useState<Record<string,Stored>>({});
 const [revision,setRevision]=useState(0);
 const [retryCounter,setRetryCounter]=useState<Record<string,number>>({});
 const generation=useRef(0);
 const serialized=JSON.stringify(items);
 const stableItems=useMemo(()=>JSON.parse(serialized) as BatchRequest[],[serialized]);
 const context=JSON.stringify([teamId,cycleId,serialized]);
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 const retry=useCallback((id:string)=>setRetryCounter(v=>({...v,[id]:(v[id]??0)+1})),[]);
 const retries=JSON.stringify(retryCounter);
 useEffect(()=>{
  const controller=new AbortController();
  const current=++generation.current;
  const selected=stableItems.map(item=>({...item,cycleId:item.cycleId??cycleId}));
  const init=Object.fromEntries(selected.map(item=>[item.id,{context:identity(teamId,cycleId,item),value:{id:item.id,state:"loading" as const}}]));
  setState(init);
  async function load(){
   for(let offset=0;offset<selected.length;offset+=20){
    if(controller.signal.aborted)return;
    const batch=selected.slice(offset,offset+20);
    try{
     const response=await fetch("/api/dashboard-builder/batch",{method:"POST",
      headers:{"Content-Type":"application/json"},body:JSON.stringify({teamId,items:batch}),
      signal:controller.signal,cache:"no-store"});
     if(!response.ok)throw Error("dashboard-batch-request-failed");
     const body=await response.json() as {results:BatchResult[]};
     if(current===generation.current&&!controller.signal.aborted)
      setState(previous=>({...previous,...Object.fromEntries(body.results.map(value=>{
       const item=batch.find(i=>i.id===value.id)!;
       return [value.id,{context:identity(teamId,cycleId,item),value}];
      }))}));
    }catch{
     if(current===generation.current&&!controller.signal.aborted)
      setState(previous=>({...previous,...Object.fromEntries(batch.map(item=>
       [item.id,{context:identity(teamId,cycleId,item),value:{id:item.id,state:"error" as const}}]))}));
    }
   }
  }
  void load();
  return ()=>{controller.abort();generation.current++;};
 },[teamId,cycleId,serialized,stableItems,revision]);
 useEffect(()=>{
  if(refreshMilliseconds<=0)return;
  const interval=setInterval(refresh,refreshMilliseconds);
  return ()=>clearInterval(interval);
 },[refresh,refreshMilliseconds]);
 useEffect(()=>{
  const entries=Object.entries(retryCounter).filter(([,count])=>count>0);
  if(!entries.length)return;
  const controller=new AbortController();
  const batch=stableItems.filter(item=>entries.some(([id])=>id===item.id))
   .map(item=>({...item,cycleId:item.cycleId??cycleId}));
  const current=++generation.current;
  setState(previous=>({...previous,...Object.fromEntries(batch.map(item=>
   [item.id,{context:identity(teamId,cycleId,item),value:{id:item.id,state:"loading" as const}}]))}));
  void (async()=>{
   try{
    const response=await fetch("/api/dashboard-builder/batch",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({teamId,items:batch}),signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw Error("dashboard-retry-failed");
    const body=await response.json() as {results:BatchResult[]};
    if(!controller.signal.aborted&&current===generation.current)
     setState(previous=>({...previous,...Object.fromEntries(body.results.map(value=>{
      const item=batch.find(i=>i.id===value.id)!;return [value.id,{context:identity(teamId,cycleId,item),value}];
     }))}));
   }catch{
    if(!controller.signal.aborted&&current===generation.current)
     setState(previous=>({...previous,...Object.fromEntries(batch.map(item=>
      [item.id,{context:identity(teamId,cycleId,item),value:{id:item.id,state:"error" as const}}]))}));
   }
  })();
  return ()=>controller.abort();
 },[retries,teamId,cycleId,stableItems]);
 const slots=Object.fromEntries(stableItems.map(item=>{
  const stored=state[item.id],expected=identity(teamId,cycleId,{...item,cycleId:item.cycleId??cycleId});
  return [item.id,stored?.context===expected?stored.value:{id:item.id,state:"loading"}];
 })) as Record<string,SlotLoad>;
 return {slots,refresh,retry};
}
