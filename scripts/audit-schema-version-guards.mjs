// SMN-327 — Inventaire reproductible, lecture seule, des dépendances de schéma.
// node scripts/audit-schema-version-guards.mjs [--summary] [--fail-on-api-guards]
import {readdir,readFile} from "node:fs/promises";
import {join,relative} from "node:path";
const root=join(process.cwd(),"src");
const findings=[];
const rules=[
 {id:"schema-version-sql",level:"high",regex:/\bschema_version\s*(?:<=|>=|=|<|>)\s*\d+|\bschema_version\s+IN\s*\(/i},
 {id:"version-bounds",level:"high",regex:/\b(?:schema|version|schemaVersion)\s*(?:<=|>=|===|==|<|>)\s*(?:2[7-9]|3\d)\b|\b(?:2[7-9]|3\d)\s*(?:<=|>=|===|==|<|>)\s*(?:schema|version|schemaVersion)\b/},
 {id:"version-list",level:"high",regex:/\[(?:\s*2[7-9]|\s*3\d)(?:\s*,\s*\d+)+\s*\]\.includes\(|\bschema_version\s+IN\s*\(/i},
 {id:"global-agile-mode",level:"review",regex:/\b(?:i|installation)\.mode\b|\blower\(i\.mode\)/i},
 {id:"team-mode-fallback",level:"review",regex:/\bagile_mode.{0,100}\bi\.mode\b/i}
];
async function scan(dir){
 const entries=(await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
 for(const entry of entries){
  const file=join(dir,entry.name);
  if(entry.isDirectory()){await scan(file);continue;}
  if(!/\.(?:ts|tsx|mjs)$/.test(entry.name))continue;
  const path=relative(process.cwd(),file).replaceAll("\\","/");
  const lines=(await readFile(file,"utf8")).split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   for(const rule of rules){
    if(rule.regex.test(lines[i]))findings.push({path,line:i+1,rule:rule.id,level:rule.level,
      scope:path.startsWith("src/app/api/")?"api":path.startsWith("src/server/")?"server":"other",
      source:lines[i].trim().slice(0,200)});
   }
  }
 }
}
await scan(root);
const totals=Object.fromEntries(rules.map(r=>[r.id,findings.filter(f=>f.rule===r.id).length]));
const files=[...new Set(findings.map(f=>f.path))];
const result={filesWithFindings:files.length,findings:findings.length,byRule:totals,
 apiGuards:findings.filter(f=>f.scope==="api"&&["schema-version-sql","version-bounds","version-list"].includes(f.rule)).length,
 matches:findings};
if(process.argv.includes("--summary"))console.log(JSON.stringify({...result,matches:undefined},null,2));
else console.log(JSON.stringify(result,null,2));
if(process.argv.includes("--fail-on-api-guards")&&result.apiGuards>0){
 console.error("Contrôles de version locaux dans les API : "+result.apiGuards);
 process.exitCode=1;
}
