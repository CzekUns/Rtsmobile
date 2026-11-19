import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateProgram,verifyFiles} from '../coordination/validate.mjs';

const root=new URL('../coordination/',import.meta.url);
const tasks=JSON.parse(readFileSync(new URL('TASKS.json',root),'utf8'));
const state=JSON.parse(readFileSync(new URL('STATE.json',root),'utf8'));
const terminal=state.activeTaskId===null;

test('saved Seven Kingdoms orchestrator program and checkpoint are consistent',async()=>{
 const result=await verifyFiles();
 assert.equal(result.ok,true,result.errors.join('; '));
 assert.equal(result.activeTaskId,state.activeTaskId);
 assert.equal(result.taskCount,tasks.tasks.length);
 if(terminal){
  assert.equal(state.activeTaskBranch,null,'terminal program cannot retain an active branch');
  assert.equal(state.nextTaskAfterActive,null,'terminal program cannot schedule an unapproved successor');
  assert.ok(tasks.tasks.every(t=>['done','awaiting_manual_qa'].includes(t.status)),
   'terminal program cannot leave executable or queued tasks');
 }else{
  assert.ok(tasks.tasks.some(t=>t.id===state.activeTaskId),'active task must be in program');
 }
});

test('cannot accidentally declare a task complete without real CI/main proof',()=>{
 const mutated=structuredClone(tasks);
 const candidate=mutated.tasks.find(t=>t.id===state.activeTaskId)??mutated.tasks.at(-1);
 assert.ok(candidate,'expected a task in the approved program');
 candidate.status='done';delete candidate.completion;
 assert.ok(validateProgram(mutated,state).some(e=>e.includes('without main commit')));
});

test('cannot skip program or silently reassign dependent tasks',()=>{
 const changed=structuredClone(tasks);changed.taskOrder[1]='SKH-TERRAIN-002';
 const errors=validateProgram(changed,state);
 assert.ok(errors.some(e=>e.includes('Duplicate task order')));
 assert.ok(errors.some(e=>e.includes('Priority and order differ')));
});

test('state rejects imaginary SHAs and unsupported plan transitions',()=>{
 const changed=structuredClone(state);changed.lastObservedMainSha='not-a-sha';
 if(terminal){
  changed.activeTaskId='SKH-UNAPPROVED-999';
  changed.nextTaskAfterActive=tasks.taskOrder[0];
 }else{
  changed.nextTaskAfterActive=tasks.taskOrder[0];
 }
 const errors=validateProgram(tasks,changed);
 assert.ok(errors.some(e=>e.includes('main SHA')));
 assert.ok(errors.some(e=>e.includes(terminal?'Unknown active task':'agreed plan')));
});

test('terminal handoff retains pending manual QA without inventing a successor',()=>{
 if(!terminal)return;
 assert.equal(state.nextTaskAfterActive,null);
 assert.ok(state.awaitingManualValidation.some(v=>v.taskId==='SKH-QA-001'));
 assert.equal(tasks.tasks.at(-1).status,'awaiting_manual_qa');
 assert.ok(validateProgram(tasks,state).length===0);
});
