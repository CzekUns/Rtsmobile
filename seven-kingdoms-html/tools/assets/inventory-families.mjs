#!/usr/bin/env node
// SKH-STRUCTURES-001: source-only inventory for choosing the next authentic family.
// This tool never emits placeholder sprites or modifies shipped atlases.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {isAbsolute,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {originalTables} from './render-unit.mjs';
import {parseFirmTables,selectedBuild} from './render-firm.mjs';
import {sha256} from './decode.mjs';

const sourcePath=(root,kind,name)=>join(root,'data',kind,name);
async function sourceFile(root,kind,name){
  for(const path of [sourcePath(root,kind,name),join(root,kind,name)]){
    try{return await readFile(path)}catch(error){if(error.code!=='ENOENT')throw error}
  }
  throw Object.assign(Error('Missing original '+kind+'/'+name+' under '+root),{missingOriginal:true,code:'ENOENT'});
}
export function validateSpriteCode(code){
  if(typeof code!=='string'||!code.length||code==='.'||code==='..'||isAbsolute(code)||basename(code)!==code||code.includes('\\')||code.includes('/')||code.includes('..')||/[\x00-\x1f\x7f]/.test(code)){
    throw Error('Invalid original sprite code: '+String(code));
  }
  return code;
}
export async function inventorySpriteRecords(rows,loadSprite){
  const catalog=[];
  const seen=new Set();
  for(const row of rows){
    const code=validateSpriteCode(row.code);
    if(seen.has(code))throw Error('Duplicate original SPRITE record: '+code);
    seen.add(code);
    let bytes=null;
    try{bytes=await loadSprite(code)}
    catch(error){if(error.code!=='ENOENT'&&error.missingOriginal!==true)throw error}
    catalog.push({code,sourceAvailable:bytes!==null,
      sha256:bytes===null?null:sha256(bytes),turnResolution:row.turnResolution,
      raceAssignment:'unverified'});
  }
  return catalog;
}
export async function inventoryOriginalFamilies(root){
  const [set,firm,palette]=await Promise.all([
    sourceFile(root,'RESOURCE','STD.SET'),
    sourceFile(root,'RESOURCE','I_FIRM.RES'),
    sourceFile(root,'RESOURCE','PAL_STD.RES')
  ]);
  const units=originalTables(set).SPRITE;
  const firms=parseFirmTables(set);
  const races=[...new Set(firms.FBUILD.map(row=>row.raceCode))].filter(Boolean).sort();
  // Unit SPRITE codes do not encode a reliable race relationship. Inventory every
  // source record separately; never silently drop valid sprites or assign a race.
  const spriteCatalog=await inventorySpriteRecords(units,(code)=>sourceFile(root,'SPRITE',code+'.SPR'));
  const candidates=[];
  for(const race of races){
    const buildings=[];
    for(const row of firms.FBUILD.filter(item=>item.raceCode===race)){
      try{
        const selected=selectedBuild(firms,row.firmCode,race);
        buildings.push({id:row.firmCode+':'+race,sourceFrameCount:selected.frames.length,
          constructionBitmapCount:selected.stages.length,sourceBitmapRecords:selected.main.map(x=>x.recordNo)});
      }catch(error){buildings.push({id:row.firmCode+':'+race,error:String(error.message)})}
    }
    candidates.push({race,buildings});
  }
  return {schemaVersion:1,status:'source-inventory-only',decoded:false,visuallyVerified:false,
    source:{repository:'the3dfxdude/7kaa',paths:['data/RESOURCE/STD.SET','data/RESOURCE/I_FIRM.RES','data/RESOURCE/PAL_STD.RES'],
      sha256:{set:sha256(set),firm:sha256(firm),palette:sha256(palette)}},
    spriteCatalog,candidates};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
  if(!args.includes('--source')||!args.includes('--out')){
    console.error('Usage: node inventory-families.mjs --source /local/7kaa --out /tmp/families.json');process.exitCode=2;
  }else inventoryOriginalFamilies(value('--source')).then(async data=>{
    const dest=resolve(value('--out'));await mkdir(dirname(dest),{recursive:true});
    await writeFile(dest,JSON.stringify(data,null,2)+'\n');
    console.log('Indexed '+data.candidates.length+' source races; no artwork exported');
  }).catch(error=>{console.error(error.stack);process.exitCode=1});
}
