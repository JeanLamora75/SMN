"use client";
import Link from "next/link";
import {useEffect} from "react";
export default function BriefPreparationError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("smn-ai-brief-prepare-unavailable",error.digest??"no-digest");},[error.digest]);
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <section className="smn-panel rounded-4 p-4" role="alert">
   <h1 className="h4">Préparation du brief IA indisponible</h1>
   <p>Si SMN vient d’être mis à jour, la base peut nécessiter une migration des prompts IA.
    La maintenance permet de vérifier ce point et d’effectuer une migration sécurisée après sauvegarde.</p>
   <div className="d-flex flex-wrap gap-2">
    <Link className="btn btn-primary" href="/app/admin/settings/maintenance#briefMigration">Vérifier la migration</Link>
    <button className="btn btn-outline-secondary" type="button" onClick={reset}>Réessayer</button>
    <Link className="btn btn-outline-secondary" href="/app">Tableau de bord</Link>
   </div>
  </section>
 </main>;
}
