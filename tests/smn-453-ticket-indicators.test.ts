import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateManualWrite} from "../src/server/indicators/manual-values";
import {translate} from "../src/i18n/catalog";

const read=(path:string)=>readFileSync(path,"utf8");
const validChange={
 teamId:"team_1",cycleType:"scrum" as const,cycleId:"sprint_1",
 expectedRevision:5,expectedSystemRevision:12,
 changes:[{indicatorId:"indicator_1",value:"3.5"}],
};

test("SMN-453 : réutilise les validations v33 pour une saisie explicite",()=>{
 assert.equal(validateManualWrite(validChange),true);
 assert.equal(validateManualWrite({...validChange,cycleType:"kanban"}),true);
 assert.equal(validateManualWrite({...validChange,changes:[{indicatorId:"indicator_1",value:null}]}),true);
 assert.equal(validateManualWrite({...validChange,changes:[{indicatorId:"indicator_1",value:"ND"}]}),false);
 assert.equal(validateManualWrite({...validChange,expectedRevision:-1}),false);
 assert.equal(validateManualWrite({...validChange,expectedSystemRevision:-1}),false);
 assert.equal(validateManualWrite({...validChange,changes:[
  {indicatorId:"indicator_1",value:"2"},{indicatorId:"indicator_1",value:"3"},
 ]}),false);
});

test("SMN-453 : le bouton Tickets utilise le formulaire v33 existant, ciblé par équipe et cycle",()=>{
 const tickets=read("src/app/app/tickets/tickets-files.tsx");
 const component=read("src/app/app/admin/indicators/universal-input.tsx");
 assert.match(tickets,/import UniversalIndicatorInput from "\.\.\/admin\/indicators\/universal-input"/);
 assert.match(tickets,/cycleState==="ready"/);
 assert.match(tickets,/canManageIndicators/);
 assert.match(tickets,/teamId=\{teamId\}/);
 assert.match(tickets,/cycleType=\{mode\}/);
 assert.match(tickets,/cycleId=\{cycleId\}/);
 assert.match(tickets,/manualOnlyNotice/);
 assert.match(component,/smn-cockpit-modal/);
 assert.match(component,/aria-modal="true"/);
 assert.match(component,/smn-universal-indicators-title/);
 assert.match(component,/buttonClassName/);
 assert.match(component,/buttonIcon/);
});

test("SMN-453 : prévisualisation v33 et sauvegarde transactionnelle avec révisions existantes",()=>{
 const form=read("src/app/app/admin/indicators/universal-input.tsx");
 const route=read("src/app/api/admin/indicators/input/route.ts");
 const engine=read("src/server/indicators/manual-values.ts");
 assert.match(form,/expectedRevision:form\.revision/);
 assert.match(form,/expectedSystemRevision/);
 assert.match(form,/action:"preview"/);
 assert.match(form,/run\("save"\)/);
 assert.match(route,/requireIndicatorTeam/);
 assert.match(route,/previewIndicatorInput/);
 assert.match(route,/writeManualValues/);
 assert.match(engine,/BEGIN/);
 assert.match(engine,/COMMIT/);
 assert.match(engine,/ROLLBACK/);
 assert.match(engine,/smn_indicator_cycle_revision/);
 assert.match(engine,/smn_indicator_system_revision/);
});

test("SMN-453 : aucun raccordement CSV ou agrégations vers écritures manuelles",()=>{
 const tickets=read("src/app/app/tickets/tickets-files.tsx");
 const input=read("src/app/app/admin/indicators/universal-input.tsx");
 for(const path of [
  "src/lib/ticket-csv-summary.ts",
  "src/lib/ticket-csv-compare.ts",
  "src/lib/ticket-csv-browse.ts",
 ])assert.doesNotMatch(read(path),/writeManualValues|smn_indicator_manual_value|api\/admin\/indicators\/input/);
 assert.doesNotMatch(input,/ticket-csv|tickets\/browse|tickets\/compare|snapshot-storage|storyPointsTotal/);
 assert.doesNotMatch(tickets,/expectedSystemRevision|indicatorId:.*storyPoints|writeManualValues/);
});

test("SMN-453 : contexte et messages explicites en FR/EN",()=>{
 const shell=read("src/app/app/private-shell.tsx");
 assert.match(shell,/ticketsCycle=\{teamId,mode,role,canManageIndicators,cycleId:selectedCycleId/);
 const context=read("src/app/app/tickets-cycle-context.tsx");
 assert.match(context,/canManageIndicators\?:boolean/);
 for(const locale of ["fr","en"] as const)
  for(const key of ["tickets.indicators","tickets.indicatorsUnavailable",
   "tickets.indicatorsManualOnly","tickets.indicatorsCurrentCycle",
   "indicators.input.preview","indicators.input.save","indicators.input.saved"] as const){
   const text=translate(locale,key,{cycle:"Sprint 5"});
   assert.ok(text.length>0,key);
   assert.doesNotMatch(text,/translation unavailable|traduction indisponible/i);
  }
});

test("SMN-453 : aucune fausse réussite après échec de prévisualisation ou de sauvegarde",()=>{
 const input=read("src/app/app/admin/indicators/universal-input.tsx");
 assert.match(input,/if\(!r\.ok\|\|data\.ok===false\)throw Error/);
 assert.match(input,/setPreview\(null\);setSystemRevision\(null\);setError/);
 assert.match(input,/window\.dispatchEvent\(new CustomEvent\("smn:indicators-saved"/);
 assert.match(input,/setOpen\(false\);setForm\(null\)/);
});
