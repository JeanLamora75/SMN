/** Render only validated http(s) references, keeping stored order. */
export type ExportLink={title:string;url:string};
export function safeExportLinks(values:unknown):ExportLink[]{
 if(!Array.isArray(values))return [];
 return values.filter((v):v is ExportLink=>{
  if(!v||typeof v!=="object")return false;
  const x=v as Record<string,unknown>;
  if(typeof x.title!=="string"||typeof x.url!=="string"||x.title.length>200)return false;
  try{const u=new URL(x.url);return ["https:","http:"].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}
 });
}
export function reportLinksMarkdown(values:unknown):string{
 const links=safeExportLinks(values);
 if(!links.length)return "";
 return "## Liens et références\n\n"+links.map(x=>"- ["+x.title.replace(/[\\[\\]]/g,"\\$&")+"]("+encodeURI(x.url).replace(/\\(/g,"%28").replace(/\\)/g,"%29")+")").join("\n")+"\n";
}
export function reportLinksHtml(values:unknown):string{
 const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
 const links=safeExportLinks(values);
 if(!links.length)return "";
 return '<section><h2>Liens et références</h2><ul>'+links.map(x=>'<li><a href="'+escape(x.url)+'">'+escape(x.title)+'</a></li>').join("")+"</ul></section>";
}
