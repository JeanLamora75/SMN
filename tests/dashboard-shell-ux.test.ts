import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {translate} from "../src/i18n/catalog";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const shell=source("src/app/app/private-shell.tsx");
const layout=source("src/app/app/layout.tsx");
const nav=source("src/app/app/private-navigation.tsx");
const css=source("src/app/dashboard.css");

describe("SMN-21 — refonte UX, lot 1 : coque de navigation",()=>{
  it("maintient les contrôles d'accès serveur avant de transmettre le contexte collectif",()=>{
    assert.match(layout,/await currentAccount\(\)/);
    assert.match(layout,/canAccess\(account,"read"/);
    assert.match(layout,/withAuthDb\(db=>readAccountDashboard\(db,/);
    assert.match(layout,/teamId=\{context\?\.teamId\?\?null\}/);
    assert.match(shell,/mode==="kanban"\?"\/api\/kanban\/context":"\/api\/sprints\/context"/);
    assert.doesNotMatch(shell,/smn_account|password_hash/i);
  });
  it("place les sélecteurs Équipe et Cycle avant une recherche explicitement indisponible",()=>{
    const team=shell.indexOf("<ActiveTeamSelector");
    const cycle=shell.indexOf('id="smn-current-cycle"');
    const search=shell.indexOf('id="smn-global-search"');
    assert.ok(team>0&&cycle>team&&search>cycle);
    assert.match(shell,/teamId=\{teamId\} teamName=\{team\}/);
    assert.match(shell,/value=\{selectedCycleId\} onChange=\{event=>changeSprint/);
    assert.match(shell,/sprints\.map\(item=><option/);
    assert.match(shell,/disabled=\{\(!teamSwitcherEnabled&&mode!=="scrum"\)/);
    assert.match(shell,/disabled placeholder=\{t\("dashboard.shell.searchUnavailable"\)\}/);
    assert.match(shell,/noCycle/);
    assert.doesNotMatch(shell,/mock|fake|demo|sample|Math\.random/i);
  });
  it("propose le repli clavier desktop, un menu mobile et la fermeture via Escape",()=>{
    assert.match(shell,/aria-controls="smn-private-sidebar"/);
    assert.match(shell,/aria-expanded=\{!collapsed\}/);
    assert.match(shell,/aria-expanded=\{mobileOpen\}/);
    assert.match(shell,/event\.key==="Escape"/);
    assert.match(shell,/mobileButton\.current\?\.focus\(\)/);
    assert.match(nav,/onClick=\{onNavigate\}/);
    assert.match(nav,/aria-label=\{t\(entry\.label\)\}/);
    assert.match(nav,/aria-disabled="true"/);
  });
  it("supprime la largeur maximale fixe et adapte la sidebar à tous les écrans",()=>{
    assert.match(css,/\.smn-dashboard-width \{width:100%;max-width:none/);
    assert.match(css,/grid-template-columns:224px minmax\(0,1fr\)/);
    assert.match(css,/grid-template-columns:64px minmax\(0,1fr\)/);
    assert.match(css,/@media \(max-width:991\.98px\)/);
    assert.match(css,/@media \(max-width:575\.98px\)/);
    assert.match(css,/min-width:44px;min-height:44px/);
    assert.match(css,/\.smn-private-layout\.mobile-open \.smn-sidebar-region/);
    assert.match(css,/var\(--smn-surface\)/);
    assert.match(css,/var\(--smn-border\)/);
  });
  it("traduit chaque commande nouvelle dans les deux langues",()=>{
    for(const locale of ["fr","en"] as const){
      for(const key of ["team","sprint","period","singleTeam","noTeam","noCycle","loadingCycles","cycleUnavailable",
        "search","searchUnavailable","contextControls","openMenu","closeMenu",
        "expandMenu","collapseMenu"] as const){
        const text=translate(locale,`dashboard.shell.${key}`);
        assert.ok(text.trim());
        assert.doesNotMatch(text,/indisponible de traduction|translation unavailable/i);
      }
    }
  });
});
