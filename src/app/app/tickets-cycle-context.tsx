"use client";
import {createContext,useContext,type ReactNode} from "react";
import type {PrivateMode,PrivateRole} from "@/lib/private-navigation";

export type TicketsCycleContext=Readonly<{
 teamId:string|null;
 mode:PrivateMode|null;
 role:PrivateRole;
 canManageIndicators?:boolean;
 cycleId:string;
 cycleName:string|null;
 cycleStatus:string|null;
 state:"loading"|"ready"|"error";
}>;
const Context=createContext<TicketsCycleContext|null>(null);
export function TicketsCycleProvider({value,children}:{value:TicketsCycleContext;children:ReactNode}){
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useTicketsCycle():TicketsCycleContext{
 const context=useContext(Context);
 if(!context)throw Error("tickets-cycle-provider-missing");
 return context;
}
