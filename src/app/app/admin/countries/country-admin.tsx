"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Country={code:string;name:string};
export default function CountryAdmin(){
 const t=useTranslation();
 const [countries,setCountries]=useState<Country[]>([]);
 const [code,setCode]=useState("");
 const [name,setName]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 async function refresh(){
  const response=await fetch("/api/admin/countries",{cache:"no-store"});
  if(!response.ok)throw Error("read-error");
  const data=await response.json() as {countries:Country[]};
  setCountries(data.countries);
 }
 useEffect(()=>{void refresh().catch(()=>setNotice("failed"));},[]);
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setNotice("");
  try{
   const response=await fetch("/api/admin/countries",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({code,name})});
   if(!response.ok){setNotice(response.status===409?"duplicate":response.status===400?"invalid":"failed");return;}
   await refresh();setCode("");setName("");setNotice("saved");
  }catch{setNotice("failed");}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4">
  <h2 className="h5">{t("countries.addTitle")}</h2>
  <form className="d-grid gap-2" onSubmit={submit}>
   <label htmlFor="code">{t("countries.code")}</label>
   <input id="code" className="form-control" maxLength={2} required
    value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
   <label htmlFor="name">{t("countries.name")}</label>
   <input id="name" className="form-control" maxLength={120} required
    value={name} onChange={e=>setName(e.target.value)}/>
   <button type="submit" className="btn btn-primary" disabled={busy}>{t("countries.add")}</button>
  </form>
  {notice&&<p role={notice==="saved"?"status":"alert"} className={"alert "+(notice==="saved"?"alert-success":"alert-warning")}>{t(notice==="saved"?"countries.saved":notice==="duplicate"?"countries.duplicate":notice==="invalid"?"countries.invalid":"countries.failed")}</p>}
  <h2 className="h5 mt-4">{t("countries.listTitle")}</h2>
  <table className="table"><thead><tr><th>{t("countries.code")}</th>
   <th>{t("countries.name")}</th><th>{t("countries.calendarStatus")}</th></tr></thead>
   <tbody>{countries.map(c=><tr key={c.code}><td>{c.code}</td><td>{c.name}</td>
    <td>{t("countries.notConfigured")}</td></tr>)}</tbody>
  </table>
  <p className="small">{t("countries.unknownNotZero")}</p>
 </section>;
}
