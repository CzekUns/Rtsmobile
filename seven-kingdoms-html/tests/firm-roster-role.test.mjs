import test from 'node:test';
import assert from 'node:assert/strict';
import {workerRoleLabel,staffFromUnit,ensureFirmPersonnel} from '../playtest/personnel.js';

test('roster role follows actual assigned unit and is not inferred from firm',()=>{
 const firm={id:'f10',kind:'fort',workers:0};
 const person=staffFromUnit(firm,{id:'u8',kind:'peasant',hp:75,skillId:1,skillLevel:20,culture:'Greci'});
 assert.equal(workerRoleLabel(person),'Abitante');
 assert.equal(person.hp,75);
 assert.equal(person.skillId,1);
});
test('legacy numeric workers are explicitly unknown, not historical soldier identities',()=>{
 const firm={id:'f11',kind:'fort',workers:2};
 ensureFirmPersonnel(firm);
 assert.equal(firm.staff.length,2);
 assert.deepEqual(firm.staff.map(workerRoleLabel),['Ruolo storico non verificato','Ruolo storico non verificato']);
 assert.equal(firm.staff[0].personId,null);
});
test('soldier role and unknown role are distinct',()=>{
 assert.equal(workerRoleLabel({kind:'soldier'}),'Soldato');
 assert.equal(workerRoleLabel({kind:'unknown'}),'Ruolo non registrato');
});
