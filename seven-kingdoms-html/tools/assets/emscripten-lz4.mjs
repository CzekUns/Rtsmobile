// Extract Emscripten --use-preload-plugins LZ4 filesystem packages without executing generated JS.
// Metadata read from original Emscripten package scripts. No dependency on WASM.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join,isAbsolute,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
export const checksum=b=>createHash('sha256').update(b).digest('hex');
const check=(v,m)=>{if(!v)throw Error(m)};
function jsonObjectAfter(js,needle){
 const pos=needle==='loadPackage({'?js.lastIndexOf(needle):js.indexOf(needle);check(pos>=0,'Missing Emscripten metadata: '+needle);
 const start=needle==='loadPackage({'?pos+needle.length-1:js.indexOf('{',pos+needle.length);check(start>=0,'No JSON object for '+needle);
 let depth=0,quoted=false,escaped=false;
 for(let i=start;i<js.length;i++){
  const c=js[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"'){quoted=true;continue}if(c==='{')depth++;else if(c==='}' && --depth===0)return JSON.parse(js.slice(start,i+1));
 }
 throw Error('Unterminated JSON for '+needle);
}
export function packageMetadata(js){
 const compressed=jsonObjectAfter(js,'var compressedData = ');
 const files=jsonObjectAfter(js,'loadPackage({');
 const list=files.files;
 check(Array.isArray(list)&&Number.isSafeInteger(files.remote_package_size),'Invalid package file list');
 check(Array.isArray(compressed.offsets)&&Array.isArray(compressed.sizes)&&Array.isArray(compressed.successes),'Invalid LZ4 chunk metadata');
 check(compressed.sizes.length===compressed.successes.length,'Mismatched LZ4 chunk tables');
 check(compressed.offsets.length===compressed.sizes.length,'Mismatched offset table');
 const total=list.at(-1)?.end ?? 0;
 check(list.every(f=>typeof f.filename==='string'&&Number.isSafeInteger(f.start)&&Number.isSafeInteger(f.end)&&f.start>=0&&f.end>=f.start),'Bad virtual file offsets');
 check(list.every((f,i)=>i===0?f.start===0:f.start===list[i-1].end),'Non-contiguous virtual file layout');
 check(total<=compressed.sizes.length*2048 && total>(compressed.sizes.length-1)*2048,'Unexpected LZ4 chunk size (expected 2048-byte uncompressed chunks)');
 return {files:list,remoteSize:files.remote_package_size,blocks:compressed,virtualSize:total};
}
export function decodeLz4Block(source,expected){
 check(Number.isInteger(expected)&&expected>=0&&expected<=2048,'Invalid decoded chunk size');
 const dst=Buffer.alloc(expected);let s=0,d=0;
 const length=(initial)=>{let v=initial;if(v===15){let x;do{check(s<source.length,'Truncated LZ4 length');x=source[s++];v+=x}while(x===255)}return v;};
 while(s<source.length){
  const token=source[s++],literal=length(token>>4);
  check(s+literal<=source.length&&d+literal<=expected,'Invalid LZ4 literal span');
  source.copy(dst,d,s,s+literal);s+=literal;d+=literal;
  if(s===source.length)break;
  check(s+2<=source.length,'Truncated LZ4 match pointer');
  const offset=source.readUInt16LE(s);s+=2;
  check(offset>0&&offset<=d,'Invalid LZ4 backward pointer');
  const match=length(token&15)+4;
  check(d+match<=expected,'LZ4 match exceeds destination');
  for(let k=0;k<match;k++)dst[d+k]=dst[d-offset+k];
  d+=match;
 }
 check(d===expected,'LZ4 decoded chunk length mismatch '+d+'/'+expected);
 return dst;
}
export function unpackData(data,meta,{paths}={}){
 check(data.length===meta.remoteSize,'Compressed package size mismatch');
 const {offsets,sizes,successes}=meta.blocks;
 let decoded=Buffer.alloc(meta.virtualSize);
 for(let i=0;i<sizes.length;i++){
  const lo=offsets[i],size=sizes[i],hi=lo+size;
  check(Number.isInteger(lo)&&hi-lo===size&&lo>=0&&hi<=data.length,'Corrupt compressed offset');
  const expected=Math.min(2048,meta.virtualSize-i*2048);
  check(expected>0,'Unexpected trailing chunk');
  const source=data.subarray(lo,hi);
  const chunk=successes[i]?decodeLz4Block(source,expected):source;
  check(chunk.length===expected,'Uncompressed chunk length mismatch');
  chunk.copy(decoded,i*2048);
 }
 let files=meta.files;
 if(paths?.length){const selected=new Set(paths);files=files.filter(f=>selected.has(f.filename));check(files.length===selected.size,'Unknown package path in selection')}
 return files.map(f=>({filename:f.filename,bytes:decoded.subarray(f.start,f.end),sha256:checksum(decoded.subarray(f.start,f.end))}));
}
export async function extractPackage(jsPath,dataPath,out,{select}={}){
 const [script,data]=await Promise.all([readFile(jsPath,'utf8'),readFile(dataPath)]);
 const meta=packageMetadata(script),entries=unpackData(data,meta,{paths:select});
 const manifest={schemaVersion:1,source:{javascript:jsPath,data:dataPath,javascriptSha256:checksum(Buffer.from(script)),dataSha256:checksum(data)},
   license:'UNVERIFIED_ASSET_LICENSE',status:'bytes-extracted-not-pixel-decoded',files:[]};
 const destination=resolve(out);
 for(const e of entries){
  const virtual=e.filename.replace(/^\/+/,'');
  const full=resolve(destination,virtual);
  check(full.startsWith(destination+sep),'Unsafe path: '+e.filename);
  await mkdir(dirname(full),{recursive:true});await writeFile(full,e.bytes);
  manifest.files.push({path:virtual,size:e.bytes.length,sha256:e.sha256});
 }
 await mkdir(destination,{recursive:true});
 await writeFile(join(destination,'extraction-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
 const args=process.argv.slice(2),get=n=>args[args.indexOf(n)+1];
 if(!['--js','--data','--out'].every(a=>args.includes(a))){console.error('Usage: node emscripten-lz4.mjs --js SPRITE.js --data SPRITE.data --out ./unpacked');process.exitCode=2}
 else extractPackage(get('--js'),get('--data'),get('--out')).then(m=>console.log('Extracted '+m.files.length+' source files; bitmap conversion NOT performed')).catch(e=>{console.error(e.stack);process.exitCode=1});
}
