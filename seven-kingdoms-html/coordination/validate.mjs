#!/usr/bin/env node
/* Persistent orchestrator state validator — no GitHub network or write access.
 * Checks program consistency; it does not certify the game, CI, or deployment.
 */
import {readFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pathToFileURL} from 'node:url';

const STATUSES=new Set(['queued','ready','in_progress','blocked','verified','awaiting_manual_qa','done']);
const HEX40=/^[0-9a-f]{40}$/i;
export function validateProgram(tasks,state){
 const errors=[];
 const check=(condition,message)=>{if(!condition)errors.push(message);};
 check(tasks?.schemaVersion===1,'TASKS.schemaVersion must be 1');
 check(state?.schemaVersion===1,'STATE.schemaVersion must be 1');
 const orders=tasks?.taskOrder,entries=tasks?.tasks;
 if(!Array.isArray(orders)||!Array.isArray(entries))return [...errors,'TASKS.taskOrder and TASKS.tasks must be arrays'];
 const byId=new Map();
 for(const t of entries){
  if(typeof t?.id!=='string'||!/^SKH-[A-Z]+-[0-9]{3}$/.test(t.id)){errors.push('Invalid task id');continue}
  check(!byId.has(t.id),'Duplicate task id '+t.id);
  byId.set(t.id,t);
  check(STATUSES.has(t.status),'Invalid task status '+t.id);
  check(['integration','assets','towns','ui','core','movement'].includes(t.ownerStream),'Unknown owner '+t.id);
  check(Number.isInteger(t.priority)&&t.priority>=1,'Invalid priority '+t.id);
  check(Array.isArray(t.dependsOn)&&Array.isArray(t.acceptance)&&t.acceptance.length>0,'Missing dependencies or acceptance '+t.id);
  check(Array.isArray(t.scope)&&typeof t.nextAction==='string'&&t.nextAction.length>20,'Missing executable instruction '+t.id);
  check(typeof t.workBranch==='string'&&t.workBranch.startsWith('agent/skh-'+t.ownerStream+'/'),'Task branch outside owner lane '+t.id);
  if(['done','awaiting_manual_qa'].includes(t.status)){
   check(!!t.completion&&HEX40.test(t.completion?.mainSha||'')&&typeof t.completion?.ciUrl==='string',
    'Task '+t.id+' cannot be closed without main commit and CI evidence');
  }
  if(t.status==='done')check(t.completion?.acceptanceVerified===true,'Task done without verified acceptance '+t.id);
  if(t.status==='blocked')check(typeof t.blockingIssue==='string'&&t.blockingIssue.length>8,'Blocked task missing reproducible reason '+t.id);
 }
 check(new Set(orders).size===orders.length,'Duplicate task order entries');
 check(orders.length===byId.size,'Task order and task count differ');
 for(let i=0;i<orders.length;i++){
  const id=orders[i],task=byId.get(id);
  check(!!task,'Task order refers to missing '+id);
  if(!task)continue;
  check(task.priority===i+1,'Priority and order differ '+id);
  for(const dep of task.dependsOn){
   check(byId.has(dep),'Unknown dependency '+dep+' on '+id);
   check(orders.indexOf(dep)<i,'Dependency out of order '+dep+' for '+id);
   check(dep!==id,'Self-dependency '+id);
  }
 }
 check(typeof state?.programRevision==='string'&&state.programRevision.length>4,'Missing program revision');
 check(HEX40.test(state?.lastObservedMainSha||''),'State main SHA must be a real 40-char hex');
 const activeId=state?.activeTaskId;
 check(activeId===null||byId.has(activeId),'Unknown active task '+activeId);
 if(activeId!==null&&byId.has(activeId)){
  const active=byId.get(activeId);
  check(['ready','in_progress','blocked','verified'].includes(active.status),'Active task is not executable '+activeId);
  if(state.activeTaskBranch!==null&&state.activeTaskBranch!==undefined)
   check(state.activeTaskBranch===active.workBranch,'Active branch differs from assigned branch '+activeId);
  const next=orders[orders.indexOf(activeId)+1]||null;
  check(state.nextTaskAfterActive===next,'Next task does not match agreed plan');
  for(const [idx,id] of orders.entries()){
   const t=byId.get(id);
   if(idx<orders.indexOf(activeId))
    check(['done','awaiting_manual_qa'].includes(t.status),'Previous task not technically completed '+id);
  }
 }
 check(state?.planChangesRequireOwnerApproval===true,'Plan must require owner approval');
 const deployed=state?.lastVerifiedPagesDeployment;
 if(deployed!==null&&deployed!==undefined){
  check(HEX40.test(deployed.sha||''),'Deployed SHA invalid');
  check(deployed.result==='success','Unsuccessful Pages may not be called verified');
 }
 return errors;
}

export async function verifyFiles(root=dirname(fileURLToPath(import.meta.url))){
 const [tasks,state]=await Promise.all(['TASKS.json','STATE.json'].map(p=>readFile(join(root,p),'utf8').then(JSON.parse)));
 const errors=validateProgram(tasks,state);
 if(state.activeTaskId){
  try{
   const checkpoint=await readFile(join(root,'checkpoints',state.activeTaskId+'.md'),'utf8');
   if(!checkpoint.includes(state.activeTaskId))errors.push('Checkpoint missing task reference '+state.activeTaskId);
  }catch(e){errors.push('Checkpoint file missing for active task '+state.activeTaskId);}
 }
 for(const p of ['README.md','ROADMAP.md','ORCHESTRATOR.md','DECISIONS.md','HANDOFF.md','QA.md']){
  try{await readFile(join(root,p),'utf8')}catch(e){errors.push('Missing coordination document '+p);}
 }
 return {ok:errors.length===0,errors,activeTaskId:state.activeTaskId,taskCount:tasks.tasks.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 verifyFiles().then(r=>{
  if(!r.ok){console.error(r.errors.join('\n'));process.exitCode=1;}
  else console.log('Coordination state valid: '+r.taskCount+' tasks; active='+r.activeTaskId);
 }).catch(e=>{console.error(e.stack);process.exitCode=1});
}
