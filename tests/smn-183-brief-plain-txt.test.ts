import assert from "node:assert/strict";
import {test} from "node:test";
import {resolveBriefPrompt} from "../src/lib/ai-brief-tag-resolver";
import {convertLegacyPrompt} from "../src/lib/ai-brief-prompt";
const context={id:"cycle-1",name:"Sprint A",team:"Equipe Atlas",product:"Produit A",status:"active",startAt:"2026-10-01",endAt:"2026-10-14",timeZone:"Europe/Paris"};
test("TXT resolver keeps unit, source, quality and zero value",()=>{
 const r=resolveBriefPrompt({context,mode:"scrum",preparedAt:"2026-10-25",promptText:"{{TEAM_NAME}} — {{ROW:INDICATORS}}",facts:{
  "scrum.storyPoints.completed":{key:"scrum.storyPoints.completed",label:"Terminés",value:"0",unit:"SP",source:"current",quality:"provisional",snapshotVersion:null}}});
 assert.equal(r.safe,true);assert.match(r.text,/Equipe Atlas/);
 assert.match(r.text,/Terminés: 0 SP/);
 assert.match(r.text,/source: current/);
 assert.match(r.text,/provisional/);
 assert.doesNotMatch(r.text,/<(?:svg|img|canvas)/i);
});
test("legacy conversion preserves original sections, questions, depth, data",()=>{
 const legacy={sections:["Résultats collectifs","Questions"],questions:["Quels écarts ?"],instructions:["Ne pas extrapoler"],data:["scrum.storyPoints.completed"],depth:5};
 const text=convertLegacyPrompt(legacy);
 for(const value of [...legacy.sections,...legacy.questions,...legacy.instructions,...legacy.data,"5 cycle(s)"])assert.ok(text.includes(value),value);
});
