import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {translate} from "../src/i18n/catalog";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("src/app/app/private-shell.tsx");
const nav=read("src/app/app/private-navigation.tsx");
const dashboardCss=read("src/app/dashboard.css");
const appearance=read("src/app/appearance.css");

type Colors=Record<string,string>;
function rule(selector:string):Colors {
  const quoted=selector.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const match=appearance.match(new RegExp(quoted+"\\s*\\{([^}]*)\\}"));
  assert.ok(match,`Missing palette rule: ${selector}`);
  return Object.fromEntries([...match[1].matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{3,8})/gi)]
    .map(([,name,color])=>[name,color]));
}
function themeColors(mode:"light"|"dark",palette:"ocean"|"forest"|"violet"):Colors {
  return Object.assign({},
    rule(':root,[data-bs-theme="light"]'),
    rule(':root,[data-smn-palette="ocean"]'),
    palette==="ocean"?{}:rule(`[data-smn-palette="${palette}"]`),
    mode==="dark"?rule('[data-bs-theme="dark"]'):{},
    mode==="dark"?rule(`[data-bs-theme="dark"][data-smn-palette="${palette}"]`):{});
}
function luminance(value:string):number {
  const hex=value.slice(1);
  const full=hex.length===3?[...hex].map(x=>x+x).join(""):hex;
  assert.equal(full.length,6);
  const channels=[0,2,4].map(index=>parseInt(full.slice(index,index+2),16)/255)
    .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}
function contrast(a:string,b:string):number {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}

describe("SMN-21 — lot 4 : audit statique accessibilité et responsive",()=>{
  it("garde les contrôles natifs étiquetés et expose la cause de leur indisponibilité",()=>{
    for(const id of ["smn-current-cycle","smn-global-search"]){
      assert.ok(source.includes(`htmlFor="${id}"`),id);
      assert.ok(source.includes(`id="${id}"`),id);
    }
    for(const id of ["smn-cycle-help","smn-search-help"]){
      assert.ok(source.includes(`id="${id}"`),id);
      assert.ok(source.includes(`aria-describedby="${id}"`),id);
    }
    const selector=read("src/app/app/active-team-selector.tsx");
    assert.match(selector,/htmlFor="smn-current-team"/);
    assert.match(selector,/id="smn-current-team"/);
    assert.match(selector,/aria-describedby="smn-team-help"/);
    assert.match(source,/aria-controls="smn-private-sidebar"/);
    assert.match(source,/aria-expanded=\{!collapsed\}/);
    assert.match(source,/aria-expanded=\{mobileOpen\}/);
    assert.match(source,/event\.key==="Escape"/);
    assert.match(source,/mobileButton\.current\?\.focus\(\)/);
    assert.match(nav,/aria-current=\{/);
    assert.match(nav,/aria-disabled="true"/);
  });
  it("empêche la sidebar repliée de rendre ses entrées inatteignables",()=>{
    assert.match(dashboardCss,/\.smn-private-layout\.is-collapsed \.smn-sidebar-region\s*\{[^}]*height:auto;[^}]*overflow:visible/s);
    assert.match(dashboardCss,/\.smn-private-layout\.is-collapsed \.smn-nav-label/);
    assert.match(dashboardCss,/\.smn-nav-link:focus-visible \.smn-nav-label/);
  });
  it("place les sélecteurs l'un sous l'autre à 320 et 375 px, sans scroll de grille forcé",()=>{
    assert.match(dashboardCss,/@media \(max-width:480px\)/);
    assert.match(dashboardCss,/\.smn-header-controls\s*\{grid-template-columns:minmax\(0,1fr\);\}/);
    assert.match(dashboardCss,/\.smn-header-search\s*\{grid-column:auto;\}/);
    assert.match(dashboardCss,/@container \(max-width:650px\)/);
    assert.match(dashboardCss,/@container \(max-width:520px\)/);
    assert.match(dashboardCss,/\.smn-operational-grid\s*\{grid-template-columns:minmax\(0,1fr\);\}/);
    assert.match(dashboardCss,/\.smn-private-layout\.is-collapsed \.smn-nav-workspace,[\s\S]*?display:block;/);
    assert.match(dashboardCss,/:focus-visible/);
  });
  it("garantit un contraste textuel de 4,5:1 sur les surfaces des six combinaisons",()=>{
    const palettes=["ocean","forest","violet"] as const;
    const modes=["light","dark"] as const;
    for(const mode of modes)for(const palette of palettes){
      const colors=themeColors(mode,palette);
      for(const [foreground,background] of [
        ["--smn-text","--smn-surface"],
        ["--smn-muted","--smn-surface"],
        ["--smn-soft-text","--smn-soft"],
        ["--smn-unavailable-text","--smn-unavailable"],
        ["--smn-primary","--smn-highlight"],
      ]){
        assert.ok(colors[foreground]&&colors[background],`${mode}/${palette}: ${foreground}/${background}`);
        assert.ok(contrast(colors[foreground],colors[background])>=4.5,
          `${mode}/${palette}: ${foreground} vs ${background}`);
      }
    }
  });
  it("préserve les textes FR/EN et la séparation des rôles serveur",()=>{
    const page=read("src/app/app/page.tsx");
    assert.match(page,/currentAccount\(\)/);
    assert.match(page,/canAccess\(account, "read"/);
    assert.match(page,/readAccountDashboard/);
    assert.match(page,/account.role==="admin"/);
    assert.match(page,/OperationalOverview/);
    for(const locale of ["fr","en"] as const){
      for(const key of ["openMenu","closeMenu","expandMenu","collapseMenu",
        "team","searchUnavailable","noCycle"] as const){
        const label=translate(locale,`dashboard.shell.${key}`);
        assert.ok(label.length>0);
        assert.doesNotMatch(label,/translation unavailable|traduction indisponible/i);
      }
      assert.ok(translate(locale,"dashboard.operational.empty"));
    }
  });
});
