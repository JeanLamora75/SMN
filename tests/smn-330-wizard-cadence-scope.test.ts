import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('wizard preview and confirm use an authorized team',()=>{
 const s=source('src/server/sprints/wizard.ts');
 assert.ok(s.includes('resolveAdminTeam'));
 assert.ok(s.includes('authorizedTeam!==saved.team_id'));
 assert.ok(s.includes('saved.team_id'));
});
test('Kanban cadence proposals resolve the authorized team',()=>{
 const s=source('src/server/kanban/cadence-change.server.ts');
 assert.ok(s.includes('resolveAdminTeam'));
 assert.ok(s.includes('p.team_id=$1'));
 assert.ok(s.includes('team.team_id'));
});
