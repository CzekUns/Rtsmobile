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
 const started=Date.now();
 const phase={mode,scale,attempt,fixture:new URL(url).pathname,virtualTimeMs:mode==='image'?(attempt===0?1800:3500):14000};
 console.log('Chromium phase start '+JSON.stringify(phase));
 const proc=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 proc.stdout.on('data',b=>stdout+=b);
 proc.stderr.on('data',b=>stderr+=b);
 // Screenshot mode uses a short virtual-time window: the full game's animation loop
 // otherwise keeps Chrome rendering thousands of frames before a 2x capture.
 // Retain a bounded timeout to report genuine hangs.
 const result=await Promise.race([new Promise(resolve=>proc.on('close',code=>resolve({code}))),sleep(mode==='image'?35000:90000).then(()=>({timeout:true}))]);
 const elapsedMs=Date.now()-started;
 console.log('Chromium phase end '+JSON.stringify({...phase,elapsedMs,exitCode:result.code??null,timeout:!!result.timeout,stderrTail:result.timeout?stderr.slice(-500):undefined}));
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
  // The CSS viewport is identical at both device scale factors. Validate the
  // full live-game DOM once at 1x; Chromium --dump-dom at 2x can hang for 90s
  // while the animated canvas is being rasterized (Actions #44406525612).
  // The separate 2x screenshot still exercises the real rendering path.
  if(scale===1){
   const dom=await browser(url,'dom',undefined,scale);
   const qa=dom.match(/<output id="qa"[^>]*>/)?.[0]||'';
   if(!qa.includes('data-result="ready"'))throw Error('Live HUD/game viewport '+scale+'x: '+dom.slice(-1600));
   const encoded=qa.match(/data-label-metrics="([^"]+)"/)?.[1];
   if(!encoded)throw Error('Missing deterministic label metrics');
   const metrics=JSON.parse(encoded.replaceAll('&quot;','"'));
   if(metrics.length!==2||metrics.some(pair=>pair.length!==2||pair.some(v=>!Number.isFinite(v)||v<=0)))throw Error('Invalid Forte/Mercato metrics: '+JSON.stringify(metrics));
   console.log('Forte/Mercato reference CSS geometry (1x): '+JSON.stringify(metrics));
   // Actual game Canvas draw calls are collected by the fixture, independently
   // of the hidden DOM reference. Validate the capture rather than mistaking
   // synthetic reference metrics for proof of rendered label geometry.
   const encodedDraws=qa.match(/data-canvas-label-draws="([^"]+)"/)?.[1];
   if(!encodedDraws)throw Error('Missing actual Canvas label draw capture');
   const draws=JSON.parse(encodedDraws.replaceAll('&quot;','"').replaceAll('&amp;','&'));
   if(!Array.isArray(draws))throw Error('Malformed actual Canvas label draw capture');
   // The production renderer may paint labels via sprites or another context,
   // and the 350ms probe may miss text frames. Zero observations are a QA
   // coverage gap, not evidence that the renderer is broken. Keep the image
   // regressions running and never report 1x/2x label parity as certified.
   if(!draws.length)console.warn('No Canvas fillText observed in bounded capture; label geometry coverage UNVERIFIED');
   const invalid=draws.find(draw=>typeof draw.text!=='string'||!draw.text.trim()
    ||typeof draw.font!=='string'||!draw.font.trim()
    ||!Number.isFinite(draw.width)||draw.width<=0
    ||!Number.isFinite(draw.x)||!Number.isFinite(draw.y));
   if(invalid)throw Error('Invalid actual Canvas text geometry: '+JSON.stringify(invalid));
   const labels=draws.filter(draw=>/forte|mercato/i.test(draw.text));
   console.log('Actual Canvas label draws (1x): '+JSON.stringify({
    count:draws.length,matchedLabels:labels,otherSamples:draws.slice(0,8)
   }));
   // A missing Forte/Mercato draw is an explicit coverage gap, not a parity PASS:
   // the current demo scene may not paint these strings in the capture window.
   if(!labels.length)console.warn('Canvas Forte/Mercato draw not observed; 1x/2x label parity remains unverified');

  }
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
