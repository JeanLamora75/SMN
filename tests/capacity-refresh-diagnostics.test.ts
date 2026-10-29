import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {presenceFromCapacity} from "../src/lib/sprint-presence";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("3 développeurs : calendrier complet donne des J/H et aucun défaut inventé",()=>{
 const members=["dev-1","dev-2","dev-3"].map(memberId=>({
  memberId,displayName:memberId,totalJh:1,
  days:[{status:"calculated" as const,availableHalfDays:2,missing:[]}]
 }));
 const result=presenceFromCapacity({hoursPerJh:8,members});
 assert.equal(result.state,"available");
 assert.equal(result.totalPresenceJh,3);
 assert.equal(result.members.length,3);
 assert.deepEqual(result.members.map(m=>m.developmentJh),[1,1,1]);
 assert.ok(result.members.every(m=>m.missingSources?.length===0));
});

test("une affectation ou un calendrier absent restent signalés sans faux zéro",()=>{
 const result=presenceFromCapacity({hoursPerJh:8,members:[{
  memberId:"dev-1",displayName:"Développeur",totalJh:null,
  days:[
   {status:"not-calculable",availableHalfDays:null,missing:["work-calendar"]},
   {status:"not-calculable",availableHalfDays:null,
    missing:["assignment-version","work-calendar"]},
   {status:"calculated",availableHalfDays:2,missing:[]}
  ]
 }]});
 assert.equal(result.totalPresenceJh,null);
 assert.equal(result.members[0].presenceJh,null);
 assert.equal(result.members[0].developmentJh,null);
 assert.equal(result.members[0].unknownDays,2);
 assert.deepEqual(result.members[0].missingSources,["assignment-version","work-calendar"]);
});

test("les diagnostics sont visibles uniquement sur la page Sprint administrateur",()=>{
 const src=source("src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx");
 assert.match(src,/if\(!canViewNames\)return/);
 assert.match(src,/missingTranslation\[code\]/);
 assert.match(src,/m\.missingSources\?\.length/);
 assert.match(src,/href="\/app\/admin\/development-capacity"/);
});

test("le calcul de développement est lancé pour les dates persistées du Sprint",()=>{
 const page=source("src/app/app/admin/development-capacity/page.tsx");
 const view=source("src/app/app/admin/development-capacity/development-capacity-view.tsx");
 assert.match(page,/readSprintContext/);
 assert.match(page,/sprintPresenceDates\(cycle\)/);
 assert.match(page,/cycle\.status!=="closed"/);
 assert.match(page,/requested\.cycleId/);
 assert.match(page,/context\.items\.find\(x=>x\.id===requestedId\)/);
 assert.match(view,/initialPeriod\?\.start\?\?""/);
 assert.match(view,/fetch\("\/api\/admin\/development-capacity\?"/);
 assert.match(view,/cache:"no-store",signal:controller\.signal/);
 assert.match(view,/return\(\)=>controller\.abort\(\)/);
});

test("le moteur et les lecteurs consultent les données courantes sans altérer les snapshots",()=>{
 const engine=source("src/server/capacity/engine.ts");
 const sprint=source("src/server/sprints/presence-detail-read.ts");
 const dashboard=source("src/server/dashboard/cycle-reader.ts");
 assert.match(engine,/export async function readDevelopmentCapacity/);
 assert.match(sprint,/await readDevelopmentCapacity\(db,period\.start,period\.end/);
 assert.match(dashboard,/readActualCapacity\(db,start,end,readDevelopmentCapacity/);
 assert.match(dashboard,/readInitialSnapshot\(db,teamId,start,end\)/);
 assert.match(dashboard,/closedSnapshotProjection\(row\.snapshot,version\)/);
});

test("lien diagnostic conserve le Sprint et les permissions de lecture des membres",()=>{
 const overview=source("src/app/app/cycle-overview.tsx");
 const dashboard=source("src/app/app/page.tsx");
 assert.match(overview,/canViewCapacity&&cycle&&cycle\.status!=="closed"/);
 assert.match(overview,/development-capacity\?cycleId=/);
 assert.match(overview,/action=\{canViewCapacity&&cycle/);
 assert.doesNotMatch(overview,/className="smn-capacity-diagnostic-link"/);
 const cards=source("src/app/app/kpi-cards.tsx");
 assert.match(cards,/action&&<Link href=\{action.href\}/);
 assert.match(dashboard,/canViewCapacity=\{canAccess\(account,"read",\{type:"members"/);
});

test("les dictionnaires FR et EN proposent tous les messages explicatifs",()=>{
 const fr=JSON.parse(source("src/i18n/fr.json"));
 const en=JSON.parse(source("src/i18n/en.json"));
 const keys=["meetingParticipants","meetingWorkSlots"];
 for(const key of keys){
  assert.ok(fr.developmentCapacity[key]&&en.developmentCapacity[key],key);
 }
 for(const key of ["presenceMissingIntro","presenceSeeDiagnosis"]){
  assert.ok(fr.sprintDetail[key]&&en.sprintDetail[key],key);
 }
 assert.ok(fr.dashboard.cockpit.capacityDiagnosis);
 assert.ok(en.dashboard.cockpit.capacityDiagnosis);
});
