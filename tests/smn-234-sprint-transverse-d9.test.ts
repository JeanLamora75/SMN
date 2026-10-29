import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {
 parseSprintTab,sprintTabKeys
} from "../src/lib/sprint-detail-tabs";
import {
 deriveSprintIndicators,emptyPoints,emptyTickets
} from "../src/lib/sprint-indicator-values";
import {ceremonyStatus,normalizeSprintCeremony} from "../src/lib/sprint-ceremony-detail";
import {presenceFromCapacity,sprintPresenceDates} from "../src/lib/sprint-presence";
import {trendGeometry} from "../src/lib/sprint-trend-geometry";
import {cleanReviewBody,emptyReview} from "../src/lib/sprint-review-analysis";
import {registerKinds,selectSprintRegisterPage} from "../src/lib/sprint-registers";

const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const panel=(name:string)=>file(
 "src/app/app/admin/sprints/[sprintId]/sprint-"+name+"-panel.tsx");
const reader=(name:string)=>file("src/server/sprints/"+name+".ts");

describe("SMN-234 D9 — sept onglets, aucun substitut Synthèse",()=>{
 it("conserve les sept identités et refuse l'onglet inconnu",()=>{
  assert.deepEqual([...sprintTabKeys],[
   "objectives","ceremonies","capacity","indicators",
   "registers","trends","review"
  ]);
  assert.equal(parseSprintTab("synthese"),"objectives");
  assert.equal(parseSprintTab("registers"),"registers");
 });
 it("résout le Sprint exclusivement dans le contexte autorisé de l'équipe",()=>{
  const page=file("src/app/app/admin/sprints/[sprintId]/page.tsx");
  assert.match(page,/context\.items\.find\(item=>item\.id===sprintId\)/);
  assert.match(page,/canAccess\(account,"read",collective\)/);
  assert.match(page,/withDashboardRead/);
  assert.match(page,/notFound\(\)/);
  for(const tab of ["objectives","ceremonies","capacity","indicators",
   "registers","trends","review"]){
   assert.match(page,new RegExp('active==="'+tab+'"\\?'));
  }
  assert.match(page,/SprintDetailTabs/);
 });
 it("préserve la lecture collective mais protège les membres nominativement",()=>{
  const page=file("src/app/app/admin/sprints/[sprintId]/page.tsx");
  assert.match(page,/canViewMembers=canAccess\(account,"read",\{type:"members"/);
  assert.match(page,/active==="capacity"&&canViewMembers\?/);
  assert.match(page,/data=\{canViewMembers\?presence:null\}/);
  assert.match(panel("capacity"),/presenceRestricted/);
 });
});
describe("SMN-234 D9 — invariants chiffrés, statuts et provenance",()=>{
 it("n'invente ni valeurs numériques ni taux avec dénominateur nul",()=>{
  const missing=deriveSprintIndicators(emptyPoints,emptyTickets);
  assert.equal(missing.final,null);
  assert.equal(missing.rate,null);
  assert.equal(missing.ticketRate,null);
  const zero=deriveSprintIndicators(
   {initial:0,added:0,removed:0,done:0},
   {initial:0,done:0}
  );
  assert.equal(zero.final,0);
  assert.equal(zero.rate,null);
  assert.equal(zero.ticketRate,null);
  const above=deriveSprintIndicators(
   {initial:10,added:0,removed:0,done:15},
   {initial:4,done:5}
  );
  assert.equal(above.rate,150);
  assert.equal(above.ticketRate,125);
 });
 it("sépare une réunion tenue inférée d'une tenue confirmée",()=>{
  const occurrence={
   source_kind:"standard",id:"event",kind:"daily",title:"Daily",
   starts_at:"2026-10-06T09:00:00Z",ends_at:"2026-10-06T09:15:00Z",
   status:"held",status_explicit:false,
   generation_source:"reconstructed",actual_minutes:null
  };
  const parsed=normalizeSprintCeremony(occurrence,false);
  assert.equal(parsed?.statusEvidence,"inferred");
  assert.equal(parsed?.reconstructed,true);
  assert.equal(parsed?.actualMinutes,null);
  assert.equal(normalizeSprintCeremony({...occurrence,status_explicit:true},false)?.statusEvidence,
   "confirmed");
  assert.equal(ceremonyStatus("not_held"),"not_held");
  assert.equal(ceremonyStatus("postponed"),"unknown");
 });
 it("ne réduit pas les J/H de présence par l'allocation de développement",()=>{
  const projection=presenceFromCapacity({hoursPerJh:8,members:[{
   memberId:"m1",displayName:"PO",totalJh:0,
   days:[{status:"calculated",availableHalfDays:2},
    {status:"calculated",availableHalfDays:0},
    {status:"not-calculable",availableHalfDays:null}]
  }]});
  assert.equal(projection.members[0].presenceJh,null);
  assert.equal(projection.totalPresenceJh,null);
  assert.equal(projection.members[0].developmentJh,0);
  const known=presenceFromCapacity({hoursPerJh:8,members:[{
   memberId:"m1",displayName:"PO",totalJh:0,
   days:[{status:"calculated",availableHalfDays:2}]
  }]});
  assert.equal(known.totalPresenceJh,1);
 });
 it("conserve la borne exclusive au changement d'heure Europe/Paris",()=>{
  assert.deepEqual(sprintPresenceDates({
   startAt:"2026-10-19T07:00:00.000Z",
   endAt:"2026-11-01T23:00:00.000Z",
   timeZone:"Europe/Paris"
  }),{start:"2026-10-19",end:"2026-11-01"});
 });
 it("interrompt une courbe au lieu de joindre à travers un null",()=>{
  const g=trendGeometry([1,null,3,0,6]);
  assert.equal(g.dots.length,4);
  assert.equal(g.segments.length,2);
  assert.equal(g.dots[2].value,0);
 });
 it("historise deux analyses indépendantes et refuse la fausse IA",()=>{
  assert.notEqual(emptyReview("manual"),emptyReview("ai"));
  assert.equal(emptyReview("ai").origin,null);
  assert.equal(cleanReviewBody("  Analyse humaine  "),"Analyse humaine");
  assert.equal(cleanReviewBody(" ".repeat(3001)),undefined);
 });
});
describe("SMN-234 D9 — immutabilité, liens sûrs et dette explicitée",()=>{
 it("les sources historiques ne sont jamais recalculées avec les données courantes",()=>{
  const snapshotReaders=[
   reader("goals-detail-read"),reader("indicators-read"),
   reader("ceremonies-detail-read"),reader("presence-detail-read"),
   reader("review-analysis"),reader("registers-detail-read")
  ];
  for(const code of snapshotReaders){
   assert.match(code,/closure_snapshot/);
   assert.match(code,/ORDER BY version DESC LIMIT 1/);
  }
  assert.match(reader("trends"),/ORDER BY v.version DESC LIMIT 1/);
  const closure=reader("closure");
  assert.match(closure,/memberPresence:/);
  assert.match(closure,/reviewAnalysis,/);
  assert.doesNotMatch(closure,/qualitativeRegisters/);
 });
 it("ne propose pas de lien vers une fiche vivante depuis un instantané clos",()=>{
  assert.match(panel("ceremonies"),/data.source==="recorded-events"/);
  assert.match(panel("ceremonies"),/ceremonyHistoricalLinkUnavailable/);
  assert.match(panel("registers"),/data.source==="closure-snapshot"/);
  assert.match(file("src/app/app/admin/sprints/[sprintId]/sprint-register-row.tsx"),/registersHistoricalLinkUnavailable/);
 });
 it("distingue source Epic 5 absente d'une liste de registres réellement vide",()=>{
  const registry=reader("registers-detail-read");
  assert.match(registry,/producer-not-installed/);
  assert.match(panel("registers"),/registersProducerPending/);
  assert.equal(registerKinds.length,6);
  const known=selectSprintRegisterPage({
   records:[],availableKinds:[...registerKinds]
  },"team",{
   id:"sprint",startAt:"2026-10-05T09:00:00Z",
   endAt:"2026-10-19T09:00:00Z"
  });
  assert.equal(known?.total,0);
 });
 it("ne modifie pas les anciens formulaires avant leur recette de non-régression",()=>{
  const page=file("src/app/app/admin/sprints/review/page.tsx");
  assert.match(page,/Sprint/);
  const route=file("src/app/api/admin/sprints/review-analysis/route.ts");
  assert.match(route,/authorizeApi\(req,"write",resource\)/);
  assert.match(reader("review-analysis"),/revision!==data.revision/);
 });
 it("les libellés FR/EN des correctifs historiques restent disponibles",()=>{
  const fr=JSON.parse(file("src/i18n/fr.json")).sprintDetail;
  const en=JSON.parse(file("src/i18n/en.json")).sprintDetail;
  for(const key of ["ceremonyHistoricalLinkUnavailable",
   "registersHistoricalLinkUnavailable"]){
   assert.equal(typeof fr[key],"string");
   assert.equal(typeof en[key],"string");
  }
  assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 });
});
