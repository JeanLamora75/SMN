/** Safe, link-only Jira integration. Never contacts Jira remotely. */
export function normalizeJiraBaseUrl(raw:string):string|null{
 if(typeof raw!=="string"||raw.length>2048||raw.trim()!==raw)return null;
 if(!raw)return null;
 try{
  const url=new URL(raw);
  if(url.protocol!=="https:"||!url.hostname||url.username||url.password||
   url.search||url.hash||url.port&&url.port!=="443")return null;
  if(url.hostname.endsWith(".")||url.hostname.includes(".."))return null;
  if(!/^[a-z0-9.-]+$/i.test(url.hostname))return null;
  const path=url.pathname.replace(/\/+$/,"");
  if(/\/(browse|secure|rest\/api)(?:\/|$)/i.test(path))return null;
  if(url.pathname.includes("%")||/\/{2,}/.test(path)||path.split("/").some(x=>x==="."||x===".."))return null;
  return url.origin+path;
 }catch{return null;}
}
export function jiraTicketUrl(base:string|null|undefined,jiraId:string):string|null{
 const normalized=base?normalizeJiraBaseUrl(base):null;
 if(!normalized||typeof jiraId!=="string"||jiraId.length>160)return null;
 if(jiraId.trim()!==jiraId)return null;
 const key=jiraId;
 if(!/^[\p{L}\p{N}][\p{L}\p{N}._-]{0,159}$/u.test(key))return null;
 return normalized+"/browse/"+encodeURIComponent(key);
}
