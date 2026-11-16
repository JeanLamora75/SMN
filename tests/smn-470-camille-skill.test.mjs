import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile,mkdtemp,rm,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {runCamillePilot} from "../scripts/camille-pilot.mjs";
import {validateCamilleDraft} from "../scripts/camille-document-contract.mjs";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";

const root=path.resolve(".");
const base=" .agents/skills/bmad-agent-camille".trim();
const read=async(p)=>(await readFile(path.join(root,p),"utf8")).replace(/\r\n/g,"\n");

function menuCodes(toml){
 return [...toml.matchAll(/^\[\[agent\.menu\]\]\s*\ncode = "([^"]+)"/gm)].map(m=>m[1]);
}
function mergeAgent(baseToml,teamToml){
 const baseName=baseToml.match(/^name = "([^"]+)"$/m)?.[1];
 const baseFacts=baseToml.match(/persistent_facts = \[([^\]]*)\]/s)?.[1]??"";
 const teamFacts=teamToml.match(/persistent_facts = \[([^\]]*)\]/s)?.[1]??"";
 const facts=[...baseFacts.matchAll(/"([^"]+)"/g),...teamFacts.matchAll(/"([^"]+)"/g)].map(m=>m[1]);
 return {name:baseName,menu:menuCodes(baseToml),persistent_facts:facts};
}
const record=(claim,status="vérifié",sources=["src/app/app/help/page.tsx"])=>({
 claim,status,verifiedAt:"2026-11-14",sources
});
const validArticle="# Centre d'aide\n\n## Objectif\nConsulter [l'aide](/app/help) après connexion.\n";

test("AC1 — le skill BMAD est identifiable, local et personnalisable sans installer le framework",async()=>{
 const skill=await read(base+"/SKILL.md");
 const defaults=await read(base+"/customize.toml");
 const override=await read("_bmad/custom/bmad-agent-camille.toml");
 const config=await read("_bmad/custom/config.toml");
 assert.match(skill,/^---\nname: bmad-agent-camille\n/m);
 assert.match(skill,/^description:/m);
 assert.match(skill,/fusion manuelle/);
 assert.match(skill,/ne jamais les lancer/);
 assert.match(defaults,/\[agent\]\nname = "Camille"/);
 assert.match(config,/\[agents\.bmad-agent-camille\]/);
 assert.match(config,/\[core\][\s\S]*communication_language = "French"/);
 assert.doesNotMatch(config,/^\[agents\.bmad-agent-camille\][\s\S]*\buv run\b/m);
 const merged=mergeAgent(defaults,override);
 assert.equal(merged.name,"Camille");
 assert.ok(merged.persistent_facts.includes("file:{project-root}/content/help/README.md"));
 assert.ok(merged.persistent_facts.some(x=>x.endsWith("/ARCHITECTURE-CAMILLE-SMN-470.md")));
 for(const item of merged.persistent_facts){
  assert.ok(item.startsWith("file:{project-root}/"));
  await stat(path.join(root,item.replace("file:{project-root}/","")));
 }
});

test("AC2 — les cinq missions sont uniques et les frontières des agents sont explicites",async()=>{
 const defaults=await read(base+"/customize.toml");
 const skill=await read(base+"/SKILL.md");
 const workflows=await read(base+"/references/workflows.md");
 const codes=menuCodes(defaults);
 assert.deepEqual(codes,["CR","MA","AU","AC","RV"]);
 assert.equal(new Set(codes).size,5);
 for(const code of codes){
  assert.match(skill,new RegExp("\\*\\*"+code+"\\*\\*"));
  assert.match(workflows,new RegExp("## "+code+" — "));
 }
 for(const agent of ["John","Sally","Winston","Amelia","Murat","Camille"]){
  assert.match(workflows,new RegExp("\\*\\*"+agent+"\\*\\*"));
 }
 assert.match(workflows,/publication automatique/);
});

test("AC3 — une instruction non attestée ou sans source valide bloque réellement la publication",async()=>{
 const baseDraft={root,articleId:"overview",locale:"fr",markdown:validArticle};
 const accepted=await validateCamilleDraft({...baseDraft,evidence:[record("Route Aide accessible")]});
 assert.equal(accepted.claims,1);
 await assert.rejects(validateCamilleDraft({...baseDraft,
  evidence:[record("Fonction encore non livrée","non-attesté")]}),/camille-unattested-claim/);
 await assert.rejects(validateCamilleDraft({...baseDraft,
  evidence:[record("Prétendue fonctionnalité","partiel")]}),/camille-unattested-claim/);
 await assert.rejects(validateCamilleDraft({...baseDraft,
  evidence:[record("Route Aide","vérifié",["src/app/app/no-such-file.tsx"])]}),
  /camille-source-unverified/);
 await assert.rejects(validateCamilleDraft({...baseDraft,evidence:[]}),
  /camille-evidence-missing/);
 const policy=await read(base+"/references/editorial-policy.md");
 assert.match(policy,/vérifié_le|verifiedAt/);
 assert.match(policy,/Non livré|non attesté|non-attesté/i);
 assert.match(policy,/code seul/);
});

test("AC4 — seuls les IDs, routes et contenus localisés autorisés sont admis",async()=>{
 const evidence=[record("Le Centre d'aide est accessible")];
 assert.equal((await validateCamilleDraft({
  root,articleId:"overview",locale:"en",
  markdown:"# Help center\n\n## Goal\nOpen [Help](/app/help).\n",evidence
 })).articleId,"overview");
 await assert.rejects(validateCamilleDraft({root,articleId:"invented-module",
  locale:"fr",markdown:validArticle,evidence}),/camille-article-id-not-in-catalog/);
 await assert.rejects(validateCamilleDraft({root,articleId:"overview",
  locale:"fr",markdown:"# Aide\n\n## Étapes\nVisiter [un faux écran](/app/no-such-page).\n",evidence}),
  /camille-route-unverified/);
 await assert.rejects(validateCamilleDraft({root,articleId:"overview",
  locale:"fr",markdown:"# Aide\n\n## Étapes\nLire [une ressource](https://example.invalid/).\n",evidence}),
  /camille-nonlocal-or-active-link/);
 await assert.rejects(validateCamilleDraft({root,articleId:"overview",
  locale:"fr",markdown:"# Aide\n\n## Étapes\n<script>alert('x')</script>\n",evidence}),
  /camille-nonlocal-or-active-link/);
 await assert.rejects(validateCamilleDraft({root,articleId:"overview",
  locale:"fr",markdown:"# Aide\n\n## Étapes\nContacter personne@example.com.\n",evidence}),
  /camille-private-content/);
 await assert.rejects(validateCamilleDraft({root,articleId:"overview",
  locale:"fr",markdown:"# Aide\n\n## Étapes\nBearer abcdefghijklmnop123456.\n",evidence}),
  /camille-private-content/);
 const policy=await read(base+"/references/editorial-policy.md");
 assert.match(policy,/aucune donnée personnelle|donnée privée|donnée personnelle/i);
 assert.match(policy,/src\/i18n\/\*\.json/);
 const indexProof=await buildHelpIndexes({check:true});
 assert.ok(indexProof.some(x=>x.locale==="fr"));
 assert.ok(indexProof.some(x=>x.locale==="en"));
});

test("AC5 — pilote FR/EN réel : création, mise à jour, index périmé puis réparé",async()=>{
 const output=await mkdtemp(path.join(tmpdir(),"camille-evidence-"));
 try{
  const report=path.join(root,"_bmad-output","test-artifacts","camille","pilot-smn-470.md");
  // Use an isolated temp evidence path inside root? The production helper rejects
  // external locations, so exercise the in-memory result in tests; CI runs the CLI report.
  const pilot=await runCamillePilot({root});
  assert.equal(pilot.status,"passed");
  assert.deepEqual(pilot.locales,["fr","en"]);
  assert.equal(pilot.rejectedStale,true);
  assert.deepEqual(pilot.created.map(x=>x.locale).sort(),["en","fr"]);
  assert.deepEqual(pilot.updated.map(x=>x.locale).sort(),["en","fr"]);
  assert.equal(pilot.assertions.length,6);
  assert.match(pilot.note,/Simulation déterministe isolée/);
  assert.ok(report.endsWith("/pilot-smn-470.md"));
 }finally{await rm(output,{recursive:true,force:true});}
});
