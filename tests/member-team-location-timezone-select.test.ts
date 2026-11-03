import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const editor=readFileSync(new URL("../src/app/app/admin/members/[id]/member-team-planning-editor.tsx",import.meta.url),"utf8");

test("la modale de localisation propose une liste de fuseaux IANA plutôt qu'une saisie libre",()=>{
 assert.match(editor,/Intl\.supportedValuesOf\("timeZone"\)/);
 assert.match(editor,/<select className="form-select mt-1" value=\{location\.timeZone\}/);
 assert.match(editor,/timeZones\.map\(zone=><option key=\{zone\} value=\{zone\}>\{zone\}<\/option>\)/);
 assert.doesNotMatch(editor,/field\("timeZone"/);
});

test("la sélection conserve les fuseaux existants, UTC et l'absence de valeur",()=>{
 assert.match(editor,/\["UTC",\.\.\.Intl\.supportedValuesOf\("timeZone"\)\]/);
 assert.match(editor,/<option value="">Non renseigné<\/option>/);
 assert.match(editor,/location\.timeZone&&!timeZones\.includes\(location\.timeZone\)/);
 assert.match(editor,/timeZone:e\.target\.value/);
 assert.match(editor,/timeZone:location\.timeZone\.trim\(\)\|\|null/);
});
