import test from "node:test";
import assert from "node:assert/strict";
import {standardReportTemplate} from "../src/lib/report-templates";
import {compareTemplateVersions} from "../src/server/reports/template-versioning";

test("pinned snapshot stays unchanged while newer template is compared",()=>{
 const initial=standardReportTemplate();
 const snapshot={id:initial.id,revision:initial.revision,sections:structuredClone(initial.sections),content:structuredClone(initial.content)};
 const latest={...standardReportTemplate(),revision:1,sections:structuredClone(initial.sections)};
 latest.sections[0]={...latest.sections[0],visible:!latest.sections[0].visible};
 const before=JSON.stringify(snapshot);
 assert.deepEqual(compareTemplateVersions(snapshot,latest),{
  fromVersion:0,toVersion:1,sectionsChanged:true,contentChanged:false,isNewer:true
 });
 assert.equal(JSON.stringify(snapshot),before);
});
test("unchanged template is not an upgrade",()=>{
 const t=standardReportTemplate();
 const snapshot={id:t.id,revision:t.revision,sections:structuredClone(t.sections),content:structuredClone(t.content)};
 assert.equal(compareTemplateVersions(snapshot,t).isNewer,false);
});
