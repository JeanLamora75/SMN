import {test} from "node:test";
import assert from "node:assert/strict";
import {rehearsalMigrationUri} from "../src/server/teams/rehearsal-target";

const source="postgresql://smn:secret@localhost:57085/smn";
const flags=["--apply","--rehearsal","--backup-file=C:/safe/dump"];
test("répétition refuse la cible absente ou identique",()=>{
 assert.throws(()=>rehearsalMigrationUri(flags,undefined,source),/target-uri-required/);
 assert.throws(()=>rehearsalMigrationUri(flags,source,source),/not-isolated/);
 assert.throws(()=>rehearsalMigrationUri(flags,"postgresql://smn:pass@127.0.0.1:57085/copie",source),/not-isolated/);
});
test("répétition interdit serveur distant et option non explicite",()=>{
 assert.throws(()=>rehearsalMigrationUri(flags,"postgresql://smn:pass@example.com:56000/copie",source),/must-be-loopback/);
 assert.throws(()=>rehearsalMigrationUri(["--apply"],"postgresql://smn:pass@localhost:56000/copie",source),/explicit-approval-required/);
});
test("répétition autorise un port distinct local explicitement déclaré",()=>{
 assert.equal(new URL(rehearsalMigrationUri(flags,"postgresql://smn:pass@localhost:56000/copie",source)).port,"56000");
});
