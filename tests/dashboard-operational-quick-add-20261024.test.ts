import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import OperationalOverview from "../src/app/app/operational-overview";
import {collectionUnavailable,metricNotRecorded,type CollectiveCycleProjection}
 from "../src/lib/dashboard-data-contract";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const missing=collectionUnavailable("producer-not-ready");
function projection():CollectiveCycleProjection {
 const metric=metricNotRecorded();
 return {
  teamId:"team-A",cycleId:"sprint-A",cycleStatus:"active",snapshotVersion:null,
  goals:missing,capacity:{initialJh:metric,actualJh:metric},
  storyPoints:{initial:metric,done:metric},tickets:{initial:metric,done:metric},
  scores:{confidence:metric,clarity:metric},
  workingDaysRemaining:metric,events:{state:"available",items:[],total:0,source:"manual",snapshotVersion:null},
  obstacles:missing,risks:missing,notesAndAlerts:missing
 };
}

test("les quatre pieds de cartes proposent une création centrée et traduite en français",()=>{
 const html=renderToStaticMarkup(createElement(OperationalOverview,{
  locale:"fr",projection:projection(),timeZone:"Europe/Paris",canManage:true
 }));
 assert.equal((html.match(/class="smn-operational-create-link"/g)??[]).length,4);
 for(const label of [
  "+ Ajouter un obstacle","+ Ajouter un risque",
  "+ Ajouter un évènement","+ Ajouter une note"
 ])assert.ok(html.includes(label),label);
 assert.equal((html.match(/<button class="smn-operational-create-link" type="button"/g)??[]).length,4);
 assert.doesNotMatch(html,/team-calendar\?[^"]*create=1/);
 assert.doesNotMatch(html,/Suivi opérationnel<\/h2>|Synthèse du cycle sélectionné/);
 assert.match(html,/aria-label="Suivi opérationnel"/);
});

test("les libellés anglais et les permissions restent cohérents",()=>{
 const fr=renderToStaticMarkup(createElement(OperationalOverview,{
  locale:"en",projection:projection(),timeZone:"Europe/Paris",canManage:true
 }));
 for(const label of [
  "+ Add an impediment","+ Add a risk","+ Add an event","+ Add a note"
 ])assert.ok(fr.includes(label),label);
 const viewer=renderToStaticMarkup(createElement(OperationalOverview,{
  locale:"fr",projection:projection(),timeZone:"Europe/Paris",canManage:false
 }));
 assert.doesNotMatch(viewer,/class="smn-operational-create-link"/);
});

test("le tableau de bord supprime le lien calendrier redondant et conserve les quatre cartes",()=>{
 const page=read("src/app/app/page.tsx");
 assert.doesNotMatch(page,/t\("teamCalendar\.open"\)/);
 const styles=read("src/app/dashboard.css");
 assert.match(styles,/\.smn-operational-create-link\s*\{/);
 assert.match(styles,/text-align:center/);
 assert.match(styles,/font-weight:700/);
 assert.match(styles,/text-decoration:none/);
});

test("les quatre raccourcis ouvrent les formulaires en modale sans navigation",()=>{
 const overview=read("src/app/app/operational-overview.tsx");
 const modal=read("src/app/app/operational-quick-add.tsx");
 assert.match(overview,/OperationalQuickAdd/);
 assert.match(modal,/showModal\(\)/);
 assert.match(modal,/onClose=\{\(\)=>setOpened\(false\)\}/);
 assert.match(modal,/<RegistryCreate/);
 assert.match(modal,/<MeetingQuickForm/);
 assert.match(modal,/<NoteQuickForm/);
 assert.match(modal,/\/api\/admin\/sprints\/exceptional-meetings/);
 assert.match(modal,/\/api\/admin\/dashboard\/notes/);
 assert.match(modal,/body:JSON.stringify\(\{sprintId,teamId,text:content.trim\(\)\}\)/);
 assert.match(modal,/cycleId=\{cycleId\}/);
 assert.match(modal,/router\.refresh\(\)/);
});
