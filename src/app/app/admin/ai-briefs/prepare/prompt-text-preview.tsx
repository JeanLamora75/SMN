"use client";
import {useState} from "react";
import type {PromptRenderResult} from "@/lib/ai-brief-prompt-render";
import {useTranslation} from "@/i18n/client";

export default function PromptTextPreview({result,source,locale,cycleStatus}:{
 result:PromptRenderResult|null;source:string;locale:"fr"|"en";cycleStatus:string
}){
 const t=useTranslation();
 const tr=(key:string)=>t(("briefPromptEditor."+key) as Parameters<typeof t>[0]);
 const [copied,setCopied]=useState(false);
 const [copyFailed,setCopyFailed]=useState(false);
 const ready=!!result?.complete;
 return <section className="border rounded-3 p-3 d-grid gap-3" aria-labelledby="brief-resolved-prompt-title">
  <div>
   <h4 id="brief-resolved-prompt-title" className="h6 mb-1">{tr("resolvedTitle")}</h4>
   <p className="small text-secondary mb-0">{tr("resolvedHint")}</p>
  </div>
  {cycleStatus!=="closed"&&<p role="status" className="alert alert-warning mb-0">{tr("provisionalCycle")}</p>}
  {!result&&<p role="alert" className="alert alert-danger mb-0">{tr("resolverUnavailable")}</p>}
  {result&&result.diagnostics.length>0&&<div role="alert" className="alert alert-warning mb-0">
   <strong>{tr("unresolvedTags")}</strong>
   <ul className="mb-0 mt-2">{result.diagnostics.map((d,i)=><li key={i}><code>{d.tag||"…"}</code> — {d.message}</li>)}</ul>
  </div>}
  {result&&<div className="smn-brief-source-preview" aria-label={tr("resolvedTitle")}>
   <pre className="mb-0">{result.text}</pre>
  </div>}
  {!result&&<pre className="smn-brief-source-preview">{source}</pre>}
  <div className="d-flex gap-2 align-items-center flex-wrap">
   <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!ready}
    onClick={async()=>{
     if(!result?.complete)return;
     try{await navigator.clipboard.writeText(result.text);setCopied(true);setCopyFailed(false);}
     catch{setCopied(false);setCopyFailed(true);}
    }}>{tr("copyResolved")}</button>
   {!ready&&<span className="small text-secondary">{tr("copyBlocked")}</span>}
  </div>
  {copied&&<p className="text-success small mb-0" role="status">{tr("copied")}</p>}
  {copyFailed&&<p className="text-danger small mb-0" role="alert">{tr("copyFailed")}</p>}
  <p className="small text-secondary mb-0">{tr("notFinalized")}</p>
 </section>;
}
