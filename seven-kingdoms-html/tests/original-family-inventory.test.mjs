import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inventoryOriginalFamilies,inventorySpriteRecords,validateSpriteCode,summarizeSpriteActions} from '../tools/assets/inventory-families.mjs';

test('source inventory refuses absent original STD.SET instead of inventing races',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'skh-structures-'));
  try{
    await assert.rejects(inventoryOriginalFamilies(dir),/Missing original RESOURCE\/(STD\.SET|I_FIRM\.RES|PAL_STD\.RES)/);
  }finally{await rm(dir,{recursive:true,force:true})}
});

test('all source sprite records are retained without inferred race assignment',async()=>{
  const rows=[{code:'GREEK_M',turnResolution:8},{code:'NORMAN_M',turnResolution:8},{code:'MISSING',turnResolution:4}];
  const requested=[];
  const catalog=await inventorySpriteRecords(rows,async code=>{
    requested.push(code);
    if(code==='MISSING')throw Object.assign(Error('Missing original SPRITE/MISSING.SPR under fixture'),{code:'ENOENT'});
    return Buffer.from(code);
  });
  assert.deepEqual(requested,rows.map(row=>row.code));
  assert.deepEqual(catalog.map(item=>item.code),rows.map(row=>row.code));
  assert.deepEqual(catalog.map(item=>item.sourceAvailable),[true,true,false]);
  assert.ok(catalog[0].sha256);
  assert.equal(catalog[2].sha256,null);
  assert.ok(catalog.every(item=>item.raceAssignment==='unverified'));
});

test('sprite inventory propagates corrupt or unreadable source errors',async()=>{
  await assert.rejects(inventorySpriteRecords([{code:'BROKEN'}],async()=>{
    throw Object.assign(Error('permission denied'),{code:'EACCES'});
  }),/permission denied/);
});


test('sprite paths cannot escape the original SPRITE directory',async()=>{
  for(const code of ['../secret','sub/path','..','',String.fromCharCode(0),'foo\\\\bar']){
    assert.throws(()=>validateSpriteCode(code),/Invalid original sprite code/);
  }
  let called=false;
  await assert.rejects(inventorySpriteRecords([{code:'../secret'}],async()=>{called=true}),/Invalid original sprite code/);
  assert.equal(called,false);
});

test('duplicate sprite records are rejected rather than silently misreported',async()=>{
  await assert.rejects(inventorySpriteRecords([{code:'NORMAN_M'},{code:'NORMAN_M'}],async()=>Buffer.from('valid')),/Duplicate original SPRITE record/);
});

test('generic errors with missing-file wording do not get swallowed',async()=>{
  await assert.rejects(inventorySpriteRecords([{code:'NORMAN_M'}],async()=>{
    throw Error('Missing original but upstream parser failed');
  }),/upstream parser failed/);
});

test('sprite action inventory preserves original directions and frame IDs',()=>{
  const sprite={code:'GREEK',firstAction:2,actionCount:2};
  const actions=[{sprite:'OTHER'}, {sprite:'GREEK',action:'M',direction:0,firstFrame:1,frameCount:2,recordNo:2},
    {sprite:'GREEK',action:'S',direction:0,firstFrame:3,frameCount:1,recordNo:3}];
  const frames=[{sprite:'GREEK',recordNo:1},{sprite:'GREEK',recordNo:2},{sprite:'GREEK',recordNo:3}];
  assert.deepEqual(summarizeSpriteActions(sprite,actions,frames),[
    {action:'M',direction:0,frameCount:2,sourceAction:2,firstFrame:1,sourceFrames:[1,2]},
    {action:'S',direction:0,frameCount:1,sourceAction:3,firstFrame:3,sourceFrames:[3]}
  ]);
});
test('sprite action inventory rejects out-of-range or foreign source references',()=>{
  const sprite={code:'GREEK',firstAction:1,actionCount:1};
  const action={sprite:'GREEK',action:'M',direction:0,firstFrame:1,frameCount:2};
  const frames=[{sprite:'GREEK',recordNo:1},{sprite:'OTHER',recordNo:2}];
  assert.throws(()=>summarizeSpriteActions(sprite,[action],frames),/Foreign frame/);
  assert.throws(()=>summarizeSpriteActions({...sprite,actionCount:2},[action],frames),/Invalid original action range/);
  assert.throws(()=>summarizeSpriteActions(sprite,[{...action,frameCount:3}],frames),/Invalid original frame range/);
  assert.throws(()=>summarizeSpriteActions(sprite,[{...action,sprite:'OTHER'}],frames),/Foreign action/);
});
