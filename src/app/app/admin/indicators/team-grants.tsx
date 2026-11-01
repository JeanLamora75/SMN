"use client";
import {useCallback,useEffect,useState} from "react";
type GrantData={teams:{id:string;name:string}[];users:{id:string;username:string}[];grants:{account_id:string;team_id:string}[]};
export default function TeamGrants(){
 const [data,setData]=useState<GrantData|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  try{const r=await fetch("/api/admin/indicators/grants",{cache:"no-store"});if(!r.ok)throw Error(String(r.status));setData(await r.json());setError("");}
  catch(e){setError(String(e));}
 },[]);
 useEffect(()=>{void Promise.resolve().then(load);},[load]);
 async function change(accountId:string,teamId:string,enabled:boolean){
  setBusy(true);
  try{const r=await fetch("/api/admin/indicators/grants",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accountId,teamId,enabled})});
   if(!r.ok)throw Error(String(r.status));await load();
  }catch(e){setError(String(e));}finally{setBusy(false);}
 }
 return <section className="smn-panel rounded-4 p-3 mt-4" aria-label="Habilitations Scrum Masters">
  <h2 className="h5">Habilitations des Scrum Masters par équipe</h2>
  {error&&<p role="alert" className="text-danger">{error}</p>}
  <div className="table-responsive"><table className="table"><thead><tr><th>Compte</th>{data?.teams.map(t=><th key={t.id}>{t.name}</th>)}</tr></thead><tbody>
  {data?.users.map(u=><tr key={u.id}><th scope="row">{u.username}</th>{data.teams.map(t=><td key={t.id}><input type="checkbox" className="form-check-input" aria-label={u.username+" — "+t.name} disabled={busy} checked={data.grants.some(g=>g.account_id===u.id&&g.team_id===t.id)} onChange={e=>void change(u.id,t.id,e.target.checked)}/></td>)}</tr>)}
  </tbody></table></div>
 </section>;
}
