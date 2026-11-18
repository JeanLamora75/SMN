import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("indicator definition uses a visual hex picker instead of free text",()=>{
 const editor=read("src/app/app/admin/indicators/catalog-client.tsx");
 assert.match(editor,/import \{HexColorPicker\} from "\.\.\/\.\.\/hex-color-picker"/);
 assert.match(editor,/<HexColorPicker value=\{color\} onChange=\{setColor\} disabled=\{busy\}/);
 assert.doesNotMatch(editor,/<input className="form-control" value=\{color\}/);
 assert.match(editor,/color:color\|\|null/);
 assert.match(editor,/setColor\(d\?\.color\?\?""\)/);
});
test("color picker reuses Cockpit palette and preserves stored #RRGGBB colors",()=>{
 const picker=read("src/app/app/hex-color-picker.tsx");
 assert.match(picker,/CEREMONY_ICON_COLORS/);
 assert.match(picker,/type="color"/);
 assert.match(picker,/HEX\.test\(value\)/);
 assert.match(picker,/value=\{current\}/);
 assert.match(picker,/onChange=\{event=>onChange\(event\.target\.value\)\}/);
 assert.match(picker,/onClick=\{\(\)=>onChange\(color\.hex\)\}/);
 assert.match(picker,/onClick=\{\(\)=>onChange\(""\)\}/);
});
