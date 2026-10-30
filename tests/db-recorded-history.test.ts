import {test} from "node:test";
import {strict as assert} from "node:assert";
import {checkRecordedMigrationJournal} from "../scripts/db-recorded-history";
const row={migration_name:"historique",checksum:"a".repeat(64),finished_at:new Date(),rolled_back_at:null};
test("journal cohérent sans dépendance à la source SQL historique",()=>{
 assert.deepEqual(checkRecordedMigrationJournal([row],1),[]);
});
test("détecte doublons, versions, états et empreintes invalides",()=>{
 assert.ok(checkRecordedMigrationJournal([row],2).some(x=>x.includes("version")));
 assert.ok(checkRecordedMigrationJournal([row,row],2).some(x=>x.includes("double")));
 assert.ok(checkRecordedMigrationJournal([{...row,finished_at:null}],1).some(x=>x.includes("terminée")));
 assert.ok(checkRecordedMigrationJournal([{...row,checksum:"invalid"}],1).some(x=>x.includes("Empreinte")));
});
