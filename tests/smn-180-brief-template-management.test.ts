import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {validateBriefTemplate} from "../src/server/ai-briefs/templates";

const valid={title:"Bilan personnalisé",description:"Rapport",sections:["Contexte","Conclusions"],questions:["Que retenir ?"],instructions:["Ne rien inventer"],data:["cycle.name","risks"],depth:2};

test("un modèle nommé et ordonné est valide",()=>{
 assert.equal(validateBriefTemplate(valid),true);
 assert.equal(validateBriefTemplate({...valid,sections:[]}),false);
 assert.equal(validateBriefTemplate({...valid,depth:6}),false);
 assert.equal(validateBriefTemplate({...valid,title:" "}),false);
});
test("les données personnelles restent interdites côté serveur",()=>{
 assert.equal(validateBriefTemplate({...valid,data:["member.name"]}),false);
 assert.equal(validateBriefTemplate({...valid,data:["member.email"]}),false);
 assert.equal(validateBriefTemplate({...valid,data:["scrum.storyPoints.completed"]}),true);
});
test("les endpoints exigent une autorisation serveur et ne détruisent pas les modèles",()=>{
 const api=readFileSync("src/app/api/admin/ai-briefs/templates/route.ts","utf8");
 const manager=readFileSync("src/server/ai-briefs/templates.ts","utf8");
 assert.match(api,/authorizeApi\(req,"write",scope\)/);
 assert.match(manager,/active=\$2/);
 assert.doesNotMatch(manager,/DELETE FROM public\.smn_ai_brief_template/);
});
