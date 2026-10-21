import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {parseTheme,themePalette} from "../src/lib/theme";
import {parseGeneralSettings} from "../src/server/settings/manager";
import {canAccess} from "../src/server/access-policy";
import {readFileSync} from "node:fs";

function luminance(hex:string):number {
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
function contrast(a:string,b:string):number{
  const [lighter,darker]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (lighter+0.05)/(darker+0.05);
}
describe("SMN-24 — thème et palettes accessibles",()=>{
  it("ne laisse passer que les palettes clair/sombre prévues, repli clair pour les valeurs invalides",()=>{
    assert.equal(parseTheme("dark"),"dark");
    assert.equal(parseTheme("light"),"light");
    for(const value of ["sepia","system",null,undefined,0,{},["dark"],"<script>"])
      assert.equal(parseTheme(value),"light");
  });
  it("conserve un contraste WCAG AA élevé pour textes, fonds et liens identifiables",()=>{
    for(const [name,palette] of Object.entries(themePalette)){
      assert.ok(contrast(palette.foreground,palette.surface)>=4.5,name+" surface");
      assert.ok(contrast(palette.foreground,palette.background)>=4.5,name+" body");
      assert.ok(contrast(palette.brand,palette.surface)>=4.5,name+" brand");
    }
  });
  it("rejette une modification arbitraire de palette sans perturber les réglages précédents",()=>{
    const original={locale:"fr",theme:"light",referenceCountry:null,revision:4};
    assert.deepEqual(parseGeneralSettings(original),original);
    assert.equal(parseGeneralSettings({...original,theme:"not-a-palette"}),null);
    assert.equal(parseGeneralSettings({...original,palette:"#ffffff"}),null);
  });
  it("maintient le refus d'écriture d'un Utilisateur mais sa lecture collective",()=>{
    const admin={role:"admin",is_active:true,must_change_password:false};
    const user={...admin,role:"user"};
    const settings={type:"settings",exists:true,inScope:true};
    assert.equal(canAccess(admin,"write",settings),true);
    assert.equal(canAccess(user,"write",settings),false);
    assert.equal(canAccess(user,"read",{type:"collective",exists:true,inScope:true}),true);
  });
  it("utilise les variables et attributs Bootstrap sans dupliquer les libellés",()=>{
    const css=readFileSync(new URL("../src/app/globals.css",import.meta.url),"utf8");
    const layout=readFileSync(new URL("../src/app/layout.tsx",import.meta.url),"utf8");
    const form=readFileSync(new URL("../src/app/app/admin/settings/settings-form.tsx",import.meta.url),"utf8");
    assert.match(layout,/data-bs-theme=\{appearance\.theme\}/);
    assert.match(css,/\[data-bs-theme="dark"\]/);
    assert.match(css,/--bs-body-bg/);
    assert.match(css,/--bs-body-color/);
    assert.match(css,/--bs-primary/);
    assert.match(form,/saved\.theme!==data\.settings\.theme/);
  });
});
