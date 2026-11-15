import {readdir,readFile,lstat} from "node:fs/promises";
import path from "node:path";

export const REQUIRED_HELP_ARTICLES=Object.freeze([
 "backup","calendar","dashboard","faq","general-settings","indicators","jira-settings",
 "kanban-periods","links","members","overview","registries","reports","sprints","teams","tickets"
]);
export const REQUIRED_HELP_LOCALES=Object.freeze(["fr","en"]);
const ARTICLE=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export async function verifyOfflineHelp(root){
 const expected=REQUIRED_HELP_ARTICLES;
 for(const locale of REQUIRED_HELP_LOCALES){
  const directory=path.join(root,locale);
  const files=(await readdir(directory)).filter(name=>name.endsWith(".md")).sort();
  const expectedFiles=expected.map(id=>id+".md").sort();
  if(JSON.stringify(files)!==JSON.stringify(expectedFiles))
   throw Error("help-package-article-coverage-invalid:"+locale);
  const indexPath=path.join(root,".index",locale+".json");
  const index=JSON.parse(await readFile(indexPath,"utf8"));
  if(index?.version!==1||index?.locale!==locale||!Array.isArray(index.articles)||
   JSON.stringify(index.articles.map(x=>x.id).sort())!==JSON.stringify([...expected].sort()))
   throw Error("help-package-index-coverage-invalid:"+locale);
  for(const id of expected){
   if(!ARTICLE.test(id))throw Error("help-package-id-invalid");
   const file=path.join(directory,id+".md");
   const fileStat=await lstat(file);
   if(!fileStat.isFile()||fileStat.isSymbolicLink()||fileStat.size<50)
    throw Error("help-package-article-missing-or-unsafe:"+locale+"/"+id);
   const content=await readFile(file,"utf8");
   const title=content.match(/^#\s+([^\n\r]+)/m)?.[1]?.trim();
   if(!title)throw Error("help-package-title-missing:"+locale+"/"+id);
   const normalized=content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/,"")
    .replace(/\]\([^)]+\)/g,"]").replace(/<[^>]*>/g," ")
    .replace(/[#*_\x60>]/g," ").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLocaleLowerCase("und").replace(/[^\p{L}\p{N}]+/gu," ")
    .trim().replace(/\s+/g," ");
   const entry=index.articles.find(x=>x.id===id);
   if(entry?.title!==title||entry.searchText!==normalized)
    throw Error("help-package-index-stale:"+locale+"/"+id);
  }
 }
 return {locales:[...REQUIRED_HELP_LOCALES],articleCount:expected.length};
}
