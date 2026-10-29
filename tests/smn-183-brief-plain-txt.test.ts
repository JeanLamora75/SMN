import assert from "node:assert/strict";
import {test} from "node:test";
import {composeBriefTxt} from "../src/lib/ai-brief-txt";
const context={id:"cycle-1",name:"Sprint 1",team:"Equipe Atlas",product:"Produit A",status:"active",startAt:"2026-10-01",endAt:"2026-10-14",timeZone:"Europe/Paris"};
const template={title:"Bilan",revision:2,sections:["Résultats collectifs","Contexte","Questions"],questions:["Quels écarts ?"],instructions:["Ne pas extrapoler"],data:["scrum.storyPoints.completed","scrum.capacity.planned","member.email"],depth:5};
test("plain TXT retains units, provenance, missing quality and provisional status",()=>{
 const txt=composeBriefTxt({context,mode:"scrum",preparedAt:"2026-10-25T10:00:00Z",template,facts:{
  "scrum.storyPoints.completed":{key:"scrum.storyPoints.completed",label:"Terminés",value:"0",unit:"SP",source:"current",quality:"provisional",snapshotVersion:null},
  "scrum.capacity.planned":{key:"scrum.capacity.planned",label:"Capacité",value:null,unit:"JH",source:"current",quality:"unavailable",snapshotVersion:null}
 }});
 assert.match(txt,/Equipe Atlas/);assert.match(txt,/Produit A/);
 assert.match(txt,/Terminés : 0 SP \[Provisoire/);
 assert.match(txt,/Capacité : Non renseigné \[Non renseigné/);
 assert.match(txt,/QUESTIONS/);assert.match(txt,/Ne pas extrapoler/);
 assert.doesNotMatch(txt,/member.email/);
 assert.doesNotMatch(txt,/<(?:svg|img|canvas)/i);
});
test("template section order and historical depth are preserved and capped",()=>{
 const txt=composeBriefTxt({context:{...context,status:"closed"},mode:"kanban",preparedAt:"2026-10-25",template:{...template,sections:["Questions","Résultats collectifs"],depth:9},facts:{}});
 assert.ok(txt.indexOf("QUESTIONS")<txt.indexOf("RÉSULTATS"));
 assert.match(txt,/5 cycle\(s\) clôturé\(s\)/);
});
