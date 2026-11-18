"use client";
import {useEffect,useState} from "react";
import UniversalIndicatorInput from "./universal-input";
import IndicatorReporting from "./reporting-view";
import BootstrapIcon from "../../bootstrap-icon";

const STORAGE_KEY="smn-sprint-indicator-cards-per-row-v1";
const MIN_COLUMNS=1,MAX_COLUMNS=6,DEFAULT_COLUMNS=3;
export function validIndicatorColumns(value:unknown):number{
 const parsed=typeof value==="number"?value:Number(value);
 return Number.isInteger(parsed)&&parsed>=MIN_COLUMNS&&parsed<=MAX_COLUMNS?parsed:DEFAULT_COLUMNS;
}
export default function IndicatorDetailWorkspace({teamId,cycleId,locale}:{
 teamId:string;cycleId:string;locale:"fr"|"en";
}){
 const [columns,setColumns]=useState(DEFAULT_COLUMNS);
 useEffect(()=>{
  try{setColumns(validIndicatorColumns(window.localStorage.getItem(STORAGE_KEY)));}
  catch{/* Private browsing can block storage; keep the default. */}
 },[]);
 const change=(direction:-1|1)=>{
  setColumns(previous=>{
   const next=Math.max(MIN_COLUMNS,Math.min(MAX_COLUMNS,previous+direction));
   try{window.localStorage.setItem(STORAGE_KEY,String(next));}catch{/* In-memory setting still works. */}
   return next;
  });
 };
 return <>
  <div className="smn-sprint-indicator-detail-toolbar">
   <UniversalIndicatorInput teamId={teamId} cycleType="scrum" cycleId={cycleId}/>
   <div className="smn-sprint-indicator-detail-controls" role="group"
    aria-label={locale==="fr"?"Nombre d'indicateurs par ligne":"Indicators per row"}>
    <button type="button" className="btn btn-outline-primary btn-sm"
     onClick={()=>change(1)} disabled={columns>=MAX_COLUMNS}
     title={locale==="fr"?"Afficher un indicateur de plus par ligne":"Show one more indicator per row"}
     aria-label={locale==="fr"?"Augmenter le nombre d'indicateurs par ligne":"Increase indicators per row"}>
     <BootstrapIcon name="plus-lg"/>
    </button>
    <button type="button" className="btn btn-outline-primary btn-sm"
     onClick={()=>change(-1)} disabled={columns<=MIN_COLUMNS}
     title={locale==="fr"?"Afficher un indicateur de moins par ligne":"Show one fewer indicator per row"}
     aria-label={locale==="fr"?"Réduire le nombre d'indicateurs par ligne":"Decrease indicators per row"}>
     <span aria-hidden="true" className="fw-bold">−</span>
    </button>
   </div>
  </div>
  <IndicatorReporting teamId={teamId} cycleType="scrum" screen="cycle_detail"
   cycleId={cycleId} locale={locale} cardsPerRow={columns}/>
 </>;
}
