import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareSignatures} from '../scripts/smn-351-schema-compare';
test('identical schema signatures authorize equality only',()=>{
 const a=[{kind:'table',name:'smn_team',definition:'r'},{kind:'column',name:'smn_team.id',definition:'uuid'}];
 assert.equal(compareSignatures(a,[...a].reverse()).identical,true);
 const diff=compareSignatures(a,[a[0]]);
 assert.equal(diff.identical,false);
 assert.equal(diff.freshOnly.length,1);
 assert.equal(diff.migratedOnly.length,0);
});
test('cleanup preflight is non destructive and always blocks automatic DROP',()=>{
 const s=readFileSync('scripts/smn-351-cleanup-preflight.ts','utf8');
 assert.match(s,/authorized:false/);
 assert.match(s,/destructiveOperationExecuted:false/);
 assert.match(s,/schema-comparison-not-verified/);
 assert.doesNotMatch(s,/DROP TABLE|TRUNCATE TABLE/);
});
test('comparator requires isolated databases and read-only transaction',()=>{
 const s=readFileSync('scripts/smn-351-schema-compare.ts','utf8');
 assert.match(s,/BEGIN READ ONLY/);
 assert.match(s,/fresh===active\|\|migrated===active/);
 assert.match(s,/v33-required/);
});
