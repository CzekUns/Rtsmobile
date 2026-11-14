// Original 7KAA ROCK: network acquisition -> verified indexed atlas -> manifest.
// Fail closed on any missing/corrupt resource; never generate substitute sprites.
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {acquireRockResources} from './fetch-rock-resources.mjs';
import {exportRockAtlas} from './export-rock-atlas.mjs';
export async function buildOriginalRockAtlas({fetcher=fetch,outputDir}={}){
 if(!outputDir)throw Error('outputDir is required');
 const acquired=await acquireRockResources({fetcher});
 const {png,manifest}=exportRockAtlas({files:acquired.files,provenance:acquired.manifest});
 await mkdir(outputDir,{recursive:true});
 await writeFile(join(outputDir,'rock-original.png'),png,{flag:'wx'});
 await writeFile(join(outputDir,'rock-original.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return manifest;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(!process.argv[2])throw Error('usage: node build-original-rock-atlas.mjs OUTPUT_DIRECTORY');
 console.log(JSON.stringify(await buildOriginalRockAtlas({outputDir:process.argv[2]}),null,2));
}
