"use client";
import {useEffect,useState} from "react";

/**
 * Browser-supported IANA zones, with a deterministic server-rendered initial
 * option. The persisted value is always included, including legacy aliases.
 */
const defaults=["UTC","Europe/Paris","Europe/London","America/New_York","Asia/Kolkata","Asia/Tokyo"];
function zonesFor(value:string):string[]{
 const values=typeof Intl.supportedValuesOf==="function"?
  Intl.supportedValuesOf("timeZone"):defaults;
 return Array.from(new Set([...values,"UTC",value].filter(Boolean))).sort((a,b)=>a.localeCompare(b));
}
type Props={id:string;label:string;value:string;onChange:(value:string)=>void;disabled?:boolean};
export default function IanaTimeZoneSelect({id,label,value,onChange,disabled=false}:Props){
 const [zones,setZones]=useState<string[]>([]);
 useEffect(()=>{setZones(zonesFor(value));},[value]);
 const choices=zones.length?zones:(value?[value]:["UTC"]);
 return <div>
  <label htmlFor={id} className="form-label">{label}</label>
  <select id={id} className="form-select" required disabled={disabled}
   value={value} onChange={event=>onChange(event.target.value)}>
   {choices.map(zone=><option key={zone} value={zone}>{zone}</option>)}
  </select>
 </div>;
}
