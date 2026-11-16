import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inventoryOriginalFamilies} from '../tools/assets/inventory-families.mjs';

test('source inventory refuses absent original STD.SET instead of inventing races',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'skh-structures-'));
  try{
    await assert.rejects(inventoryOriginalFamilies(dir),/Missing original RESOURCE\/(STD\.SET|I_FIRM\.RES|PAL_STD\.RES)/);
  }finally{await rm(dir,{recursive:true,force:true})}
});
