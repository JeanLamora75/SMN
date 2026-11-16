import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {validatePromptTemplate} from "../src/server/ai-briefs/templates";

const valid={title:"Bilan personnalisé",description:"Rapport",promptText:"Prépare le bilan de {{SPRINT_NAME}}"};
test("un modèle exige seulement un titre et un prompt libre",()=>{
 assert.equal(validatePromptTemplate(valid),true);
 assert.equal(validatePromptTemplate({...valid,title:" "}),false);
 assert.equal(validatePromptTemplate({...valid,promptText:" "}),false);
 assert.equal(validatePromptTemplate({...valid,description:undefined}),true);
 assert.equal(validatePromptTemplate({...valid,promptText:"x".repeat(100001)}),false);
});
test("l'API est autorisée et les modèles restent révisables, jamais supprimés",()=>{
 const api=readFileSync("src/app/api/admin/ai-briefs/templates/route.ts","utf8");
 const manager=readFileSync("src/server/ai-briefs/templates.ts","utf8");
 assert.match(api,/authorizeApi\(req,"write",scope\)/);
 assert.match(manager,/revision=revision\+1/);
 assert.doesNotMatch(manager,/DELETE FROM public\.smn_ai_brief_template/);
 assert.match(manager,/prompt_text/);
});
