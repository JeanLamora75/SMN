import test from "node:test";
import assert from "node:assert/strict";
import {canonicalJson,hashReportPayload,verifiedFrozenReference} from "../src/server/reports/render-reference";
test("reference digest is independent of property insertion order",()=>{
 const a={language:{language:"fr",revision:0},logo:null,data:{sprint:{id:"s1"},metrics:[{value:3}]}};
 const b={data:{metrics:[{value:3}],sprint:{id:"s1"}},logo:null,language:{revision:0,language:"fr"}};
 assert.equal(canonicalJson(a),canonicalJson(b));
 assert.equal(hashReportPayload(a as never),hashReportPayload(b as never));
});
test("reference detects changed content and rejects mismatched cycle",()=>{
 const payload={data:{sprint:{id:"s1"},metrics:[{value:3}]},logo:null,language:{language:"fr",revision:0}};
 const ref={id:"reference",sprintId:"s1",createdAt:"date",sha256:hashReportPayload(payload as never),payload};
 assert.equal(verifiedFrozenReference(ref as never),true);
 assert.equal(verifiedFrozenReference({...ref,sprintId:"s2"} as never),false);
 assert.equal(verifiedFrozenReference({...ref,payload:{...payload,data:{...payload.data,metrics:[{value:4}]}}} as never),false);
});
