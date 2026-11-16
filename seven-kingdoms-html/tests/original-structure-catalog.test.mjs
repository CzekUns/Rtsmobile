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

test('catalog construction and directional metadata remain explicit and bounded',()=>{
 const b=getOriginalStructure('BASE:NORMAN');
 const u=getOriginalUnit('NORMAN:M');
 assert.equal(b.constructionPhaseCount,b.phases.length);
 assert.deepEqual(b.phases,[0,1,2,3]);
 assert.equal(b.phaseColumns*b.frameWidth,b.atlasWidth);
 assert.equal(u.directions*u.frameWidth,u.atlasWidth);
 assert.equal(u.walkingFrames*u.frameHeight,u.atlasHeight);
 assert.equal(u.directionOrder,'N,NE,E,SE,S,SW,W,NW');
 assert.equal(validateOriginalCatalog().length,0);
 assert.equal(getOriginalStructure('__proto__'),null);
 assert.equal(getOriginalUnit('constructor'),null);
});

test('renderer uses exact Norman source cells at 1x and 2x, with fallback for other races',async()=>{
 const {OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const images=[];
 const make=()=>{
  const img={complete:true,naturalWidth:0,naturalHeight:0,addEventListener(){},set src(v){this.url=v}};
  images.push(img);return img;
 };
 const preview=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),structureCatalog:ORIGINAL_STRUCTURE_CATALOG,unitCatalog:ORIGINAL_UNIT_CATALOG});
 const calls=[];
 const ctx={save(){calls.push('save')},restore(){calls.push('restore')},drawImage(...args){calls.push(args)},imageSmoothingEnabled:true};
 images[0].naturalWidth=768;images[0].naturalHeight=672;
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'norman',owner:1},100,200,24,3,4),true);
 assert.deepEqual(calls[1].slice(1,5),[288,448,96,112]);
 assert.deepEqual(calls[1].slice(5),[48,118,96,112]);
 calls.length=0;
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'norman',owner:1},100,200,48,3,4),true);
 assert.deepEqual(calls[1].slice(5),[-4,36,192,224]);
 calls.length=0;
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'greek',owner:1},100,200,24,3,4),false);
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'norman',owner:1},100,200,24,8,0),false);
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'norman',owner:1},100,200,24,3,6),false);
 assert.equal(calls.length,0);
});

test('firm preview phase uses exact contact sheet frame and does not change collision footprint',async()=>{
 const {OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const preview=new OriginalSpritePreview({imageFactory:()=>({addEventListener(){},set src(_){} }),canvasFactory:()=>({}),structureCatalog:ORIGINAL_STRUCTURE_CATALOG,unitCatalog:ORIGINAL_UNIT_CATALOG});
 preview.firmBlue={width:720,height:160};
 const calls=[];
 const ctx={save(){},restore(){},drawImage(...args){calls.push(args)}};
 const fort={owner:2,kind:'fort',size:3,underConstruction:false};
 assert.equal(preview.drawFirm(ctx,fort,30,40,24),true);
 assert.deepEqual(calls[0].slice(1,5),[540,0,180,160]);
 assert.equal(calls[0][7],135); // 180 * (3 / 4), visual only
 assert.equal(fort.size,3);
 assert.equal(preview.drawFirm(ctx,{...fort,owner:1},30,40,24),false);
});

test('renderer rejects malformed source catalog geometry without drawing out-of-atlas cells',async()=>{
 const {OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const draws=[];
 const make=()=>({complete:true,naturalWidth:768,naturalHeight:672,addEventListener(){},set src(_){}});
 const ctx={save(){},restore(){},drawImage(...args){draws.push(args)}};
 const unitCatalog={'NORMAN:M':{...getOriginalUnit('NORMAN:M'),frameWidth:95}};
 const preview=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),unitCatalog});
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',raceId:'norman',owner:1},0,0,24,0,0),false);
 assert.equal(draws.length,0);
 const firmCatalog={'BASE:NORMAN':{...getOriginalStructure('BASE:NORMAN'),phaseColumns:5}};
 const firmPreview=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),structureCatalog:firmCatalog});
 firmPreview.firmBlue={width:720,height:160};
 assert.equal(firmPreview.drawFirm(ctx,{kind:'fort',owner:2,size:3},0,0,24),false);
 assert.equal(draws.length,0);
});

test('explicit catalogs fail closed for missing records and inconsistent source metadata',async()=>{
 const {OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const make=()=>({complete:true,naturalWidth:768,naturalHeight:672,addEventListener(){},set src(_){}});
 const draws=[];
 const ctx={save(){},restore(){},drawImage(...args){draws.push(args)}};
 const soldier={kind:'soldier',raceId:'norman',owner:1};
 const fort={kind:'fort',owner:2,size:3};
 const absent=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),unitCatalog:{},structureCatalog:{}});
 absent.firmBlue={width:720,height:160};
 assert.equal(absent.drawUnit(ctx,soldier,0,0,24,0,0),false);
 assert.equal(absent.drawFirm(ctx,fort,0,0,24),false);
 const wrongUnit=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),unitCatalog:{
  'NORMAN:M':{...getOriginalUnit('NORMAN:M'),directionOrder:'S,SW,W,NW,N,NE,E,SE'}
 }});
 assert.equal(wrongUnit.drawUnit(ctx,soldier,0,0,24,0,0),false);
 for(const corrupt of [
  {sourceFootprint:{width:3,height:3,unit:'tile'}},
  {constructionPhaseCount:3},
  {phases:[0,1,1,3]}
 ]){
  const wrongFirm=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),structureCatalog:{
   'BASE:NORMAN':{...getOriginalStructure('BASE:NORMAN'),...corrupt}
  }});
  wrongFirm.firmBlue={width:720,height:160};
  assert.equal(wrongFirm.drawFirm(ctx,fort,0,0,24),false);
 }
 assert.equal(draws.length,0);
});

test('invalid sprite canvas coordinates and scales fail closed before drawImage',async()=>{
 const {OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const images=[];
 const make=()=>{const img={complete:true,naturalWidth:0,naturalHeight:0,addEventListener(){},set src(_){} };images.push(img);return img};
 const preview=new OriginalSpritePreview({imageFactory:make,canvasFactory:()=>({}),structureCatalog:ORIGINAL_STRUCTURE_CATALOG,unitCatalog:ORIGINAL_UNIT_CATALOG});
 images[0].naturalWidth=768;images[0].naturalHeight=672;
 preview.firmBlue={width:720,height:160};
 const calls=[];
 const ctx={save(){},restore(){},drawImage(...args){calls.push(args)}};
 const unit={kind:'soldier',raceId:'norman',owner:1};
 const firm={kind:'fort',owner:2,size:3};
 for(const bad of [0,-1,NaN,Infinity,-Infinity]){
  assert.equal(preview.drawUnit(ctx,unit,10,20,bad,0,0),false);
  assert.equal(preview.drawFirm(ctx,firm,10,20,bad),false);
 }
 for(const bad of [NaN,Infinity,-Infinity]){
  assert.equal(preview.drawUnit(ctx,unit,bad,20,24,0,0),false);
  assert.equal(preview.drawUnit(ctx,unit,10,bad,24,0,0),false);
  assert.equal(preview.drawFirm(ctx,firm,bad,20,24),false);
  assert.equal(preview.drawFirm(ctx,firm,10,bad,24),false);
  assert.equal(preview.drawFirm(ctx,{...firm,size:bad},10,20,24),false);
 }
 assert.equal(preview.drawFirm(ctx,{...firm,size:0},10,20,24),false);
 assert.equal(calls.length,0);
 assert.equal(preview.drawUnit(ctx,unit,10,20,24,0,0),true);
 assert.equal(preview.drawFirm(ctx,firm,10,20,24),true);
 assert.equal(calls.length,2);
});

test('owner-2 preview proxy does not misidentify an explicitly non-Norman culture',async()=>{
 const {isUnitPreviewProxy,OriginalSpritePreview}=await import('../playtest/original-sprites.js');
 const nonNorman={kind:'soldier',owner:2,culture:'Greci'};
 const raceConflict={kind:'soldier',owner:2,raceId:'greek',culture:'Normanni'};
 const norman={kind:'soldier',owner:2,raceId:'norman'};
 const legacy={kind:'soldier',owner:2};
 assert.equal(isUnitPreviewProxy(nonNorman),false);
 assert.equal(isUnitPreviewProxy(raceConflict),false);
 assert.equal(isUnitPreviewProxy(norman),true);
 assert.equal(isUnitPreviewProxy(legacy),true);
 const images=[];
 const preview=new OriginalSpritePreview({imageFactory:()=>{const img={complete:true,naturalWidth:768,naturalHeight:672,addEventListener(){},set src(_){} };images.push(img);return img},canvasFactory:()=>({}),unitCatalog:ORIGINAL_UNIT_CATALOG});
 preview.unitBlue={width:768,height:672};
 const calls=[];
 const ctx={save(){},restore(){},drawImage(...args){calls.push(args)}};
 assert.equal(preview.drawUnit(ctx,nonNorman,10,20,24,0,0),false);
 assert.equal(preview.drawUnit(ctx,raceConflict,10,20,24,0,0),false);
 assert.equal(calls.length,0);
 assert.equal(preview.drawUnit(ctx,norman,10,20,24,0,0),true);
 assert.equal(preview.drawUnit(ctx,legacy,10,20,24,0,0),true);
 assert.equal(calls.length,2);
});
