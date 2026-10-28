import {findPdfChrome} from "./chrome-path";
import {validateFinalPdf} from "./pdf-archive-contract";
import {reportDocumentStyle} from "@/lib/report-document-style";
import {isReportBlock} from "@/lib/report-studio-blocks";
import type {ReportDocument} from "./report-documents";
import {reportLinksHtml,type ExportLink} from "@/lib/report-links-export";

const esc=(x:unknown)=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
export function studioDocumentHtml(doc:ReportDocument,reportLinks:ExportLink[]=[]){
 const c=(doc.content&&typeof doc.content==="object"&&!Array.isArray(doc.content)?doc.content:{}) as Record<string,unknown>,style=reportDocumentStyle(c.documentStyle);
 const sections=Array.isArray(c.sections)?c.sections as Array<{key:string;visible:boolean}>:[];
 const notes=(c.userNotes??{}) as Record<string,string>;
 const metrics=(c.metrics??{}) as Record<string,{value:number|null;unit:string}>;
 const blocks=Array.isArray(c.blocks)?c.blocks.filter(isReportBlock):[];
 const analyses=Array.isArray(c.analyses)?c.analyses as Array<{origin:string;scope:string;content:string}>:[];
 const breaks=(c.pageBreaks??{}) as Record<string,boolean>;
 const text=(s:unknown)=>esc(s).replace(/\n/g,"<br>");
 const rows=(key:string)=>blocks.filter(b=>b.sectionKey===key&&b.visible).map(b=>
   `<div class="block"><h3>${esc(b.title||b.kind)}</h3>${b.kind==="text"?`<p>${text(b.text)}</p>`:b.kind==="image"?
   "<p>Image externe non incorporée — vérifier avant diffusion.</p>":
   `<p>${esc(b.metricKey??"")} : ${esc(b.metricKey&&metrics[b.metricKey]?.value!==null&&metrics[b.metricKey]?.value!==undefined?metrics[b.metricKey].value+" "+metrics[b.metricKey].unit:"Non renseigné")}</p>`}</div>`).join("");
 const body=sections.filter(s=>s.visible).map(s=>`<section class="${breaks[s.key]?"pagebreak":""}">
  <h2>${esc(s.key)}</h2>${s.key==="indicators"?Object.entries(metrics).map(([k,v])=>`<p>${esc(k)} : ${v.value===null?"Non renseigné":esc(v.value+" "+v.unit)}</p>`).join(""):""}
  <p>${text(notes[s.key]??"")}</p>${rows(s.key)}</section>`).join("");
 return `<!doctype html><html lang="${esc(doc.language)}"><head><meta charset="utf-8">
 <style>@page{size:A4 ${style.orientation};margin:14mm 12mm}
 body{font:11pt/1.45 Arial,sans-serif;color:#172e49;background:#fff}h1{font-size:24pt}h2{font-size:16pt;border-bottom:1px solid #d8e2ed}
 section{margin:12mm 0}p{overflow-wrap:anywhere;white-space:normal;orphans:3;widows:3}
 .block{break-inside:avoid-page;margin:8mm 0}table thead{display:table-header-group}tr{break-inside:avoid}
 .pagebreak{break-before:page}.cover{break-after:page}img{max-width:100%;height:auto}</style></head><body>
 ${style.cover?`<header class="cover"><h1>${esc(style.coverTitle||doc.title)}</h1><p>${esc(style.subtitle)}</p></header>`:""}
 <h1>${esc(doc.title)}</h1>
 ${style.toc?`<nav><h2>Sommaire</h2><ol>${sections.filter(s=>s.visible).map(s=>`<li>${esc(s.key)}</li>`).join("")}</ol></nav>`:""}
 ${body}
 ${reportLinksHtml(reportLinks)}
 ${analyses.map(a=>`<section><h2>${esc(a.scope)}</h2><p>Origine : ${esc(a.origin)}</p><p>${text(a.content)}</p></section>`).join("")}
 <footer>${esc(style.footerText)}</footer></body></html>`;
}
export async function renderStudioPdf(doc:ReportDocument,reportLinks:ExportLink[]=[]):Promise<Buffer>{
 const executablePath=await findPdfChrome();if(!executablePath)throw Error("pdf-browser-unavailable");
 const moduleName="puppeteer-core";const puppeteer=(await import(moduleName)).default;
 const browser=await puppeteer.launch({executablePath,headless:true,args:["--no-first-run","--no-default-browser-check"]});
 try{const page=await browser.newPage();
  try{await page.setRequestInterception(true);page.on("request",(request:{abort:()=>void})=>request.abort());
   await page.setContent(studioDocumentHtml(doc,reportLinks),{waitUntil:"load"});
   const bytes=Buffer.from(await page.pdf({format:"A4",preferCSSPageSize:true,printBackground:true,timeout:20000}));
   if(!validateFinalPdf(bytes))throw Error("pdf-invalid");
   return bytes;
  }finally{await page.close();}
 }finally{await browser.close();}
}
