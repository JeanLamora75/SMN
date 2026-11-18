import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("indicator creation and editing use visual color and icon selectors",()=>{
 const source=read("src/app/app/admin/indicators/catalog-client.tsx");
 assert.match(source,/<HexColorPicker value=\{color\} onChange=\{setColor\}/);
 assert.match(source,/<IconPicker value=\{icon\} onChange=\{name=>setIcon/);
 assert.doesNotMatch(source,/input className="form-control" value=\{color\}/);
 assert.doesNotMatch(source,/input className="form-control" value=\{icon\}/);
});
test("absence categories use one required, visual hexadecimal selector",()=>{
 const source=read("src/app/app/admin/absence-categories/absence-categories-admin.tsx");
 const picker=read("src/app/app/hex-color-picker.tsx");
 assert.match(source,/<HexColorPicker value=\{draft\.color\}/);
 assert.match(source,/allowClear=\{false\}/);
 assert.doesNotMatch(source,/id="absence-category-color" className="form-control" type="text"/);
 assert.match(picker,/\{allowClear&&<button/);
 assert.match(picker,/type="color"/);
 assert.match(picker,/CEREMONY_ICON_COLORS\.map/);
});
test("companies use color swatches without changing semantic color codes",()=>{
 const source=read("src/app/app/admin/companies/companies-admin.tsx");
 assert.match(source,/const palette=\["blue","indigo","violet","teal","green","amber","orange","red"\]/);
 assert.match(source,/colorSwatches\[color\]/);
 assert.match(source,/aria-pressed=\{draft\.color===color\}/);
 assert.match(source,/onClick=\{\(\)=>setDraft\(x=>\(\{\.\.\.x,color\}\)\)\}/);
 assert.doesNotMatch(source,/<select id="company-color"/);
});
test("ceremonies, dashboard and charts already expose visual selectors",()=>{
 const ceremony=read("src/app/app/admin/sprints/template-form.tsx");
 const dashboard=read("src/app/app/dashboard-builder/dashboard-editor.tsx");
 const charts=read("src/app/app/admin/settings/reports/charts/style-editor.tsx");
 assert.match(ceremony,/<IconPicker value=\{form\.icon/);
 assert.match(ceremony,/onColorChange=\{iconColor=>/);
 assert.match(dashboard,/<IconPicker value=\{block\.icon/);
 assert.match(dashboard,/onColorChange=\{color=>setBlockIconColor/);
 assert.ok((charts.match(/type="color"/g)??[]).length>=3);
});
