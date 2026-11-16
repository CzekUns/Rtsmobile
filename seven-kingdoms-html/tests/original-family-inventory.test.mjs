import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inventoryOriginalFamilies,inventorySpriteRecords} from '../tools/assets/inventory-families.mjs';

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
    if(code==='MISSING')throw Error('Missing original SPRITE/MISSING.SPR under fixture');
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
