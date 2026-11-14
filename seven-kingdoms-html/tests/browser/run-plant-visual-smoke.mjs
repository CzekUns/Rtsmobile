import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

const browser=process.env.CHROME_BIN||'google-chrome';
const port=18744;
const dir=await mkdtemp(join(tmpdir(),'skh-plant-qa-'));
const screenshot=process.env.PLANT_QA_SCREENSHOT||join(dir,'plant-1x-2x.png');
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:'seven-kingdoms-html',stdio:'ignore'});
const url=`http://127.0.0.1:${port}/assets/previews/plant-original-qa.html`;
async function chrome(args,page=url){
 const child=spawn(browser,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--hide-scrollbars','--window-size=1400,1000','--virtual-time-budget=12000',...args,page],{stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',d=>stdout+=d);
 child.stderr.on('data',d=>stderr+=d);
 const result=await Promise.race([new Promise(resolve=>child.on('close',code=>resolve({code}))),sleep(30000).then(()=>({timeout:true}))]);
 if(result.timeout)child.kill('SIGKILL');
 if(result.timeout||result.code!==0)throw Error('Chromium '+JSON.stringify(result)+' '+stderr.slice(-1000));
 return stdout;
}
try{
 await sleep(1000);
 const dom=await chrome(['--dump-dom']);
 const match=dom.match(/<p id="status" role="status">([^<]*)<\/p>/);
 if(!match||!/^OK: [1-9][0-9]* disegni/.test(match[1]))throw Error('PLANT HTTP gallery failed: '+(match?.[1]||'status missing'));
 if(!dom.includes('the3dfxdude/7kaa'))throw Error('Original source attribution missing');
 await chrome(['--screenshot='+screenshot]);
 const png=await readFile(screenshot);
 if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Screenshot is not PNG');
 const sceneUrl=`http://127.0.0.1:${port}/tests/browser/plant-game-scene.html`;
 const sceneDom=await chrome(['--dump-dom'],sceneUrl);
 const sceneStatus=sceneDom.match(/<p id="status" role="status">([^<]*)<\/p>/)?.[1];
 if(!sceneStatus?.startsWith('PASS: WorldView actual scene PLANT 1x='))throw Error('WorldView scene HTTP smoke failed: '+(sceneStatus||'status missing')+'; body='+sceneDom.slice(-1500));
 const sceneScreenshot=process.env.PLANT_QA_SCENE_SCREENSHOT||join(dir,'plant-worldview-1x-2x.png');
 await chrome(['--screenshot='+sceneScreenshot],sceneUrl);
 const scenePng=await readFile(sceneScreenshot);
 if(!scenePng.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('WorldView screenshot is not PNG');
 console.log('PASS: PLANT HTTP gallery 1x/2x '+match[1]+'; WorldView '+sceneStatus+'; screenshots '+screenshot+' and '+sceneScreenshot);
}finally{
 server.kill('SIGTERM');
 if(!process.env.PLANT_QA_SCREENSHOT)await rm(dir,{recursive:true,force:true});
}
