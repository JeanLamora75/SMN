"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import {teamSwitchDestination,type TeamNavigationMode} from "@/lib/team-navigation";

type TeamItem={id:string;name:string};
type State={ready:boolean;teamId:string|null;items:TeamItem[]};
type Props=Readonly<{
 enabled:boolean;mode:TeamNavigationMode;
 teamId:string|null;teamName:string|null;
}>;

/** Inactif tant que les consommateurs métier n'utilisent pas tous teamId.
 * L'activation exige une revue distincte de sécurité et de navigation.
 */
export default function ActiveTeamSelector({enabled,mode,teamId,teamName}:Props){
 const t=useTranslation(),router=useRouter(),pathname=usePathname();
 const [options,setOptions]=useState<TeamItem[]>([]);
 const [selected,setSelected]=useState(teamId??"");
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  if(!enabled)return;
  const abort=new AbortController();
  void fetch("/api/admin/teams/active",{cache:"no-store",signal:abort.signal})
   .then(async response=>{
    if(!response.ok)throw Error("team-context-load");
    return response.json() as Promise<State>;
   })
   .then(data=>{
    if(abort.signal.aborted)return;
    if(!data.ready||!Array.isArray(data.items))throw Error("team-context-not-ready");
    setOptions(data.items);
    setSelected(data.teamId&&data.items.some(item=>item.id===data.teamId)?data.teamId:"");
    setReady(true);
   })
   .catch(()=>{if(!abort.signal.aborted){setReady(false);setError(t("teamSwitch.unavailable"));}});
  return ()=>abort.abort();
 },[enabled,t]);
 async function select(next:string){
  if(!enabled||!ready||busy||!options.some(item=>item.id===next))return;
  if(document.querySelector('[data-smn-unsaved-changes="true"]')&&
     !window.confirm(t("teamSwitch.discard")))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/teams/active",{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId:next})
   });
   if(!response.ok)throw Error("team-context-update");
   const value=await response.json() as {ok:boolean;teamId:string};
   if(value.ok!==true||value.teamId!==next)throw Error("team-context-response");
   setSelected(next);
   router.replace(teamSwitchDestination(pathname,next,mode));
   router.refresh();
  }catch{setError(t("teamSwitch.unavailable"));}
  finally{setBusy(false);}
 }
 const active=enabled&&ready&&options.length>0;
 const label=!enabled?t("teamSwitch.pending"):
  !ready?t("teamSwitch.unavailable"):t("dashboard.shell.team");
 return <div className="smn-header-field smn-header-team">
  <label htmlFor="smn-current-team">{t("dashboard.shell.team")}</label>
  <select id="smn-current-team" className="form-select form-select-sm"
   value={active?selected:teamId??""} disabled={!active||busy}
   title={label} aria-describedby="smn-team-help"
   onChange={event=>void select(event.target.value)}>
   {!active?<option value={teamId??""}>{teamName??t("dashboard.shell.noTeam")}</option>:<>
    {!selected&&<option value="">{t("teamSwitch.choose")}</option>}
    {options.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}
   </>}
  </select>
  <span className="visually-hidden" id="smn-team-help">{label}</span>
  {error&&<span role="alert" className="small text-danger">{error}</span>}
 </div>;
}
