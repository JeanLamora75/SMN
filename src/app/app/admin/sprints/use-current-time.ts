"use client";
import {useEffect,useState} from "react";

/** An external clock snapshot; never call Date.now() during a React render. */
export function useCurrentTime():number|null{
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{
  let active=true;
  const update=()=>{if(active)setNow(Date.now());};
  const timer=window.setInterval(update,60000);
  document.addEventListener("visibilitychange",update);
  queueMicrotask(update);
  return()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",update);};
 },[]);
 return now;
}
