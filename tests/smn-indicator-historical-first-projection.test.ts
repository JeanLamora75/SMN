import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateHistorical} from "../src/server/indicators/formula/history";
import {parseFormula,referencedTags} from "../src/server/indicators/formula";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const catalog=source("src/server/indicators/catalog.ts");
const ui=source("src/app/app/admin/indicators/catalog-client.tsx");
const historical=source("src/server/indicators/formula/historical-context.ts");

test("Nouvel indicateur historique : AVG_LAST est reconnu et sa source référencée",()=>{
 const expression="AVG_LAST(SP_FIN, 5)";
 assert.deepEqual(referencedTags(parseFormula(expression)),["SP_FIN"]);
 const output=calculateHistorical("AVG_LAST",[
  {cycleId:"s1",label:"S1",value:"33"},
  {cycleId:"s2",label:"S2",value:"26.5"},
  {cycleId:"s3",label:"S3",value:"37"},
 ],5);
 assert.deepEqual(output,{kind:"available",value:"32.166666666666666666666667"});
});
test("La création initialise toute formule calculée, pas seulement ROLE_JH",()=>{
 assert.match(catalog,/if\(command\.indicatorType==="computed"\)\{\s*const teams=/);
 assert.doesNotMatch(catalog,/if\(command\.indicatorType==="computed"&&\/\\b/);
 assert.match(catalog,/recalculateIndicatorResultsWithinTransaction\(db,\{teamId:team\.id,changedIndicatorIds:\[indicatorId\]\}\)/);
});
test("Administrateur : régénération explicite des résultats existants sous transaction",()=>{
 assert.match(catalog,/\{action:"recalculate";teamId:string\}/);
 assert.match(catalog,/if\(command\.action==="recalculate"\)/);
 assert.match(catalog,/guard\(actor\.role==="admin","forbidden"\)/);
 assert.match(catalog,/recalculateIndicatorResultsWithinTransaction\(db,\{teamId:command\.teamId\}\)/);
 assert.match(ui,/Recalculer les indicateurs/);
 assert.match(ui,/smn:indicators-saved/);
});
test("Le moteur historique ne lit que les cycles de l'équipe et n'inclut pas le futur",()=>{
 assert.match(historical,/WHERE team_id=\$1 AND deleted_at IS NULL ORDER BY/);
 assert.match(historical,/cycles\.rows\.slice\(0,index\+1\)/);
});
