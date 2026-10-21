import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {accountEdit,editedAccount,reconcileAccountEdits} from "../src/lib/account-drafts";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const previous=[
  {id:"a",role:"admin" as const,is_active:true},
  {id:"b",role:"user" as const,is_active:true},
  {id:"c",role:"user" as const,is_active:false},
];
const edits={
  a:{role:"admin" as const,isActive:true},
  b:{role:"admin" as const,isActive:true},
  c:{role:"user" as const,isActive:true},
};
describe("SMN-28 — brouillons, sauvegardes explicites et sécurité",()=>{
  it("identifie précisément les données différentes du dernier état confirmé",()=>{
    assert.deepEqual(accountEdit(previous[0]),{role:"admin",isActive:true});
    assert.equal(editedAccount(previous[0],edits.a),false);
    assert.equal(editedAccount(previous[1],edits.b),true);
    assert.equal(editedAccount(previous[2],edits.c),true);
    assert.equal(editedAccount(previous[0],undefined),false);
  });
  it("après sauvegarde d'une ligne, préserve les brouillons de toutes les autres",()=>{
    const updated=[
      previous[0],
      {...previous[1],role:"admin" as const},
      previous[2],
    ];
    const result=reconcileAccountEdits(previous,edits,updated,"b");
    assert.deepEqual(result.b,{role:"admin",isActive:true});
    assert.deepEqual(result.c,edits.c);
    assert.deepEqual(result.a,edits.a);
    assert.equal(editedAccount(updated[2],result.c),true);
    assert.equal(editedAccount(updated[1],result.b),false);
  });
  it("après création d'un compte, ne valide ni n'efface les modifications d'une autre ligne",()=>{
    const inserted={id:"d",role:"user" as const,is_active:true};
    const result=reconcileAccountEdits(previous,edits,[...previous,inserted]);
    assert.deepEqual(result.b,edits.b);
    assert.deepEqual(result.c,edits.c);
    assert.deepEqual(result.d,{role:"user",isActive:true});
    assert.equal(result.a.role,"admin");
  });
  it("n'expose pas une ancienne saisie sur une ressource supprimée ou un nouveau compte",()=>{
    const result=reconcileAccountEdits(previous,edits,[previous[2]]);
    assert.deepEqual(Object.keys(result),["c"]);
    const changed=reconcileAccountEdits(previous,{c:edits.c},[{...previous[2],is_active:true}],"c");
    assert.deepEqual(changed.c,{role:"user",isActive:true});
  });
  it("l'avertissement est porté par la navigation et le rechargement et ne conserve pas les secrets",()=>{
    const guard=source("src/app/app/use-unsaved-changes.ts");
    assert.match(guard,/addEventListener\("beforeunload"/);
    assert.match(guard,/addEventListener\("click",links,true\)/);
    assert.match(guard,/data-smn-navigation-action/);
    assert.match(source("src/app/app/logout-control.tsx"),/data-smn-navigation-action="logout"/);
    assert.match(guard,/window\.confirm\(warning\)/);
    assert.match(guard,/event\.preventDefault\(\)/);
    assert.doesNotMatch(guard,/localStorage|sessionStorage|document\.cookie/);
    const settings=source("src/app/app/admin/settings/settings-form.tsx");
    const accounts=source("src/app/app/admin/users/users-admin.tsx");
    const security=source("src/app/app/security/security-form.tsx");
    for(const component of [settings,accounts,security]){
      assert.match(component,/useUnsavedChanges\(dirty\|\|busy/);
      assert.match(component,/draft\.pending/);
    }
    assert.match(settings,/dirty&&\!window\.confirm\(t\("draft\.discardWarning"\)\)/);
    assert.match(accounts,/reconcileAccountEdits\(previous,drafts,data\.accounts,savedId\)/);
  });
  it("n'annonce un succès qu'après l'acquittement API; les échecs conservent le brouillon",()=>{
    const settings=source("src/app/app/admin/settings/settings-form.tsx");
    assert.match(settings,/if\(!response\.ok\|\|!data\.settings\)/);
    assert.match(settings,/setSaved\(data\.settings\)/);
    assert.match(settings,/setSuccess\(t\(data\.changed/);
    const accounts=source("src/app/app/admin/users/users-admin.tsx");
    assert.match(accounts,/if\s*\(!response\.ok\)/);
    assert.match(accounts,/if\(await refresh\(id\)\)setMessage\(t\("accounts\.updated"\)\)/);
    assert.match(accounts,/if\(await refresh\(\)\)setMessage\(t\("accounts\.created"\)\)/);
  });
});
