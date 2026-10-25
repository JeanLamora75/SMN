/** Only explicit internal app paths can be used as a creation return destination. */
export function safeRegistryReturnPath(value:unknown):string|undefined{
 if(typeof value!=="string"||value.length>600||!value.startsWith("/app/")||
  value.startsWith("//")||/[\\\u0000-\u001f]/.test(value))return undefined;
 try{
  const url=new URL(value,"https://smn.invalid");
  if(url.origin!=="https://smn.invalid"||
   url.pathname==="/app/admin/registries/create")return undefined;
  return url.pathname+url.search+url.hash;
 }catch{return undefined;}
}
