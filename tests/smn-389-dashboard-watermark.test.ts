import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {compatibleVisualizations,resolveVisualization} from "../src/server/dashboard-builder/visualizations";
import {resolveDashboardSource,validateSourceDescriptors,SOURCE_VIEWS,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const indicator:SourceDescriptor={
 code:"indicator:one",name:"Vélocité",category:"indicator",unit:"SP",scope:"cycle",
 permission:"read",status:"available",views:["number","card","card-watermark","gauge","line","bar"],
};
const list:SourceDescriptor={
 code:"registry:items",name:"Risques",category:"registry",unit:null,scope:"team",
 permission:"read",status:"available",views:["list","list-watermark"],
};
const read=(name:string)=>readFileSync(new URL("../src/app/app/dashboard-builder/"+name,import.meta.url),"utf8");

test("SMN-389 AC1: exactly two new variants in the nine-view catalog",()=>{
 assert.equal(SOURCE_VIEWS.length,9);
 assert.ok(SOURCE_VIEWS.includes("card-watermark"));
 assert.ok(SOURCE_VIEWS.includes("list-watermark"));
 assert.deepEqual(compatibleVisualizations(indicator).map(x=>x.kind),indicator.views);
 assert.deepEqual(compatibleVisualizations(list).map(x=>x.kind),list.views);
 assert.deepEqual(compatibleVisualizations({...list,status:"unavailable"}),[]);
 validateSourceDescriptors([indicator,list]);
 assert.equal(resolveDashboardSource([indicator,list],indicator.code,"list-watermark").status,"incompatible");
 assert.equal(resolveDashboardSource([indicator,list],list.code,"card-watermark").status,"incompatible");
});

test("SMN-389 AC3/AC7: KPI watermark retains numeric zero and null handling",()=>{
 const zero=resolveVisualization(indicator,"card-watermark",{result:{state:"available",value:0,unit:"SP"}});
 assert.equal(zero.state,"ready");
 assert.equal(zero.value,0);
 assert.equal(zero.kind,"card-watermark");
 assert.equal(resolveVisualization(indicator,"card-watermark",{result:{state:"null"}}).state,"null");
 assert.equal(resolveVisualization(indicator,"card-watermark",{result:{state:"error"}}).state,"error");
});

test("SMN-389 AC3/AC7: list watermark retains existing source rows",()=>{
 const rows=[{label:"Risque ouvert",value:"En cours"}];
 const result=resolveVisualization(list,"list-watermark",{result:{state:"available",value:0,unit:null},rows});
 assert.equal(result.state,"ready");
 assert.deepEqual(result.rows,rows);
});

test("SMN-389 AC2/AC3/AC4: watermark uses configured slot icon and color, no click interception",()=>{
 const consultation=read("dashboard-consultation.tsx");
 const css=read("dashboard-dimensions.module.css");
 assert.match(consultation,/ceremonyIconColorHex\(slot\.iconColor\)/);
 assert.match(consultation,/SMNIcon name=\{slot\.icon\}/);
 assert.match(consultation,/aria-hidden="true"/);
 assert.match(consultation,/Math\.min\(parent\.clientHeight,parent\.clientWidth\)\*\.9/);
 assert.match(css,/\.watermarkGraphic\{[^}]*opacity:\.1/);
 assert.match(css,/\.watermarkGraphic\{[^}]*pointer-events:none/);
 assert.match(css,/\.watermarkSlot>:not\(\.watermarkGraphic\)/);
});

test("SMN-389 AC5/AC6: wizard choices, persistence and list adapters",()=>{
 const wizard=read("slot-wizard.tsx");
 const editor=read("dashboard-editor.tsx");
 const visualization=read("dashboard-visualization.tsx");
 const batch=readFileSync(new URL("../src/server/dashboard-builder/batch.ts",import.meta.url),"utf8");
 assert.match(wizard,/Carte KPI — Filigrane/);
 assert.match(wizard,/Liste — Filigrane/);
 assert.match(wizard,/KPI card — Watermark/);
 assert.match(editor,/DashboardSlotWizard locale=\{locale\}/);
 assert.match(editor,/updateDashboardSlot\(current,wizardSlot,\{source,view,filters:options\}\)/);
 assert.match(visualization,/model\.kind==="card-watermark"/);
 assert.match(batch,/r\.view==="list-watermark"/);
});
