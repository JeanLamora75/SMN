"use client";
import Image from "next/image";
import {useState} from "react";

/** Shared icon: ISO 3166-1 alpha-2 assets live in public/flags (lowercase filenames). */
export default function CountryFlag({countryIso2}:{countryIso2:string|null|undefined}){
 const [failed,setFailed]=useState(false);
 if(!countryIso2||!/^[A-Za-z]{2}$/.test(countryIso2)||failed)return null;
 const code=countryIso2.toLowerCase();
 return <Image src={"/flags/"+code+".png"} unoptimized width={24} height={16}
  alt={"Drapeau "+countryIso2.toUpperCase()} title={countryIso2.toUpperCase()}
  onError={()=>setFailed(true)}
  style={{height:"1em",width:"auto",maxWidth:"1.7em",objectFit:"contain",flexShrink:0,verticalAlign:"middle"}}/>;
}
