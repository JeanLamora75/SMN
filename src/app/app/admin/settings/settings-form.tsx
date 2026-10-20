"use client";
import { useCallback,useEffect,useState,type FormEvent } from "react";
import {useRouter} from "next/navigation";
import {useLocale,useTranslation} from "@/i18n/client";
type Settings={
  locale:"fr"|"en";theme:"light"|"dark";referenceCountry:string|null;
  revision:number;updatedAt:string;mode:"scrum"|"kanban";product:string;
};
const countries=["FR","DE","GB","ES","PT","IT","CA"] as const;
export default function SettingsForm() {
  const t=useTranslation();
  const currentLocale=useLocale();
  const router=useRouter();
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
    }catch{setError(t("settings.loadError"));setLoaded(false);}
  },[t]);
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
        setError(t(data.error==="conflict"?"settings.conflict":
          data.error==="invalid-input"?"settings.invalid":"settings.saveError"));
        return;
      }
      setSaved(data.settings);
      setSuccess(t(data.changed?"settings.saved":"settings.unchanged"));
      if(saved.locale!==data.settings.locale)router.refresh();
    }catch{setError(t("settings.network"));}
    finally{setBusy(false);}
  }
  const dirty=!!saved&&(locale!==saved.locale||theme!==saved.theme||country!==(saved.referenceCountry??""));
  return <div className="d-grid gap-4">
    {loaded&&saved&&<form onSubmit={submit} className="smn-panel p-4 d-grid gap-4">
      <section>
        <h2 className="h5">{t("settings.fixed")}</h2>
        <p className="small text-secondary">{t("settings.fixedInfo")}</p>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="fixed-mode">{t("settings.mode")}</label>
            <input className="form-control" id="fixed-mode" value={saved.mode==="scrum"?"Scrum":"Kanban"} readOnly/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="fixed-product">{t("settings.product")}</label>
            <input className="form-control" id="fixed-product" value={saved.product} readOnly/></div>
        </div>
      </section>
      <section>
        <h2 className="h5">{t("settings.editable")}</h2>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="locale">{t("settings.locale")}</label>
            <select id="locale" className="form-select" value={locale} disabled={busy} onChange={e=>setLocale(e.target.value as "fr"|"en")}>
              <option value="fr">{t("settings.french")}</option><option value="en">{t("settings.english")}</option>
            </select>
            <p className="small text-secondary mt-1">{t("settings.localeInfo")}</p>
          </div>
          <div className="col-md-6"><label className="form-label" htmlFor="theme">{t("settings.theme")}</label>
            <select id="theme" className="form-select" value={theme} disabled={busy} onChange={e=>setTheme(e.target.value as "light"|"dark")}>
              <option value="light">{t("settings.light")}</option><option value="dark">{t("settings.dark")}</option>
            </select>
            <p className="small text-secondary mt-1">{t("settings.themeInfo")}</p>
          </div>
          <div className="col-md-6"><label className="form-label" htmlFor="country">{t("settings.country")}</label>
            <select id="country" className="form-select" value={country} disabled={busy} onChange={e=>setCountry(e.target.value)}>
              <option value="">{t("settings.countryEmpty")}</option>
              {saved.referenceCountry&&!countries.includes(saved.referenceCountry as typeof countries[number])&&
                <option value={saved.referenceCountry}>{t("settings.unknownCountry",{code:saved.referenceCountry})}</option>}
              {countries.map(c=><option key={c} value={c}>{t(`settings.countries.${c}`)}</option>)}
            </select>
            <p className="small text-secondary mt-1">{t("settings.countryInfo")}</p>
          </div>
        </div>
      </section>
      <p className="small text-secondary mb-0">{t("settings.displayInfo")}</p>
      <div className="d-flex gap-2 flex-wrap">
        <button type="submit" className="btn btn-primary" disabled={busy||!dirty}>{t(busy?"settings.saving":"settings.save")}</button>
        <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>void reload()}>{t("settings.reload")}</button>
      </div>
      <p className="small text-secondary mb-0">{t("settings.revision",{revision:saved.revision,
        date:new Date(saved.updatedAt).toLocaleString(currentLocale==="en"?"en-GB":"fr-FR")})}</p>
    </form>}
    {!loaded&&<button type="button" className="btn btn-outline-primary" onClick={()=>void reload()} disabled={busy}>{t("settings.retryLoad")}</button>}
    {error&&<p role="alert" className="alert alert-warning">{error}</p>}
    {success&&<p role="status" className="alert alert-success">{success}</p>}
  </div>;
}
