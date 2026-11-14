import {readdir,readFile,mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../content/help");
const LOCALE=/^[a-z]{2,3}(?:-[a-z]{2})?$/;
const ARTICLE=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\.md$/;
export function normalizeSearch(value){
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLocaleLowerCase("und").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
export function indexedText(source){
 // Remove Markdown markup. Do not index links' destinations or inline HTML tags.
 return source.replace(/^---\s*\n[\s\S]*?\n---\s*\n/,"")
  .replace(/\]\([^)]+\)/g,"]")
  .replace(/<[^>]*>/g," ")
  .replace(/[#*_`>]/g," ");
}
export async function buildHelpIndexes({check=false,base=root}={}){
 const target=path.join(base,".index");
 const children=await readdir(base,{withFileTypes:true});
 const locales=children.filter(x=>x.isDirectory()&&LOCALE.test(x.name))
  .map(x=>x.name).sort();
 if(!locales.includes("fr")||!locales.includes("en"))
  throw Error("help-index-required-locales-missing");
 if(!check)await mkdir(target,{recursive:true});
 const generated=[];
 for(const locale of locales){
  const directory=path.join(base,locale);
  const files=(await readdir(directory)).filter(x=>ARTICLE.test(x)).sort();
  const rows=[];
  for(const file of files){
   const markdown=await readFile(path.join(directory,file),"utf8");
   const title=markdown.match(/^#\s+([^\n\r]+)/m)?.[1]?.trim();
   if(!title)throw Error("help-index-title-missing:"+locale+"/"+file);
   rows.push({id:file.slice(0,-3),title,searchText:normalizeSearch(indexedText(markdown))});
  }
  const output=JSON.stringify({version:1,locale,articles:rows})+"\n";
  const file=path.join(target,locale+".json");
  if(check){
   const actual=await readFile(file,"utf8").catch(()=>null);
   if(actual!==output)throw Error("help-index-stale:"+locale);
  }else await writeFile(file,output,"utf8");
  generated.push({locale,articles:rows.length});
 }
 if(check){
  const existing=(await readdir(target)).filter(x=>x.endsWith(".json")).sort();
  const expected=locales.map(x=>x+".json");
  if(JSON.stringify(existing)!==JSON.stringify(expected))
   throw Error("help-index-extra-or-missing-locale");
 }
 return generated;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 void buildHelpIndexes({check:process.argv.includes("--check")}).then(generated=>{
  process.stdout.write("Help indexes "+(process.argv.includes("--check")?"verified":"generated")+": "+JSON.stringify(generated)+"\n");
 }).catch(error=>{process.stderr.write(String(error)+"\n");process.exitCode=1;});
}
