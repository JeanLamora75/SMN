import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {composeBriefTxt} from "../src/lib/ai-brief-txt";

const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
const context={id:"cycle",name:"Sprint",team:"Equipe",product:"Produit",status:"active",startAt:"2026-10-01",endAt:"2026-10-14",timeZone:"Europe/Paris"};
const template={title:"Bilan",revision:1,sections:["Faits chiffrés","Observations humaines","Questions","Consignes"],questions:[],instructions:[],data:["scrum.storyPoints.completed"],depth:1};

test("observations are separated from sourced metrics and requests are not AI results",()=>{
 const txt=composeBriefTxt({context,mode:"scrum",preparedAt:"2026-10-25",template:{...template,questions:["Pourquoi ?"],instructions:["Ne pas extrapoler"]},observations:["Une difficulté collective"],facts:{"scrum.storyPoints.completed":{key:"scrum.storyPoints.completed",label:"Terminés",value:"3",unit:"SP",source:"current",quality:"provisional",snapshotVersion:null}}});
 assert.ok(txt.indexOf("OBSERVATIONS HUMAINES")>txt.indexOf("FAITS CHIFFRÉS"));
 assert.match(txt,/Une difficulté collective/);
 assert.match(txt,/QUESTIONS/);assert.match(txt,/CONSIGNES/);
 assert.doesNotMatch(txt,/RÉPONSE DE L.IA|RÉSULTAT DE L.IA/);
});
test("empty free-text inputs never produce a fictional observation",()=>{
 const txt=composeBriefTxt({context,mode:"scrum",preparedAt:"2026-10-25",template,facts:{},observations:[]});
 assert.doesNotMatch(txt,/hypothèse automatique|conclusion automatique/i);
});
test("free text is local and privacy acknowledgement is reset after edits",()=>{
 assert.match(ui,/useState\(" "\)|useState\(" "\)|setObservations/);
 assert.match(ui,/setPrivacyReviewed\(false\)/);
 assert.match(ui,/Confidentialité non vérifiée/);
 assert.match(ui,/observations:lines\(observations\)/);
});
