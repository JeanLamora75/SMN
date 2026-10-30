import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=readFileSync(new URL("../src/app/app/cycle-overview.tsx",import.meta.url),"utf8");
test("Tableau de bord : la carte Capacité ne propose plus Vérifier la capacité",()=>{
 const start=source.indexOf('<KpiMetricPair title={t("dashboard.cockpit.capacity")}');
 const end=source.indexOf('<KpiMetricPair title={t("dashboard.cockpit.storyPoints")}',start);
 assert.ok(start>=0&&end>start);
 const card=source.slice(start,end);
 assert.doesNotMatch(card,/capacityDiagnosis|development-capacity|\baction=/);
 assert.match(card,/projection\?\.capacity\.initialJh/);
 assert.match(card,/projection\?\.capacity\.actualJh/);
});
