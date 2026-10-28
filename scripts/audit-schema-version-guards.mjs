// Inventory schema guards without rewriting intentional legacy fences.
// Run: node scripts/audit-schema-version-guards.mjs
import {readdir,readFile} from "node:fs/promises";
import {join,relative} from "node:path";
const root=join(process.cwd(),"src");
const matches=[];
async function scan(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=join(dir,entry.name);
  if(entry.isDirectory()){await scan(file);continue;}
  if(!/\.(?:ts|tsx|mjs)$/.test(entry.name))continue;
  const lines=(await readFile(file,"utf8")).split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   const line=lines[i];
   if(/schema_version\s*(?:=|<|>|!)=?\s*(?:2[789]|30)|schema_version\s*<=\s*27|schema\s*===?\s*28|version\s*===?\s*28|\[28,29,30\]|schema_version\s+IN\s*\(/i.test(line))
    matches.push({file:relative(process.cwd(),file),line:i+1,source:line.trim().slice(0,180)});
  }
 }
}
await scan(root);
console.log(JSON.stringify({count:matches.length,matches},null,2));
console.error("Manual review required: <=27 legacy write guards must not be widened automatically.");
