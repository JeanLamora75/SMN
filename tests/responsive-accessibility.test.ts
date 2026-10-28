import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";

/** Contrôles source statiques, non substituables à une recette navigateur/lecteur d'écran. */
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("SMN-25 — structure responsive et accessibilité de base",()=>{
  it("propose un seul lien d'évitement commun qui cible chaque main public et privé",()=>{
    const root=source("src/app/layout.tsx");
    const app=source("src/app/app/layout.tsx");
    const shell=source("src/app/app/private-shell.tsx");
    assert.match(root,/href="#smn-main"/);
    assert.match(root,/navigation\.skip/);
    assert.doesNotMatch(app,/href="#smn-main"/);
    assert.match(shell,/id="smn-main"/);
    assert.match(app,/PrivateShell/);
    for(const path of ["src/app/page.tsx","src/app/login/page.tsx",
      "src/app/welcome/page.tsx","src/app/change-password/page.tsx","src/app/not-found.tsx"]){
      assert.match(source(path),/<main id="smn-main"/,path);
    }
  });
  it("contient des styles de focus clavier, des cibles mobiles et la réduction de mouvement",()=>{
    const css=source("src/app/globals.css");
    assert.match(css,/\.smn-skip-link:focus-visible/);
    assert.match(css,/:focus-visible/);
    assert.match(css,/prefers-reduced-motion:reduce/);
    assert.match(css,/min-height:44px/);
    assert.match(css,/@media \(max-width:575\.98px\)/);
  });
  it("transforme la table des comptes en fiches mobiles sans masquer ses contrôles",()=>{
    const table=source("src/app/app/admin/users/users-admin.tsx");
    const css=source("src/app/globals.css");
    assert.match(table,/smn-accounts-table/);
    assert.match(table,/smn-accounts-responsive/);
    for(const key of ["userCol","emailCol","roleCol","accessCol","actionCol"])
      assert.ok(table.includes(`data-label={t("accounts.${key}")}`),key);
    assert.match(css,/\.smn-accounts-responsive\{overflow-x:visible;\}/);
    assert.match(css,/\.smn-accounts-table tbody td\{display:grid/);
    assert.match(css,/content:attr\(data-label\)/);
    assert.match(table,/aria-label=\{t\("accounts\.roleFor"/);
    assert.match(table,/aria-label=\{t\("accounts\.accessFor"/);
  });
  it("relie les messages des formulaires à leurs contrôles et distingue erreurs de succès",()=>{
    for(const [path,selector] of [
      ["src/app/login/login-form.tsx","login-feedback"],
      ["src/app/change-password/password-form.tsx","password-feedback"],
      ["src/app/setup/setup-form.tsx","setup-feedback"],
      ["src/app/welcome/welcome-form.tsx","welcome-feedback"],
      ["src/app/app/admin/settings/settings-form.tsx","settings-feedback"],
      ["src/app/app/security/security-form.tsx","security-feedback"],
      ["src/app/app/admin/users/users-admin.tsx","accounts-feedback"],
    ] as const){
      const body=source(path);
      assert.ok(body.includes(`id="${selector}"`),path);
      assert.ok(body.includes("aria-describedby"),path);
    }
    assert.match(source("src/app/login/login-form.tsx"),/aria-invalid=\{!!error\}/);
    assert.match(source("src/app/change-password/password-form.tsx"),/confirmationError/);
    assert.match(source("src/app/app/security/security-form.tsx"),/role=\{error\?"alert":"status"\}/);
    assert.match(source("src/app/app/admin/users/users-admin.tsx"),/role=\{messageError\?"alert":"status"\}/);
  });
  it("cache les symboles décoratifs au lecteur d'écran sans cacher le libellé de la navigation",()=>{
    const nav=source("src/app/app/private-navigation.tsx");
    assert.match(nav,/<span className="smn-nav-icon" aria-hidden="true"><BootstrapIcon name=\{entry\.icon\}\/><\/span>/);
    assert.match(nav,/\{t\(entry\.label\)\}/);
    assert.match(nav,/aria-current=/);
    assert.match(nav,/aria-disabled="true"/);
  });
});
