import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {DEFAULT_APPEARANCE,PALETTES,safeAppearance,validPalette} from "../src/lib/appearance";
import {APPEARANCE_MIGRATION_SQL} from "../src/server/settings/appearance-migration";

const css=readFileSync(new URL("../src/app/appearance.css",import.meta.url),"utf8");
function luminance(hex:string):number{
  const channels=hex.slice(1).match(/.{2}/g)!.map(v=>parseInt(v,16)/255)
    .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
}
function contrast(a:string,b:string):number{
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
describe("SMN-24 — thèmes et palettes accessibles",()=>{
  it("propose une liste fermée et une valeur de repli non corrompue",()=>{
    assert.deepEqual(PALETTES,["ocean","forest","violet","red-purple"]);
    for(const palette of PALETTES){
      assert.equal(validPalette(palette),true);
      assert.deepEqual(safeAppearance("dark",palette),{theme:"dark",palette});
    }
    for(const value of ["custom","#ff0000","FOREST",null,undefined,42,{}]){
      assert.equal(validPalette(value),false);
      assert.deepEqual(safeAppearance("bad",value),DEFAULT_APPEARANCE);
    }
  });
  it("synchronise Bootstrap, thèmes et variantes de palettes dans le CSS global",()=>{
    assert.match(css,/\[data-bs-theme="dark"\]/);
    for(const palette of PALETTES){
      assert.ok(css.includes(`[data-smn-palette="${palette}"]`));
      assert.ok(css.includes(`[data-bs-theme="dark"][data-smn-palette="${palette}"]`));
    }
    for(const token of ["--smn-bg","--smn-text","--smn-surface","--smn-primary","--smn-focus",
      "--bs-btn-color","--bs-body-bg","--bs-border-color"])
      assert.ok(css.includes(token),token);
  });
  it("préserve un contraste de texte d'au moins 4,5:1 pour fonds, accents et boutons",()=>{
    const surfaceLight="#ffffff",surfaceDark="#1c2735",textLight="#14213b",textDark="#eff4fa";
    assert.ok(contrast(textLight,surfaceLight)>=4.5);
    assert.ok(contrast(textDark,surfaceDark)>=4.5);
    for(const accent of ["#154d8d","#086653","#6037a7","#5236ab"])
      assert.ok(contrast(accent,surfaceLight)>=4.5,accent);
    for(const accent of ["#90bdfb","#86e2c4","#c6b0ff","#b9a5ff"])
      assert.ok(contrast(accent,surfaceDark)>=4.5,accent);
    for(const button of ["#154d8d","#086653","#6037a7","#285c9c","#167d65","#6841a4"])
      assert.ok(contrast("#ffffff",button)>=4.5,button);
  });
  it("n'ajoute qu'une colonne validée et ne supprime aucune donnée métier",()=>{
    assert.match(APPEARANCE_MIGRATION_SQL,/ADD COLUMN palette text NOT NULL DEFAULT 'ocean'/);
    assert.match(APPEARANCE_MIGRATION_SQL,/CHECK \(palette IN \('ocean','forest','violet'\)\)/);
    assert.match(APPEARANCE_MIGRATION_SQL,/schema_version=6/);
    assert.doesNotMatch(APPEARANCE_MIGRATION_SQL,/DROP|DELETE|TRUNCATE|UPDATE public\.smn_team|UPDATE public\.smn_product/i);
  });
});
