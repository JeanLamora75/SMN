/** Produit un assemblage documentaire v33, sans écriture PostgreSQL. */
import {existsSync,readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {createHash} from "node:crypto";
import {NATIVE_V32_FILE,nativeBaselineSql} from "../src/server/installation/native-v32";
import {indicatorV33Sql} from "../src/server/installation/indicator-v33-contract";
export const V33_CANDIDATE="prisma/baseline/v33/schema-candidate.sql";
export function baselineCandidate(){
 const v32=nativeBaselineSql();
 if(!v32||!existsSync(NATIVE_V32_FILE()))throw Error("Baseline v32 non validée ou absente");
 const ddl=indicatorV33Sql();
 if(!ddl.includes("CREATE TABLE public.smn_indicator_definition"))throw Error("DDL indicateurs v33 absent");
 // Bundle de schéma, PAS une baseline native directement installable sans contrat d'initialisation.
 return v32+"\n-- SMN-338 : extension additive v33, candidate non activée.\n"+ddl+"\n";
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--generate")throw Error("Usage: pnpm exec tsx scripts/build-smn-338-v33-baseline-candidate.ts --generate");
 const sql=baselineCandidate(),to=resolve(V33_CANDIDATE);
 mkdirSync(dirname(to),{recursive:true});
 if(existsSync(to)&&readFileSync(to,"utf8")!==sql)throw Error("Candidate existante divergente : refus de remplacement implicite");
 if(!existsSync(to))writeFileSync(to,sql,{encoding:"utf8",flag:"wx"});
 console.log(JSON.stringify({path:V33_CANDIDATE,sha256:createHash("sha256").update(sql).digest("hex"),nativeInstallationEnabled:false},null,2));
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/build-smn-338-v33-baseline-candidate.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
