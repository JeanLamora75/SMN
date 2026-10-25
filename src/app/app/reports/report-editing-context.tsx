"use client";
import {createContext,useContext,useMemo,useState,type ReactNode} from "react";
type State={revision:number;dirty:boolean;busy:boolean;setDirty:(value:boolean)=>void;setBusy:(value:boolean)=>void;acknowledge:(revision:number,stillDirty:boolean)=>void};
const Context=createContext<State|null>(null);
export function ReportEditingProvider({initialRevision,children}:{initialRevision:number;children:ReactNode}){
 const [revision,setRevision]=useState(initialRevision),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false);
 const value=useMemo(()=>({revision,dirty,busy,setDirty,setBusy,acknowledge:(next:number,stillDirty:boolean)=>{setRevision(next);setDirty(stillDirty);}}),[revision,dirty,busy]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useReportEditing(){const value=useContext(Context);if(!value)throw Error("report-editing-provider-missing");return value;}
