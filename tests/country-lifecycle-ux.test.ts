import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {visibilityAfterLifecycle,lifecycleActionForCountry,lifecycleBlocked}
 from "../src/lib/countries/lifecycle-ux";

describe("SMN-280 — parcours de résolution des blocages",()=>{
 it("offre les actions correspondant à l'état du pays",()=>{
  assert.equal(lifecycleActionForCountry(false),"archive");
  assert.equal(lifecycleActionForCountry(true),"reactivate");
 });
 it("garde une ligne trouvable lorsque l'action la ferait disparaître",()=>{
  assert.equal(visibilityAfterLifecycle("active","archive"),"all");
  assert.equal(visibilityAfterLifecycle("archived","reactivate"),"all");
  assert.equal(visibilityAfterLifecycle("all","archive"),"all");
  assert.equal(visibilityAfterLifecycle("active","reactivate"),"active");
  assert.equal(visibilityAfterLifecycle("archived","archive"),"archived");
 });
 it("n'autorise jamais l'archivage malgré un blocage",()=>{
  const base={canArchive:true,canReactivate:false,country:{archived:false},
   referenceCountry:false,activeMemberCount:0};
  assert.equal(lifecycleBlocked(base),false);
  assert.equal(lifecycleBlocked({...base,activeMemberCount:1}),true);
  assert.equal(lifecycleBlocked({...base,referenceCountry:true}),true);
  assert.equal(lifecycleBlocked({...base,canArchive:false}),true);
  assert.equal(lifecycleBlocked({...base,canReactivate:true,country:{archived:true}}),false);
  assert.equal(lifecycleBlocked({...base,canReactivate:false,country:{archived:true}}),true);
 });
});
