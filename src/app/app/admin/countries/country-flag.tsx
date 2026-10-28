"use client";
import Image from "next/image";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";

/** ISO flag assets are optional; missing assets show a globe and ISO code. */
export default function CountryFlag({code,name}:{code:string;name:string}){
 const t=useTranslation();
 const [failed,setFailed]=useState(false);
 if(failed||!/^[A-Z]{2}$/.test(code))
  return <span className="d-inline-flex align-items-center gap-1"
   aria-label={t("countries.flagFallback",{code:code||"—"})}>
   <span aria-hidden="true">🌐</span><span className="small">{code||"—"}</span>
  </span>;
 return <Image src={"/flags/"+code.toLowerCase()+".png"} width={28} height={19}
  unoptimized alt={t("countries.flagAlt",{country:name})} title={code}
  onError={()=>setFailed(true)}
  style={{objectFit:"contain",height:"19px",width:"28px"}}/>;
}
