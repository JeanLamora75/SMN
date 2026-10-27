"use client";
import { useCallback,useEffect,useState,type FormEvent } from "react";
import {useRouter} from "next/navigation";
import {useLocale,useTranslation} from "@/i18n/client";
import {type Palette} from "@/lib/appearance";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Settings={
  locale:"fr"|"en";theme:"light"|"dark";palette:Palette;referenceCountry:string|null;
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
  const [palette,setPalette]=useState<Palette>("ocean");
  const [country,setCountry]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [loaded,setLoaded]=useState(false);
  const [tab,setTab]=useState<"general"|"language"|"appearance">("general");
  const reload=useCallback(async()=>{
    setError("");setSuccess("");
    try {
      const response=await fetch("/api/admin/settings",{cache:"no-store"});
      if(!response.ok) throw new Error("load");
      const data=await response.json() as {settings:Settings};
      setSaved(data.settings);setLocale(data.settings.locale);setTheme(data.settings.theme);setPalette(data.settings.palette);
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
        body:JSON.stringify({locale,theme,palette,referenceCountry:country||null,revision:saved.revision}),
        cache:"no-store",
      });
      const data=await response.json() as {settings?:Settings;changed?:boolean;error?:string};
      if(!response.ok||!data.settings) {
        setError(t(data.error==="conflict"?"settings.conflict":
          data.error==="invalid-input"?"settings.invalid":"settings.saveError"));
        return;
      }
      setSaved(data.settings);
      // Mise à jour instantanée du DOM ; le rendu SSR reprend le même état après rechargement.
      document.documentElement.setAttribute("data-bs-theme",data.settings.theme);
      document.documentElement.setAttribute("data-smn-palette",data.settings.palette);
      setSuccess(t(data.changed?"settings.saved":"settings.unchanged"));
      if(saved.locale!==data.settings.locale || saved.theme!==data.settings.theme || saved.palette!==data.settings.palette)router.refresh();
    }catch{setError(t("settings.network"));}
    finally{setBusy(false);}
  }
  useEffect(()=>{if(!loaded)return;
    const hash=window.location.hash;
    if(hash==="#settings-language"||hash==="#settings-appearance"){
      setTab(hash==="#settings-language"?"language":"appearance");
    }
  },[loaded]);
  const dirty=!!saved&&(locale!==saved.locale||theme!==saved.theme||palette!==saved.palette||country!==(saved.referenceCountry??""));
  useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
  const chooseTab=(next:"general"|"language"|"appearance")=>{
    if(busy)return false;
    if(dirty&&!window.confirm(t("draft.leaveWarning")))return false;
    setTab(next);
    return true;
  };
  const discardAndReload=()=>{
    if(dirty&&!window.confirm(t("draft.discardWarning")))return;
    void reload();
  };
  return <div className="d-grid gap-4">
    {dirty&&<p role="status" className="alert alert-warning mb-0">{t("draft.pending")}</p>}
    {loaded&&saved&&<div className="nav nav-tabs" role="tablist" aria-label={t("settings.title")}>
      {(["general","language","appearance"] as const).map((name,index)=><button key={name} type="button"
        role="tab" id={"settings-tab-"+name} aria-controls={"settings-panel-"+name}
        aria-selected={tab===name} tabIndex={tab===name?0:-1}
        className={"nav-link"+(tab===name?" active":"")}
        onClick={()=>chooseTab(name)}
        onKeyDown={event=>{
          if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
          event.preventDefault();
          const names=["general","language","appearance"] as const;
          const next=event.key==="Home"?0:event.key==="End"?2:
            (index+(event.key==="ArrowRight"?1:-1)+3)%3;
          if(chooseTab(names[next]))document.getElementById("settings-tab-"+names[next])?.focus();
        }}>{t(`settingsCatalog.tabs.${name}`)}</button>)}
    </div>}
    {loaded&&saved&&<form onSubmit={submit} className="smn-panel p-4 d-grid gap-4" aria-describedby={error?"settings-feedback":undefined}>
      <section id="settings-panel-general" role="tabpanel" aria-labelledby="settings-tab-general" hidden={tab!=="general"}>
        <h2 className="h5">{t("settings.fixed")}</h2>
        <p className="small text-secondary">{t("settings.fixedInfo")}</p>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="fixed-mode">{t("settings.mode")}</label>
            <input className="form-control" id="fixed-mode" value={saved.mode==="scrum"?"Scrum":"Kanban"} readOnly/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="fixed-product">{t("settings.product")}</label>
            <input className="form-control" id="fixed-product" value={saved.product} readOnly/></div>
        </div>
      </section>
      <section role="group" aria-label={t("settings.editable")}>
        <div className="row g-3">
          <div className={"col-md-6"+(tab!=="language"?" d-none":"")} id="settings-language" role="tabpanel" aria-labelledby="settings-tab-language"><label className="form-label" htmlFor="locale">{t("settings.locale")}</label>
            <select id="locale" aria-describedby="settings-locale-help" className="form-select" value={locale} disabled={busy} onChange={e=>{setLocale(e.target.value as "fr"|"en");setError("");setSuccess("");}}>
              <option value="fr">{t("settings.french")}</option><option value="en">{t("settings.english")}</option>
            </select>
            <p id="settings-locale-help" className="small text-secondary mt-1">{t("settings.localeInfo")}</p>
          </div>
          <div className={"col-md-6"+(tab!=="appearance"?" d-none":"")} id="settings-appearance" role="tabpanel" aria-labelledby="settings-tab-appearance"><label className="form-label" htmlFor="theme">{t("settings.theme")}</label>
            <select id="theme" aria-describedby="settings-theme-help" className="form-select" value={theme} disabled={busy} onChange={e=>{setTheme(e.target.value as "light"|"dark");setError("");setSuccess("");}}>
              <option value="light">{t("settings.light")}</option><option value="dark">{t("settings.dark")}</option>
            </select>
            <p id="settings-theme-help" className="small text-secondary mt-1">{t("settings.themeInfo")}</p>
          </div>
          <div className={"col-md-6"+(tab!=="appearance"?" d-none":"")}><label className="form-label" htmlFor="palette">{t("settings.palette")}</label>
            <select id="palette" aria-describedby="settings-palette-help" className="form-select" value={palette} disabled={busy}
              onChange={e=>{setPalette(e.target.value as Palette);setError("");setSuccess("");}}>
              <option value="ocean">{t("settings.paletteOcean")}</option>
              <option value="forest">{t("settings.paletteForest")}</option>
              <option value="violet">{t("settings.paletteViolet")}</option>
            </select>
            <p id="settings-palette-help" className="small text-secondary mt-1">{t("settings.paletteInfo")}</p>
          </div>
          <div className={"col-md-6"+(tab!=="general"?" d-none":"")}><label className="form-label" htmlFor="country">{t("settings.country")}</label>
            <select id="country" aria-describedby="settings-country-help" className="form-select" value={country} disabled={busy} onChange={e=>{setCountry(e.target.value);setError("");setSuccess("");}}>
              <option value="">{t("settings.countryEmpty")}</option>
              {saved.referenceCountry&&!countries.includes(saved.referenceCountry as typeof countries[number])&&
                <option value={saved.referenceCountry}>{t("settings.unknownCountry",{code:saved.referenceCountry})}</option>}
              {countries.map(c=><option key={c} value={c}>{t(`settings.countries.${c}`)}</option>)}
            </select>
            <p id="settings-country-help" className="small text-secondary mt-1">{t("settings.countryInfo")}</p>
          </div>
        </div>
      </section>
      <p className="small text-secondary mb-0">{t("settings.displayInfo")}</p>
      <div className="d-flex gap-2 flex-wrap">
        <button type="submit" className="btn btn-primary" disabled={busy||!dirty}>{t(busy?"settings.saving":"settings.save")}</button>
        <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={discardAndReload}>{t("settings.reload")}</button>
      </div>
      <p className="small text-secondary mb-0">{t("settings.revision",{revision:saved.revision,
        date:new Date(saved.updatedAt).toLocaleString(currentLocale==="en"?"en-GB":"fr-FR")})}</p>
    </form>}
    {!loaded&&<button type="button" className="btn btn-outline-primary" onClick={()=>void reload()} disabled={busy}>{t("settings.retryLoad")}</button>}
    {error&&<p id="settings-feedback" role="alert" className="alert alert-warning">{error}</p>}
    {success&&<p role="status" className="alert alert-success">{success}</p>}
  </div>;
}
