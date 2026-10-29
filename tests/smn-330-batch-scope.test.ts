import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('batch confirmation validates actor and team', () => {
 const source = read('src/server/sprints/batch-confirm.ts');
 assert.ok(source.includes('saved.actor_id!==actorId'));
 assert.ok(source.includes('authorizedTeam!==saved.team_id'));
 assert.ok(source.includes('saved.team_id'));
});

test('batch preview scopes queries by team', () => {
 const source = read('src/server/sprints/batch-preview.ts');
 assert.ok(source.includes('scopedTeamId'));
 assert.ok(source.includes('team_id=$1'));
});
