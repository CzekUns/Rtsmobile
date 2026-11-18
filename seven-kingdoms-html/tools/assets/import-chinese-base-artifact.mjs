#!/usr/bin/env node
/**
 * Import the immutable 7KAA extraction artifact into the task worktree.
 * Usage: GITHUB_TOKEN=... node seven-kingdoms-html/tools/assets/import-chinese-base-artifact.mjs
 * Only writes five renderable PNGs and firm.json after all checks pass.
 * Source: Actions artifact 14310785266 (run 44029830557), GPL 7KAA.
 */
import {mkdtemp,readFile,rename,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {CHINESE_BASE,validateChineseBaseAssets} from '../../playtest/chinese-base.js';

const REPO='CzekUns/Rtsmobile';
const ARTIFACT_ID=14310785266;
const REQUIRED=CHINESE_BASE.modes.map(mode=>mode.file);
const OUT=resolve('seven-kingdoms-html/assets/original/chinese-base');
const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN;
if(!token)throw new Error('GITHUB_TOKEN or GH_TOKEN required for Actions artifact download');
const temp=await mkdtemp(join(tmpdir(),'skh-chinese-base-'));
try{
 const response=await fetch(`https://api.github.com/repos/${REPO}/actions/artifacts/${ARTIFACT_ID}/zip`,{
  headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
 });
 if(!response.ok)throw new Error(`GitHub artifact download HTTP ${response.status}`);
 const zip=join(temp,'artifact.zip');
 await writeFile(zip,Buffer.from(await response.arrayBuffer()));
 // Python stdlib ZIP decoder; reject traversal and duplicate basenames.
 const py=`import json,sys,zipfile,base64
with zipfile.ZipFile(sys.argv[1]) as z:
 names={}
 for info in z.infolist():
  if info.is_dir(): continue
  name=info.filename.replace('\\\\','/')
  if name.startswith('/') or '..' in name.split('/'): raise ValueError('unsafe ZIP path')
  base=name.split('/')[-1]
  if base in names: raise ValueError('duplicate ZIP basename '+base)
  names[base]=info
 wanted=json.loads(sys.argv[2])
 if any(n not in names for n in wanted): raise ValueError('missing required files: '+str(set(wanted)-set(names)))
 print(json.dumps({n:base64.b64encode(z.read(names[n])).decode('ascii') for n in wanted}))
`;
 const names=['firm.json',...REQUIRED];
 const extracted=spawnSync('python3',['-c',py,zip,JSON.stringify(names)],{encoding:'utf8',maxBuffer:12*1024*1024});
 if(extracted.status!==0)throw new Error('ZIP extraction failed: '+extracted.stderr);
 const decoded=JSON.parse(extracted.stdout);
 const files=new Map(names.map(name=>[name,Buffer.from(decoded[name],'base64')]));
 const manifest=JSON.parse(files.get('firm.json').toString('utf8'));
 if(!validateChineseBaseAssets(manifest,new Set(REQUIRED)))throw new Error('Manifest/source records do not match pinned 7KAA metadata');
 for(const name of REQUIRED){
  const png=files.get(name);
  if(png.length<24||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||
     png.toString('ascii',12,16)!=='IHDR'||png.readUInt32BE(16)!==147||png.readUInt32BE(20)!==139)
   throw new Error('Invalid original PNG dimensions/signature: '+name);
 }
 await mkdir(OUT,{recursive:true});
 // Validate everything before writing any final file.
 for(const [name,data] of files)await writeFile(join(temp,name),data);
 for(const name of names)await rename(join(temp,name),join(OUT,name));
 console.log(`Imported ${REQUIRED.length} authentic 7KAA PNGs and firm.json to ${OUT}; commit these files on the task branch.`);
}finally{await rm(temp,{recursive:true,force:true})}
