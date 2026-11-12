import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SevenGame} from '../rules.js';
import {isBuilder,issueBuildOrder} from '../playtest/construction.js';

const code=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const markup=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const styles=readFileSync(new URL('../style.css',import.meta.url),'utf8');

test('contextual town UI has race-specific recruit and six trainable profession actions',()=>{
 assert.match(code,/data-town-race/);
 assert.match(code,/aria-pressed/);
 assert.match(code,/game\.recruit\(obj\.id,obj\.selectedRaceId\)/);
 assert.match(code,/SKILLS\.filter\(s=>s\.trainable\)/);
 assert.match(code,/data-train-skill/);
 assert.match(code,/game\.trainSkill\(town\.id,town\.selectedRaceId/);
 assert.match(code,/data-cancel-training/);
 assert.match(code,/game\.cancelTraining\(/);
 assert.match(styles,/\.town-race-choice\.active/);
 assert.match(markup,/game\.js\?v=15/);
});

test('all village actions remain in the selection-only sidebar, reports are still separate',()=>{
 const sidebar=markup.split('<aside class="sidebar"')[1]?.split('</aside>')[0]||'';
 assert.ok(sidebar.includes('id="selectionActions"'));
 assert.equal(sidebar.includes('id="reportBody"'),false);
 assert.match(code,/btn\('tax','Tasse'/);
 assert.match(code,/btn\('grant','Sussidio/);
});

test('a trained ethnic-specific builder can really order a site with its existing skill',()=>{
 const game=new SevenGame(),town=game.ownTowns()[0],baseline=game.units.length;
 assert.equal(game.trainSkill(town.id,'norman',1).ok,true);
 for(let i=0;i<5;i++)game.advanceDay();
 assert.equal(game.units.length,baseline+1);
 const unit=game.units.at(-1);
 assert.equal(unit.raceId,'norman');
 assert.equal(isBuilder(unit),true);
 let succeeded=false;
 for(let y=20;y<=36&&!succeeded;y++)for(let x=20;x<=36&&!succeeded;x++){
  const result=issueBuildOrder(game,unit.id,'market',x,y);
  if(result.ok){
   succeeded=true;
   assert.equal(result.site.builderId,unit.id);
   assert.equal(result.site.status,'walking');
  }
 }
 assert.equal(succeeded,true,'the new unit must be usable as a Construction Worker');
});
