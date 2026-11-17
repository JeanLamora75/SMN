"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
type Status={hasPrompt:boolean;legacy:boolean;needsMigration:boolean;cleanupBlocked:boolean};
type Backup={id:string;status:string;integrityVerified:boolean;scopeComplete?:boolean;
 createdAt:string|null};
export default function BriefMigrationAdmin(){
 const [status,setStatus]=useState<Status|null>(null);
 const [backups,setBackups]=useState<Backup[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const refresh=useCallback(async()=>{
  const [s,b]=await Promise.all([
   fetch("/api/admin/ai-briefs/migration",{cache:"no-store"}),
   fetch("/api/admin/backups",{cache:"no-store"})
  ]);
  if(!s.ok||!b.ok)throw Error("status-unavailable");
  const schema=await s.json() as Status;
  const inventory=await b.json() as {inventory:Backup[]};
  if(!Array.isArray(inventory.inventory))throw Error("inventory-unavailable");
  setStatus(schema);setBackups(inventory.inventory);
 },[]);
 useEffect(()=>{void refresh().catch(()=>setError("Impossible de vérifier la base ou les sauvegardes."));},[refresh]);
 const valid=backups.find(x=>x.status==="verified"&&x.integrityVerified&&x.scopeComplete&&
  !!x.createdAt&&Date.now()-Date.parse(x.createdAt)<24*60*60*1000);
 async function migrate(){
  if(!status?.needsMigration||!valid||busy)return;
  if(!window.confirm("Appliquer la migration additive des briefs IA ? Les données historiques seront conservées."))return;
  setBusy(true);setError("");setMessage("");
  try{
   const res=await fetch("/api/admin/ai-briefs/migration",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({backupId:valid.id,confirm:true})
   });
   if(!res.ok)throw Error((await res.json() as {error?:string}).error??"migration-failed");
   await refresh();
   setMessage("Migration des prompts terminée. Tu peux rouvrir la préparation du brief.");
  }catch(e){setError("Migration non effectuée : "+(e instanceof Error?e.message:"erreur inconnue"));}
  finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="brief-migration-title">
  <div>
   <h2 className="h5" id="brief-migration-title">Mise à niveau des briefs IA</h2>
   <p className="text-secondary mb-0">Contrôle de compatibilité de la base après mise à jour de SMN. Aucune modification n'est effectuée sans sauvegarde vérifiée.</p>
  </div>
  {!status&&<p className="text-secondary">État de la migration indisponible.</p>}
  {status&&<p role="status" className={status.needsMigration?"alert alert-warning mb-0":"alert alert-success mb-0"}>
   {status.needsMigration?"La base nécessite la migration SMN-472 (texte des prompts).":
    "La colonne des prompts IA est disponible."}
  </p>}
  {status?.needsMigration&&<>
   <p className="mb-0">Crée une sauvegarde dans l’onglet « Sauvegardes » puis clique sur « Actualiser ». Seule une sauvegarde complète, vérifiée et créée au cours des dernières 24 heures autorise la migration.</p>
   <div className="d-flex gap-2 flex-wrap">
    <button type="button" className="btn btn-outline-secondary" disabled={busy}
     onClick={()=>void refresh().catch(()=>setError("Vérification indisponible."))}>Actualiser</button>
    <button type="button" className="btn btn-primary" disabled={busy||!valid} onClick={()=>void migrate()}>
     {busy?"Migration en cours…":"Appliquer la migration SMN-472"}</button>
   </div>
   {!valid&&<p role="alert" className="small text-secondary mb-0">Aucune sauvegarde récente et vérifiée n'a été trouvée. La migration reste bloquée.</p>}
  </>}
  {status?.cleanupBlocked&&<p className="alert alert-warning mb-0">
   Le nettoyage SMN-477 des anciennes colonnes reste désactivé tant qu'une restauration isolée de la sauvegarde n'a pas été vérifiée. Les données historiques sont conservées.
  </p>}
  {message&&<p role="status" className="alert alert-success mb-0">{message}</p>}
  {error&&<p role="alert" className="alert alert-danger mb-0">{error}</p>}
  {!status?.needsMigration&&<Link href="/app/admin/ai-briefs/templates" className="btn btn-outline-primary align-self-start">Voir les modèles de briefs</Link>}
 </section>;
}
