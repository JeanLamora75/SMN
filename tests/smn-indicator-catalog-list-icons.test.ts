import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("the catalog list shows a dedicated icon column before indicator code",()=>{
 const source=read("src/app/app/admin/indicators/catalog-client.tsx");
 const header=source.indexOf('className="smn-indicator-catalog-icon-cell">{t("indicators.icon")}');
 const codeHeader=source.indexOf('<th>{t("indicators.tag")}</th>',header);
 const iconRow=source.indexOf('<td className="smn-indicator-catalog-icon-cell">{d.icon&&');
 const codeRow=source.indexOf('<th scope="row">{d.tag}</th>',iconRow);
 assert.ok(header>=0&&codeHeader>header);
 assert.ok(iconRow>=0&&codeRow>iconRow);
 assert.match(source,/<SMNIcon name=\{d\.icon\}\/>/);
 assert.match(source,/style=\{\{color:d\.color\|\|"var\(--smn-brand\)"\}\}/);
 assert.match(source,/\{d\.icon&&<span/);
});

test("the shared icon is centered and fills the narrow table cell",()=>{
 const css=read("src/app/app/admin/settings/indicators/indicator-settings-cockpit.css");
 assert.match(css,/smn-indicator-catalog-icon-cell/);
 assert.match(css,/width:52px;min-width:52px;max-width:52px/);
 assert.match(css,/font-size:1\.8rem/);
 assert.match(css,/justify-content:center/);
});
