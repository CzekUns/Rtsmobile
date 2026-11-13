// SKH-TERRAIN-002: one reproducible acquisition -> verified atlas -> QA pipeline.
// Original 7KAA GPL-2.0-or-later bytes only; never manufacture missing assets.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {acquirePlantResources,SOURCE_COMMIT} from './fetch-plant-resources.mjs';
import {exportPlantAtlas} from './export-plant-atlas.mjs';
import {renderPlantAtlasPreview} from './plant-atlas-preview.mjs';

export async function buildOriginalPlantAtlas({fetcher=fetch,outputDir,transparentIndex}={}){
  if(!outputDir)throw Error('outputDir is required');
  const acquired=await acquirePlantResources({fetcher});
  const hashes=Object.fromEntries(acquired.manifest.resources.map(r=>[r.name.replace(/\\.RES$/,'') ,r.sha256]));
  const result=exportPlantAtlas({
    plantDb:acquired.files['PLANT1.RES'],
    bitmapDb:acquired.files['PLANTBM1.RES'],
    bitmapArchive:acquired.files['I_PLANT1.RES'],
    palette:acquired.files['PAL_STD.RES'],
    expectedHashes:hashes,
    sourceCommit:SOURCE_COMMIT,
    transparentIndex
  });
  const preview=renderPlantAtlasPreview(result.manifest,'plant-original.png');
  await mkdir(outputDir,{recursive:true});
  // Only publish after all four downloads, integrity checks, decode and preview succeed.
  await writeFile(join(outputDir,'plant-original.png'),result.png,{flag:'wx'});
  await writeFile(join(outputDir,'plant-original.json'),JSON.stringify({...result.manifest,upstreamResources:acquired.manifest.resources},null,2)+'\\n',{flag:'wx'});
  await writeFile(join(outputDir,'plant-original-qa.html'),preview,{flag:'wx'});
  return {manifest:result.manifest,resources:acquired.manifest.resources};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const outputDir=process.argv[2];
  if(!outputDir)throw Error('usage: node build-original-plant-atlas.mjs OUTPUT_DIRECTORY');
  const result=await buildOriginalPlantAtlas({outputDir});
  console.log(JSON.stringify(result,null,2));
}
