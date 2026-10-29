/** Lot A: exhaustive, read-only inventory of runtime SQL schema mutations. */
import {execFileSync} from "node:child_process";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";

const names=execFileSync("git",["ls-files","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
const candidates=names.filter(p=>/\.(?:ts|tsx|js|mjs|cjs|sql)$/.test(p));
const tokens=/\b(?:CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|VIEW|FUNCTION|TRIGGER|TYPE|SCHEMA)|ALTER\s+(?:TABLE|TYPE|SCHEMA)|DROP\s+(?:TABLE|INDEX|VIEW|FUNCTION|TRIGGER|TYPE|SCHEMA)|TRUNCATE\s+TABLE)\b/gi;
const found: Array<{path:string;line:number;operation:string;context:string;classification:string}>=[];
for(const path of candidates){
 const source=readFileSync(path,"utf8");
 for(const hit of source.matchAll(tokens)){
  const pos=hit.index??0;
  const line=source.slice(0,pos).split("\n").length;
  const before=source.slice(Math.max(0,pos-120),pos);
  const after=source.slice(pos,Math.min(source.length,pos+160));
  const context=(before+after).replace(/\s+/g," ").trim();
  const classification=path.startsWith("prisma/migrations/")?"versioned migration":
   path.startsWith("tests/")?"test":path.startsWith("scripts/")?"script":
   path.startsWith("src/")?"application runtime / verify actual execution":"other";
  found.push({path,line,operation:hit[0].replace(/\s+/g," ").toUpperCase(),context,classification});
 }
}
const summary=Object.entries(found.reduce<Record<string,number>>((x,r)=>{x[r.classification]=(x[r.classification]??0)+1;return x;},{}));
const md=[
 "# Lot A — Inventaire SQL DDL (lecture seule)",
 "",
 "Fichiers suivis Git inspectés : "+names.length,
 "Fichiers texte éligibles : "+candidates.length,
 "Occurrences potentielles : "+found.length,
 "",
 "Recherche lexicale exhaustive dans les extensions sélectionnées ; les résultats peuvent inclure des chaînes de test, des commentaires et des faux positifs. Les DDL construits dynamiquement ne sont pas garantis détectés.",
 "",
 ...summary.map(([k,v])=>"- "+k+": "+v),
 "",
 "| Fichier | Ligne | Motif | Classe |",
 "|---|---:|---|---|",
 ...found.map(x=>`| \`${x.path}\` | ${x.line} | ${x.operation} | ${x.classification} |`),
 "",
 "Ne pas exécuter de migration depuis cet inventaire. Valider chaque DDL métier avant extraction vers une migration contrôlée."
].join("\n");
const path="audit-output/schema-v32-ddl-inventory.md";
mkdirSync(dirname(path),{recursive:true});
writeFileSync(path,md);
writeFileSync("audit-output/schema-v32-ddl-inventory.json",JSON.stringify({files:names.length,scanned:candidates.length,found},null,2));
console.log(`Lot A: ${candidates.length} fichiers inspectés ; ${found.length} occurrences trouvées. Résultats: audit-output/`);
