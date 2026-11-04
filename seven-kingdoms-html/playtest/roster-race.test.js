import test from 'node:test';
import assert from 'node:assert/strict';
import {rosterRaceLabel} from './roster-race.js';

test('explicit numeric raceId is displayed without translating it to a guessed culture',()=>{
 assert.equal(rosterRaceLabel({raceId:3,culture:'Greci'}),'Razza #3 · Greci');
});
test('legacy worker race remains unknown even when a culture string exists',()=>{
 assert.equal(rosterRaceLabel({raceId:null,culture:'Normanni'}),'Razza non identificata · Normanni');
});
test('invalid and absent race IDs never become race zero',()=>{
 for(const raceId of [undefined,null,0,-1,2.5,'2']){
  assert.equal(rosterRaceLabel({raceId}),'Razza non identificata');
 }
});
