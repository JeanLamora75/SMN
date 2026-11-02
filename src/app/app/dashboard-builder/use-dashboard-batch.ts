"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {BatchRequest,BatchResult} from "@/server/dashboard-builder/batch";
export type SlotLoad=BatchResult|{id:string;state:"loading"};
/** Structure renders immediately. Requests are grouped and obsolete responses discarded. */
export function useDashboardBatch(teamId:string,cycleId:string|null,items:readonly BatchRequest[],
 refreshMilliseconds=60000){
 const [state,setState]=useState<Record<string,SlotLoad>>({});
 const [revision,setRevision]=useState(0);
 const sequence=useRef(0);
 const serialized=JSON.stringify(items);
 const stableItems=useMemo(()=>JSON.parse(serialized) as BatchRequest[],[serialized]);
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 useEffect(()=>{
  const controller=new AbortController();
  const current=++sequence.current;
  setState(Object.fromEntries(stableItems.map(i=>[i.id,{id:i.id,state:"loading" as const}])));
  const currentItems=stableItems.map(i=>({...i,cycleId:i.cycleId??cycleId}));
  async function load(){
   // Visible-first prioritization is supplied by the caller via item order.
   for(let offset=0;offset<currentItems.length;offset+=20){
    if(controller.signal.aborted)return;
    try{
     const response=await fetch("/api/dashboard-builder/batch",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({teamId,items:currentItems.slice(offset,offset+20)}),
      signal:controller.signal,cache:"no-store",
     });
     if(!response.ok)throw Error("dashboard-batch-request-failed");
     const body=await response.json() as {results:BatchResult[]};
     if(current===sequence.current&&!controller.signal.aborted)
      setState(previous=>({...previous,...Object.fromEntries(body.results.map(x=>[x.id,x]))}));
    }catch{
     if(current===sequence.current&&!controller.signal.aborted)
      setState(previous=>({...previous,...Object.fromEntries(currentItems.slice(offset,offset+20).map(x=>
       [x.id,{id:x.id,state:"error" as const}]))}));
    }
   }
  }
  void load();
  return ()=>{controller.abort();sequence.current++;};
 },[teamId,cycleId,serialized,stableItems,revision]);
 useEffect(()=>{
  if(refreshMilliseconds<=0)return;
  const interval=setInterval(refresh,refreshMilliseconds);
  return ()=>clearInterval(interval);
 },[refresh,refreshMilliseconds]);
 return {slots:state,refresh};
}
