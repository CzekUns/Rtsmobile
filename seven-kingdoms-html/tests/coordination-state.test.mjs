import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateProgram,verifyFiles} from '../coordination/validate.mjs';

const root=new URL('../coordination/',import.meta.url);
const tasks=JSON.parse(readFileSync(new URL('TASKS.json',root),'utf8'));
const state=JSON.parse(readFileSync(new URL('STATE.json',root),'utf8'));

test('saved Seven Kingdoms orchestrator program and checkpoint are consistent',async()=>{
 const result=await verifyFiles();
 assert.equal(result.ok,true,result.errors.join('; '));
 assert.equal(result.activeTaskId,state.activeTaskId);
 assert.equal(result.taskCount,tasks.tasks.length);
 assert.ok(tasks.tasks.some(t=>t.id===state.activeTaskId),'active task must be in program');
});
test('cannot accidentally declare a task complete without real CI/main proof',()=>{
 const mutated=structuredClone(tasks);
 const active=mutated.tasks.find(t=>t.id===state.activeTaskId);
 assert.ok(active,'expected an executable active task');
 active.status='done';delete active.completion;
 assert.ok(validateProgram(mutated,state).some(e=>e.includes('without main commit')));
});
test('cannot skip program or silently reassign dependent tasks',()=>{
 const changed=structuredClone(tasks);changed.taskOrder[1]='SKH-TERRAIN-002';
 const errors=validateProgram(changed,state);
 assert.ok(errors.some(e=>e.includes('Duplicate task order')));
 assert.ok(errors.some(e=>e.includes('Priority and order differ')));
});
test('state rejects imaginary SHAs and unsupported plan transitions',()=>{
 const changed=structuredClone(state);changed.lastObservedMainSha='not-a-sha';changed.nextTaskAfterActive='SKH-QA-001';
 const errors=validateProgram(tasks,changed);
 assert.ok(errors.some(e=>e.includes('main SHA')));
 assert.ok(errors.some(e=>e.includes('agreed plan')));
});
