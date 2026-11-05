import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {parseTemplate} from "../src/server/sprints/ceremony-templates";
import {CEREMONY_ICON_COLORS,ceremonyIconColorHex,validateCeremonyAppearance} from "../src/lib/ceremony-appearance";
const raw={name:"Daily Scrum",frequency:"daily",weekday:null,position:null,time:"09:00",duration:15};
test("SMN-229 AC7-8: apparence facultative, catalogue officiel et palette contrôlée",()=>{
 assert.deepEqual(parseTemplate(raw),raw);
 const enhanced={...raw,icon:"calendar3",iconColor:"teal"};
 assert.deepEqual(parseTemplate(enhanced),enhanced);
 assert.equal(parseTemplate({...raw,icon:"not-an-icon"}),null);
 assert.equal(parseTemplate({...raw,icon:"calendar3",iconColor:"color:expression(1)"}),null);
 assert.equal(validateCeremonyAppearance(null,null),true);
 assert.equal(CEREMONY_ICON_COLORS.length,9);
 assert.equal(ceremonyIconColorHex("teal"),"#087f8c");
});
test("SMN-229 AC9: champs persistants, isolation équipe et audit de révision",()=>{
 const src=readFileSync(new URL("../src/server/sprints/ceremony-templates.ts",import.meta.url),"utf8");
 assert.match(src,/icon_name AS icon/);
 assert.match(src,/icon_color AS "iconColor"/);
 assert.match(src,/icon_name=\$10,icon_color=\$11/);
 assert.match(src,/smn_scrum_ceremony_template_history/);
 assert.match(src,/revision=revision\+1/);
 assert.match(src,/WHERE id=\$1 AND team_id=\$2/);
});
test("SMN-229 AC10: migration additive, sauvegarde vérifiée et occurrences préservées",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261105_smn229_ceremony_appearance/migration.sql",import.meta.url),"utf8");
 const script=readFileSync(new URL("../scripts/apply-smn-229-ceremony-appearance.ts",import.meta.url),"utf8");
 assert.match(sql,/ADD COLUMN IF NOT EXISTS icon_name/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS icon_color/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.smn_scrum_template_occurrence|DROP\s+TABLE/i);
 assert.match(script,/SMN_V33_BACKUP_VERIFIED/);
 assert.match(script,/--check/);
});
test("SMN-229 AC7-8: composants partagés et aperçu sans recolorer le texte",()=>{
 const form=readFileSync(new URL("../src/app/app/admin/sprints/template-form.tsx",import.meta.url),"utf8");
 const picker=readFileSync(new URL("../src/app/app/ceremony-color-picker.tsx",import.meta.url),"utf8");
 assert.match(form,/IconPicker/);
 assert.match(form,/CeremonyColorPicker/);
 assert.match(form,/SMNIcon/);
 assert.match(picker,/type="radio"/);
 assert.match(picker,/Par défaut/);
});
