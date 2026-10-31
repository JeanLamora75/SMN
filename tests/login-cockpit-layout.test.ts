import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("sign-in page is viewport centered and uses existing header logo",()=>{
 const page=read("src/app/login/page.tsx");
 const css=read("src/app/login/login.css");
 assert.match(page,/smn-login-page/);
 assert.match(page,/smn-mark/);
 assert.match(page,/smn-brand-name/);
 assert.match(css,/place-items:center/);
 assert.match(css,/white-space:nowrap/);
 assert.doesNotMatch(page,/login\.intro|login\.back/);
});
test("localized title and preserved login fields",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json"));
 const en=JSON.parse(read("src/i18n/en.json"));
 assert.equal(fr.login.title,"Connexion...");
 assert.equal(en.login.title,"Sign in...");
 const form=read("src/app/login/login-form.tsx");
 assert.match(form,/login\.identity/);assert.match(form,/login\.password/);
});
