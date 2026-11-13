// SKH-TERRAIN-002: byte-exact acquisition of pinned upstream 7KAA archives.
// Never infer palette/transparent index or claim original pixels without verified bytes.
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export const SOURCE_COMMIT='14e6fdfba9481af4dc3a54722614a608776e20bc';
export const RESOURCE_NAMES=['PLANT1.RES','PLANTBM1.RES','I_PLANT1.RES','PAL_STD.RES'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function acquirePlantResources({fetcher=fetch,commit=SOURCE_COMMIT,maxBytes=32*1024*1024}={}){
  if(commit!==SOURCE_COMMIT)throw Error('unpinned upstream source commit');
  const entries=[],files={};
  for(const name of RESOURCE_NAMES){
    const url=`https://raw.githubusercontent.com/the3dfxdude/7kaa/${commit}/data/RESOURCE/${name}`;
    const response=await fetcher(url);
    if(!response.ok)throw Error(`upstream fetch failed: ${name} HTTP ${response.status}`);
    const length=Number(response.headers?.get?.('content-length'));
    if(Number.isFinite(length)&&length>maxBytes)throw Error('oversize upstream resource: '+name);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length===0||bytes.length>maxBytes)throw Error('invalid upstream resource length: '+name);
    const sha256=digest(bytes);
    entries.push({name,url,bytes:bytes.length,sha256});
    files[name]=bytes;
  }
  return {files,manifest:{schemaVersion:1,source:'the3dfxdude/7kaa',sourceCommit:commit,license:'GPL-2.0-or-later',resources:entries,verification:'byte-exact-download-sha256; visual-parity-not-certified'}};
}
export async function savePlantResources(result,dir){
  await mkdir(dir,{recursive:true});
  for(const entry of result.manifest.resources)await writeFile(join(dir,entry.name),result.files[entry.name],{flag:'wx'});
  await writeFile(join(dir,'plant-source-provenance.json'),JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx'});
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const dir=process.argv[2];
  if(!dir)throw Error('usage: node fetch-plant-resources.mjs OUTPUT_DIRECTORY');
  const result=await acquirePlantResources();
  await savePlantResources(result,dir);
  console.log(JSON.stringify(result.manifest,null,2));
}
