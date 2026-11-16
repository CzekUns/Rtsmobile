import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_STRUCTURE_CATALOG,ORIGINAL_UNIT_CATALOG,getOriginalStructure,getOriginalUnit,validateOriginalCatalog} from '../playtest/original-structure-catalog.js';
import {ORIGINAL_SHEETS} from '../playtest/original-sprites.js';

test('catalog frames exactly partition the already shipped Norman contact sheets',()=>{
 assert.deepEqual(validateOriginalCatalog(),[]);
 const b=getOriginalStructure('BASE:NORMAN'),u=getOriginalUnit('NORMAN:M');
 assert.equal(b.atlas,ORIGINAL_SHEETS.firm.path);
 assert.equal(u.atlas,ORIGINAL_SHEETS.unit.path);
 assert.equal(b.sourceFootprint.width,4);
 assert.equal(b.sourceFootprint.height,4);
 assert.deepEqual(b.phases,[0,1,2,3]);
 assert.equal(u.directions,8);
 assert.equal(u.walkingFrames,6);
});
test('unknown races/buildings never silently inherit Norman proxy metadata',()=>{
 assert.equal(getOriginalStructure('BASE:GREEK'),null);
 assert.equal(getOriginalUnit('GREEK:M'),null);
 assert.equal(ORIGINAL_STRUCTURE_CATALOG['BASE:NORMAN'].collisionParity,false);
 assert.equal(ORIGINAL_UNIT_CATALOG['NORMAN:M'].status,'preview-only');
});

test('live preview adapter accepts the source-backed catalog without changing fallback policy',async()=>{
 const {OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const make=()=>({addEventListener(){},set src(v){this.url=v},complete:false,naturalWidth:0,naturalHeight:0});
 const preview=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),structureCatalog:ORIGINAL_STRUCTURE_CATALOG,unitCatalog:ORIGINAL_UNIT_CATALOG});
 assert.equal(preview.structureCatalog['BASE:NORMAN'].sourceFootprint.width,4);
 assert.equal(preview.unitCatalog['NORMAN:M'].directions,8);
 const ctx={};
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'norman'},0,0,24,4,0),false);
 assert.equal(preview.drawFirm(ctx,{owner:2,kind:'fort'},0,0,24),false);
});
