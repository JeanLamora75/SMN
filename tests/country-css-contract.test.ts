import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

describe("Pays — styles du calendrier",()=>{
 const css=readFileSync(new URL("../src/app/globals.css",import.meta.url),"utf8");
 const component=readFileSync(new URL("../src/app/app/admin/countries/country-calendar-modal.tsx",import.meta.url),"utf8");
 it("préserve les classes du calendrier et la modale native",()=>{
  for(const name of ["smn-country-calendar-dialog","smn-country-month-grid",
    "smn-country-month-day","smn-country-holiday-day","smn-country-calendar-footer"]){
   assert.ok(css.includes("."+name),name);
   assert.ok(component.includes(name),name);
  }
  assert.match(css,/@media\(max-width:767px\)/);
  assert.match(css,/\.smn-country-calendar-dialog::backdrop/);
 });
});
