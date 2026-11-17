#!/usr/bin/env node
// Download a pinned, authentic 7KAA source snapshot before extracting a second building family.
// No inferred sprite-to-race mapping, invented geometry, or modifications to game state.
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseFirmTables,selectedBuild,renderFirm} from './render-firm.mjs';
import {sha256} from './decode.mjs';

export const UPSTREAM_COMMIT='14e6fdfba9481af4dc3a54722614a608776e20bc';
const BASE='https://raw.githubusercontent.com/the3dfxdude/7kaa/'+UPSTREAM_COMMIT+'/data/RESOURCE/';
export const REQUIRED=['STD.SET','I_FIRM.RES','PAL_STD.RES'];
export async function acquireResources(destination,{fetcher=fetch}={}){
  const target=join(destination,'data','RESOURCE');
  await mkdir(target,{recursive:true});
  const hashes={};
  for(const name of REQUIRED){
    const url=BASE+name;
    const response=await fetcher(url);
    if(!response.ok)throw Error('Upstream '+name+' HTTP '+response.status+' at '+url);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(!bytes.length)throw Error('Empty upstream binary '+name);
    hashes[name]=sha256(bytes);
    await writeFile(join(target,name),bytes);
  }
  return hashes;
}
export function chooseSecondBuild(tables,{race,firm='BASE'}={}){
  const candidates=[...new Set(tables.FBUILD.map(row=>row.raceCode))]
    .filter(code=>code&&code!=='NORMAN').sort();
  const selectedRace=race||candidates.find(code=>{
    try{selectedBuild(tables,firm,code);return true}catch{return false}
  });
  if(!selectedRace||selectedRace==='NORMAN')throw Error('No verified non-Norman building family');
  const selection=selectedBuild(tables,firm,selectedRace);
  return {race:selectedRace,firm,sourceFrames:selection.frames.length,
    constructionRecords:selection.stages.map(row=>row.recordNo)};
}
export async function acquireAndRender(out,{race,firm='BASE',fetcher=fetch}={}){
  const staging=await mkdtemp(join(tmpdir(),'7kaa-original-'));
  try{
    const hashes=await acquireResources(staging,{fetcher});
    const set=await readFile(join(staging,'data','RESOURCE','STD.SET'));
    const selected=chooseSecondBuild(parseFirmTables(set),{race,firm});
    const manifest=await renderFirm(staging,resolve(out),{
      firmCode:selected.firm,raceCode:selected.race,colorSchemeId:1});
    return {sourceCommit:UPSTREAM_COMMIT,sourceSha256:hashes,selected,manifest};
  }finally{await rm(staging,{recursive:true,force:true})}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i>=0&&i+1<args.length&&!args[i+1].startsWith('--')?args[i+1]:undefined;};
  if(!args.includes('--out')){console.error('Usage: node acquire-original-family.mjs --out /tmp/family [--race RACE] [--firm BASE]');process.exitCode=2}
  else acquireAndRender(arg('--out'),{race:arg('--race'),firm:arg('--firm')||'BASE'})
    .then(result=>console.log(JSON.stringify({sourceCommit:result.sourceCommit,
      sourceSha256:result.sourceSha256,selected:result.selected,
      manifestPath:resolve(arg('--out'),'firm.json'),visuallyVerified:false},null,2)))
    .catch(error=>{console.error(error.stack);process.exitCode=1});
}
