import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SevenGame,WORLD_W,WORLD_H} from '../rules.js';
import {selectionRect,selectUnitsInBox,formationCells,dragMode} from '../playtest/rts-touch-core.js';
import {issueGroupMove} from '../playtest/group-orders.js';
import {staticBlocked,advancePlaytestRoutes} from '../playtest/path-routes.js';
const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('selection rectangle is direction-independent and selects only owned visible units',()=>{
 const units=[
  {id:'a',owner:1,x:20,y:20},{id:'b',owner:1,x:30,y:28},
  {id:'enemy',owner:2,x:25,y:25},{id:'outside',owner:1,x:50,y:50},
  {id:'b',owner:1,x:30,y:28}
 ];
 const project=u=>({x:u.x*2,y:u.y*2});
 assert.deepEqual(selectionRect({x:64,y:61},{x:35,y:35}),{
  left:35,top:35,right:64,bottom:61,width:29,height:26
 });
 const forward=selectUnitsInBox(units,{x:35,y:35},{x:64,y:61},project);
 const backward=selectUnitsInBox(units,{x:64,y:61},{x:35,y:35},project);
 assert.deepEqual(forward,['a','b']);
 assert.deepEqual(backward,forward);
 assert.deepEqual(selectUnitsInBox(units,{x:100,y:100},{x:110,y:110},project),['outside']);
});

test('formation coordinates stay inside world and never duplicate even at edges',()=>{
 const cells=formationCells(0,0,WORLD_W,WORLD_H,{radius:6});
 assert.deepEqual(cells[0],{x:0,y:0});
 assert.equal(new Set(cells.map(p=>p.x+','+p.y)).size,cells.length);
 assert.ok(cells.every(p=>p.x>=0&&p.y>=0&&p.x<WORLD_W&&p.y<WORLD_H));
 assert.ok(formationCells(75,65,WORLD_W,WORLD_H).every(p=>p.x<76&&p.y<66));
});

test('touch grammar keeps MOD pan distinct from plain box and build placement',()=>{
 assert.equal(dragMode({modifier:false,button:0}),'box');
 assert.equal(dragMode({modifier:true,button:0}),'pan');
 assert.equal(dragMode({modifier:false,button:2}),'pan');
 assert.equal(dragMode({placing:true,modifier:false}),'placement');
});

test('group move is safe on invalid requests and refuses busy builder without loss of order',()=>{
 const game=new SevenGame();
 const units=game.units.filter(u=>u.owner===1&&u.kind==='peasant');
 const busy=units[0],free=units[1];busy.buildSiteId='site-demo';
 const before={x:busy.x,y:busy.y};
 assert.equal(issueGroupMove(game,[busy.id,free.id],-1,30).ok,false);
 assert.equal(busy.buildSiteId,'site-demo');
 assert.deepEqual({x:busy.x,y:busy.y},before);
 let moved=null;
 for(let y=16;y<40&&!moved;y++)for(let x=12;x<40&&!moved;x++){
  const result=issueGroupMove(game,[busy.id,free.id],x,y);
  if(result.ordered.includes(free.id))moved=result;
 }
 assert.ok(moved,'expected at least one free formation destination');
 assert.ok(moved.failed.includes(busy.id));
 assert.equal(busy.buildSiteId,'site-demo');
 assert.deepEqual({x:busy.x,y:busy.y},before);
 assert.ok(free.route.length>0||free.target===null);
});

test('two units move on distinct nonblocked formation tiles without teleporting',()=>{
 const game=new SevenGame();
 const members=game.units.filter(u=>u.owner===1&&u.kind==='peasant');
 const before=members.map(u=>({id:u.id,x:u.x,y:u.y}));
 let result=null;
 for(let y=16;y<42&&!result;y++)for(let x=12;x<41&&!result;x++){
  const candidate=issueGroupMove(game,members.map(u=>u.id),x,y);
  if(candidate.ordered.length===2&&members.every(u=>u.route?.length))result=candidate;
 }
 assert.ok(result,'expected a reachable two-person formation');
 assert.equal(result.failed.length,0);
 const destinations=members.map(u=>u.route.at(-1));
 assert.notDeepEqual(destinations[0],destinations[1]);
 for(const p of destinations)assert.equal(staticBlocked(game,p.x,p.y),false);
 assert.deepEqual(members.map(u=>({id:u.id,x:u.x,y:u.y})),before,'orders do not teleport');
 game.paused=true;
 advancePlaytestRoutes(game,2);
 assert.deepEqual(members.map(u=>({id:u.id,x:u.x,y:u.y})),before,'pause freezes paths');
 game.paused=false;
 advancePlaytestRoutes(game,.1);
 assert.ok(members.some((u,i)=>u.x!==before[i].x||u.y!==before[i].y));
});

test('mobile controls are wired to original HTML HUD without adding permanent right reports',()=>{
 const html=source('index.html'),js=source('game.js'),css=source('style.css');
 assert.match(html,/id="touchJoystick"/);
 assert.match(html,/id="touchJoyThumb"/);
 assert.match(html,/id="touchModifier"/);
 assert.match(html,/game\.js\?v=11/);
 assert.match(js,/installMobileRtsControls/);
 assert.match(js,/selectUnitsInBox\(game\.units/);
 assert.match(js,/issueGroupMove\(game,groupUnitIds/);
 assert.match(js,/selectionBox/);
 assert.match(css,/#mobileRtsPad/);
 assert.match(css,/@media \(pointer:fine\),\(orientation:portrait\)/);
 const sidebar=html.split('<aside class="sidebar"')[1].split('</aside>')[0];
 assert.ok(sidebar.includes('id="selectionActions"'));
 assert.ok(!sidebar.includes('id="reportBody"'));
});

test('joystick and MOD share the left edge with vertical spacing and no right-side overlay',()=>{
 const html=source('index.html'),css=source('style.css');
 assert.ok(html.includes('style.css?v=5'));
 const joy=css.split('#touchJoystick{')[1]?.split('}')[0];
 const mod=css.slice(css.lastIndexOf('#touchModifier{')).split('{')[1]?.split('}')[0];
 assert.ok(joy&&mod);
 assert.ok(joy.includes('left:max(8px,env(safe-area-inset-left))'));
 assert.ok(joy.includes('bottom:max(15px,env(safe-area-inset-bottom))'));
 assert.ok(mod.includes('left:max(24px,calc(env(safe-area-inset-left) + 16px))'));
 assert.ok(mod.includes('right:auto'));
 assert.ok(mod.includes('bottom:calc(max(15px,env(safe-area-inset-bottom)) + 114px)'));
 // The 100px joystick and 62px MOD have a 14px vertical gap.
 assert.ok(joy.includes('width:100px;height:100px'));
 assert.ok(mod.includes('height:62px'));
 assert.ok(!mod.includes('top:50%'));
});
