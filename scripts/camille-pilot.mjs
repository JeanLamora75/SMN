import {mkdtemp,mkdir,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildHelpIndexes} from "./build-help-index.mjs";
import {validateCamilleDraft} from "./camille-document-contract.mjs";

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

/**
 * Smoke test of the documentation publication contract.
 * This is a deterministic isolated fixture, not an AI writing engine or an actual
 * invocation of Camille. Real editorial review still requires source verification.
 */
export async function runCamillePilot({root=projectRoot,evidenceFile}={}){
 const catalog=await readFile(path.join(root,"src/lib/help-catalog.ts"),"utf8");
 const center=await readFile(path.join(root,"src/app/app/help/page.tsx"),"utf8");
 const checklist=await readFile(path.join(root,"src/app/app/help/help-setup-checklist.tsx"),"utf8");
 if(!/\bid:"overview",section:"getting-started"/.test(catalog)||
    !center.includes("HelpSetupChecklist")||
    !checklist.includes("window.localStorage.setItem"))
  throw Error("camille-pilot-source-unverified");
 const directory=await mkdtemp(path.join(tmpdir(),"smn-camille-pilot-"));
 const created={
  fr:"# Présentation SMN\n\n## Objectif\nConsulter le Centre d'aide de SMN.\n\n## Prérequis\nÊtre connecté à SMN.\n\n## Étapes\n1. Ouvrir [le Centre d'aide](/app/help).\n2. Consulter le parcours de configuration.\n",
  en:"# Getting started with SMN\n\n## Goal\nConsult the SMN Help center.\n\n## Prerequisites\nBe signed in to SMN.\n\n## Steps\n1. Open the [Help center](/app/help).\n2. Review the setup journey.\n"
 };
 const appended={
  fr:"\n## Suivi\nLa checklist de configuration enregistre les étapes déclarées dans le navigateur local, sans synchronisation avec PostgreSQL.\n",
  en:"\n## Progress\nThe setup checklist keeps self-declared steps in local browser storage and does not synchronize them to PostgreSQL.\n"
 };
 let evidence;
 try{
  for(const locale of ["fr","en"]){
   await mkdir(path.join(directory,locale),{recursive:true});
   await writeFile(path.join(directory,locale,"overview.md"),created[locale],"utf8");
  }
  const verifiedAt=new Date().toISOString().slice(0,10);
  for(const locale of ["fr","en"]){
   await validateCamilleDraft({
    root,articleId:"overview",locale,markdown:created[locale],
    evidence:[{claim:"Le Centre d'aide est accessible en tant que page SMN",
     status:"vérifié",verifiedAt,
     sources:["src/lib/help-catalog.ts","src/app/app/help/page.tsx"]}]
   });
  }
  const initial=await buildHelpIndexes({base:directory});
  await buildHelpIndexes({base:directory,check:true});
  for(const locale of ["fr","en"]){
   const target=path.join(directory,locale,"overview.md");
   const original=await readFile(target,"utf8");
   if(original!==created[locale])throw Error("camille-pilot-unexpected-created-draft");
   const updatedDraft=original+appended[locale];
   await validateCamilleDraft({
    root,articleId:"overview",locale,markdown:updatedDraft,
    evidence:[{claim:"La checklist utilise localStorage",
     status:"vérifié",verifiedAt,
     sources:["src/app/app/help/help-setup-checklist.tsx"]}]
   });
   await writeFile(target,updatedDraft,"utf8");
   if((await readFile(target,"utf8"))===original)throw Error("camille-pilot-no-change");
  }
  let rejectedStale=false;
  try{await buildHelpIndexes({base:directory,check:true});}
  catch(error){
   if(!String(error).includes("help-index-stale:"))throw error;
   rejectedStale=true;
  }
  if(!rejectedStale)throw Error("camille-pilot-stale-index-not-rejected");
  const updated=await buildHelpIndexes({base:directory});
  await buildHelpIndexes({base:directory,check:true});
  const indexes={};
  for(const locale of ["fr","en"]){
   const index=JSON.parse(await readFile(path.join(directory,".index",locale+".json"),"utf8"));
   if(index.articles.length!==1||index.articles[0].id!=="overview"||
      !index.articles[0].searchText.includes(locale==="fr"?"navigateur local":"local browser"))
    throw Error("camille-pilot-updated-index-missing:"+locale);
   indexes[locale]=index.articles[0].title;
  }
  evidence={status:"passed",articleId:"overview",locales:["fr","en"],
    sourcePaths:["src/lib/help-catalog.ts","src/app/app/help/page.tsx","src/app/app/help/help-setup-checklist.tsx"],
    created:initial,updated,rejectedStale,indexes,
    assertions:["source-code-verified","initial-drafts-created","initial-index-valid",
      "fr-en-targeted-update","stale-index-rejected","regenerated-index-valid"],
    note:"Simulation déterministe isolée : ne démontre pas l'activation conversationnelle de Camille."};
  if(evidenceFile){
   const target=path.resolve(evidenceFile);
   if(!target.startsWith(root+path.sep))throw Error("camille-pilot-evidence-outside-project");
   await mkdir(path.dirname(target),{recursive:true});
   await writeFile(target,[
    "# Camille — Rapport de pilote technique SMN-470",
    "",
    "**Statut :** tests déterministes effectués par Node ; activation conversationnelle non attestée.",
    "",
    "**Sources inspectées :** "+evidence.sourcePaths.map(s=>"\`"+s+"\`").join(", ")+".",
    "",
    "**Article canonique :** \`overview\` ; **langues :** FR et EN.",
    "",
    "- Création des deux brouillons dans un répertoire temporaire : vérifiée.",
    "- Index initial généré et contrôlé : vérifié.",
    "- Ajout ciblé de la mention de stockage navigateur dans les deux langues : vérifié.",
    "- Refus de l'index périmé avant régénération : vérifié.",
    "- Index régénérés après modification : vérifié.",
    "- Absence de modification des vrais articles ou de PostgreSQL : aucun accès d'écriture au runtime par le pilote.",
    "",
    "**Détail machine :**",
    "",
    "\`\`\`json",JSON.stringify(evidence,null,2),"\`\`\`",""
   ].join("\n"),"utf8");
  }
  return evidence;
 }finally{
  await rm(directory,{recursive:true,force:true});
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=process.argv.indexOf("--evidence");
 const evidenceFile=index<0?undefined:process.argv[index+1];
 if(index>=0&&!evidenceFile)throw Error("camille-pilot-evidence-path-required");
 void runCamillePilot({evidenceFile}).then(result=>
  process.stdout.write(JSON.stringify(result)+"\n")
 ).catch(error=>{process.stderr.write(String(error)+"\n");process.exitCode=1;});
}
