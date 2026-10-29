import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {parseTeamCreate} from "../src/lib/team-form";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("mode Agile explicite obligatoire et contrôlé",()=>{
 assert.equal(parseTeamCreate({name:"Nouvelle équipe"}),null);
 assert.equal(parseTeamCreate({name:"Equipe",agileMode:"safe"}),null);
 assert.equal(parseTeamCreate({name:"Equipe",agileMode:"kanban"})?.agileMode,"kanban");
 assert.equal(parseTeamCreate({name:"Equipe",agileMode:"scrum"})?.agileMode,"scrum");
});
test("le mode est persisté et restitué dans la liste",()=>{
 const write=read("src/server/teams/write.ts");
 const list=read("src/server/teams/list.ts");
 assert.match(write,/name,agile_mode\) VALUES/);
 assert.match(write,/input\.agileMode/);
 assert.match(list,/t\.agile_mode/);
 assert.match(list,/agileMode:row\.agile_mode/);
});
test("le formulaire présente Scrum et Kanban sans modifier le mode existant",()=>{
 const ui=read("src/app/app/admin/settings/teams/teams-settings.tsx");
 assert.match(ui,/id="smn-team-settings-agile-mode"/);
 assert.match(ui,/<option value="scrum">Scrum<\/option>/);
 assert.match(ui,/<option value="kanban">Kanban<\/option>/);
 assert.match(ui,/disabled=\{!!current&&\(!current\.canChangeMode\|\|current\.isArchived\)\|\|!canWrite/);
});
