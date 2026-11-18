// SKH-QA-001: browser regression across the production HUD and WorldView fixtures.
// Screenshots are evidence of the HTML renderer, NOT proof of Android or 7KAA parity.
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile} from 'node:fs/promises';
import {setTimeout as sleep} from 'node:timers/promises';
import {join} from 'node:path';
import {decodePng,compareScaleGeometry} from './png-geometry.mjs';
const chrome=process.env.CHROME_BIN||'google-chrome';
const port=18759;
const output=process.env.SKH_QA_DIR||'/tmp/skh-qa-001';
await mkdir(output,{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:'seven-kingdoms-html',stdio:'ignore'});
async function browser(url,mode,path,scale=1,attempt=0){
 const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--hide-scrollbars','--window-size=1100,900','--force-device-scale-factor='+scale,'--virtual-time-budget='+(mode==='image'?(attempt===0?1800:3500):14000),mode==='image'?'--screenshot='+path:'--dump-dom',url];
 const proc=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 proc.stdout.on('data',b=>stdout+=b);
 proc.stderr.on('data',b=>stderr+=b);
 // Screenshot mode uses a short virtual-time window: the full game's animation loop\n // otherwise keeps Chrome rendering thousands of frames before a 2x capture.\n // Retain a bounded timeout to report genuine hangs.
 const result=await Promise.race([new Promise(resolve=>proc.on('close',code=>resolve({code}))),sleep(mode==='image'?35000:90000).then(()=>({timeout:true}))]);
 if(result.timeout)proc.kill('SIGKILL');
 if(result.timeout||result.code!==0){
  if(mode==='image'&&attempt===0){
   console.warn('Chromium screenshot first attempt failed; retrying once with fresh process: '+JSON.stringify(result));
   return browser(url,mode,path,scale,1);
  }
  throw Error('Chromium failed '+JSON.stringify(result)+' '+stderr.slice(-1200));
 }
 return stdout;
}
try{
 await sleep(1200);
 const hud=await browser('http://127.0.0.1:'+port+'/tests/browser/hud-smoke.html','dom');
 const hudStatus=hud.match(/<output id="result">([^<]*)<\/output>/)?.[1];
 if(!hudStatus?.startsWith('PASS:'))throw Error('HUD/MOD/joystick/save regression: '+(hudStatus||hud.slice(-1200)));
 console.log('HUD regression: '+hudStatus);
 const hashes=[];
 for(const zoom of [1,2]){
  const url='http://127.0.0.1:'+port+'/tests/browser/chinese-in-world.html?zoom='+zoom;
  const dom=await browser(url,'dom');
  const status=dom.match(/<output id="status"[^>]*>/)?.[0]||'';
  if(!status.includes('data-result="drawn"')||!status.includes('data-zoom="'+zoom+'"'))throw Error('WorldView missing '+zoom+'x: '+dom.slice(-1200));
  const different=Number(status.match(/data-different-pixels="(\d+)"/)?.[1]||0);
  if(different<100)throw Error('Original building did not affect in-world pixels '+zoom+'x');
  const path=join(output,'integrated-world-'+zoom+'x.png');
  await browser(url,'image',path);
  const png=await readFile(path);
  if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.length<1000)throw Error('Invalid screenshot '+path);
  const sha=createHash('sha256').update(png).digest('hex');
  hashes.push(sha);
  console.log(JSON.stringify({zoom,differentPixels:different,screenshot:path,sha256:sha,bytes:png.length}));
 }
 // Capture the actual shipped index.html (not only the WorldView fixture).
 // Device scale factor controls raster resolution while CSS viewport stays fixed.
 const liveHashes=[];
 const liveImages=[];
 for(const scale of [1,2]){
  const url='http://127.0.0.1:'+port+'/tests/browser/live-game-qa.html';
  const dom=await browser(url,'dom',undefined,scale);
  const qa=dom.match(/<output id="qa"[^>]*>/)?.[0]||'';
  if(!qa.includes('data-result="ready"'))throw Error('Live HUD/game viewport '+scale+'x: '+dom.slice(-1600));
  const path=join(output,'live-game-hud-'+scale+'x.png');
  await browser(url,'image',path,scale);
  const png=await readFile(path);
  if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.length<1000)throw Error('Invalid live screenshot '+path);
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  if(width<1000*scale||height<800*scale)throw Error('Unexpected screenshot resolution '+width+'x'+height+' at '+scale+'x');
  const sha=createHash('sha256').update(png).digest('hex');liveHashes.push(sha);
  liveImages.push(decodePng(png));
  console.log(JSON.stringify({fixture:'actual-game',scale,width,height,screenshot:path,sha256:sha}));
 }
 const geometry=compareScaleGeometry(liveImages[0],liveImages[1]);
 console.log('Live HUD 1x/2x normalized geometry: '+JSON.stringify(geometry));
 if(liveHashes[0]===liveHashes[1])throw Error('Live 1x/2x screenshots identical');
 if(hashes[0]===hashes[1])throw Error('1x and 2x screenshots identical');
 console.log('PASS: integrated live game HUD and WorldView 1x/2x Chromium regressions; Android/7KAA parity NOT tested');
}finally{server.kill('SIGTERM')}
