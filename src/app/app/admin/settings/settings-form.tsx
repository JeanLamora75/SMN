"use client";
import { useCallback,useEffect,useState,type FormEvent } from "react";
type Settings={
  locale:"fr"|"en";theme:"light"|"dark";referenceCountry:string|null;
  revision:number;updatedAt:string;mode:"scrum"|"kanban";product:string;
};
const countries=[
  {code:"FR",label:"France"},{code:"DE",label:"Allemagne"},{code:"GB",label:"Royaume-Uni"},
  {code:"ES",label:"Espagne"},{code:"PT",label:"Portugal"},{code:"IT",label:"Italie"},
  {code:"CA",label:"Canada"},
];
export default function SettingsForm() {
  const [saved,setSaved]=useState<Settings|null>(null);
  const [locale,setLocale]=useState<"fr"|"en">("fr");
  const [theme,setTheme]=useState<"light"|"dark">("light");
  const [country,setCountry]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [loaded,setLoaded]=useState(false);
  const reload=useCallback(async()=>{
    setError("");setSuccess("");
    try {
      const response=await fetch("/api/admin/settings",{cache:"no-store"});
      if(!response.ok) throw new Error("load");
      const data=await response.json() as {settings:Settings};
      setSaved(data.settings);setLocale(data.settings.locale);setTheme(data.settings.theme);
      setCountry(data.settings.referenceCountry??"");setLoaded(true);
    }catch{setError("Impossible de charger les paramètres. Aucun changement enregistré.");setLoaded(false);}
  },[]);
  useEffect(()=>{void Promise.resolve().then(reload);},[reload]);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!saved)return;
    setBusy(true);setError("");setSuccess("");
    try {
      const response=await fetch("/api/admin/settings",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({locale,theme,referenceCountry:country||null,revision:saved.revision}),
        cache:"no-store",
      });
      const data=await response.json() as {settings?:Settings;changed?:boolean;error?:string};
      if(!response.ok||!data.settings) {
        setError(data.error==="conflict"?"Ces paramètres ont été modifiés dans un autre onglet. Rechargez les valeurs avant de réessayer.":
          data.error==="invalid-input"?"Valeur non autorisée. Vérifiez les réglages.":
          "Enregistrement indisponible : les anciens paramètres sont conservés.");
        return;
      }
      setSaved(data.settings);
      setSuccess(data.changed?"Paramètres enregistrés. L'historique existant n'a pas été modifié.":
        "Aucun changement nécessaire : les paramètres sont déjà à jour.");
    }catch{setError("Connexion interrompue. Vérifiez les valeurs après rechargement avant tout nouvel essai.");}
    finally{setBusy(false);}
  }
  const dirty=!!saved&&(locale!==saved.locale||theme!==saved.theme||country!==(saved.referenceCountry??""));
  return <div className="d-grid gap-4">
    {loaded&&saved&&<form onSubmit={submit} className="smn-panel p-4 d-grid gap-4">
      <section>
        <h2 className="h5">Choix fixes de l&apos;installation</h2>
        <p className="small text-secondary">Le mode et le produit de référence sont définis lors de l&apos;installation. Leur modification nécessite une installation distincte.</p>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="fixed-mode">Mode Agile</label>
            <input className="form-control" id="fixed-mode" value={saved.mode==="scrum"?"Scrum":"Kanban"} readOnly/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="fixed-product">Produit</label>
            <input className="form-control" id="fixed-product" value={saved.product} readOnly/></div>
        </div>
      </section>
      <section>
        <h2 className="h5">Préférences administrables</h2>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="locale">Langue préférée</label>
            <select id="locale" className="form-select" value={locale} disabled={busy} onChange={e=>setLocale(e.target.value as "fr"|"en")}>
              <option value="fr">Français</option><option value="en">English</option>
            </select>
            <p className="small text-secondary mt-1">Préférence enregistrée ; l&apos;application complète de la langue est prévue par SMN-24.</p>
          </div>
          <div className="col-md-6"><label className="form-label" htmlFor="theme">Thème préféré</label>
            <select id="theme" className="form-select" value={theme} disabled={busy} onChange={e=>setTheme(e.target.value as "light"|"dark")}>
              <option value="light">Clair</option><option value="dark">Sombre</option>
            </select>
            <p className="small text-secondary mt-1">Préférence enregistrée ; l&apos;application complète du thème est prévue par une prochaine Story.</p>
          </div>
          <div className="col-md-6"><label className="form-label" htmlFor="country">Pays de référence</label>
            <select id="country" className="form-select" value={country} disabled={busy} onChange={e=>setCountry(e.target.value)}>
              <option value="">Non renseigné</option>
              {saved.referenceCountry&&!countries.some(c=>c.code===saved.referenceCountry)&&
                <option value={saved.referenceCountry}>{saved.referenceCountry} — pays existant</option>}
              {countries.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <p className="small text-secondary mt-1">Pays par défaut des futures fiches membres ; aucun calendrier, membre ou bilan passé n&apos;est recalculé.</p>
          </div>
        </div>
      </section>
      <p className="small text-secondary mb-0">Les préférences d&apos;affichage sont disponibles immédiatement pour les futurs modules.
        Les paramètres influençant des créations de données s&apos;appliquent uniquement aux nouvelles données,
        à compter de l&apos;enregistrement. Aucun Sprint, période, capacité, registre ou document archivé n&apos;est modifié.</p>
      <div className="d-flex gap-2 flex-wrap">
        <button type="submit" className="btn btn-primary" disabled={busy||!dirty}>{busy?"Enregistrement…":"Enregistrer les paramètres"}</button>
        <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>void reload()}>Recharger</button>
      </div>
      <p className="small text-secondary mb-0">Révision {saved.revision} — dernière modification : {new Date(saved.updatedAt).toLocaleString("fr-FR")}</p>
    </form>}
    {!loaded&&<button type="button" className="btn btn-outline-primary" onClick={()=>void reload()} disabled={busy}>Réessayer de charger</button>}
    {error&&<p role="alert" className="alert alert-warning">{error}</p>}
    {success&&<p role="status" className="alert alert-success">{success}</p>}
  </div>;
}
