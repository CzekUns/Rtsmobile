import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {setTimeout as sleep} from 'node:timers/promises';
const port=18746;
const browser=process.env.CHROME_BIN||'google-chrome';
const screenshot=process.env.LANDSCAPE_QA_SCREENSHOT||'/tmp/skh-landscape-occlusion.png';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:'seven-kingdoms-html',stdio:'ignore'});
const url=`http://127.0.0.1:${port}/tests/browser/landscape-occlusion.html`;
async function chrome(args){
 const child=spawn(browser,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--hide-scrollbars','--window-size=1400,1100','--virtual-time-budget=15000',...args,url],{stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',d=>stdout+=d);
 child.stderr.on('data',d=>stderr+=d);
 const result=await Promise.race([new Promise(resolve=>child.on('close',code=>resolve({code}))),sleep(35000).then(()=>({timeout:true}))]);
 if(result.timeout)child.kill('SIGKILL');
 if(result.timeout||result.code!==0)throw Error('Chromium '+JSON.stringify(result)+' '+stderr.slice(-1200));
 return stdout;
}
try{
 await sleep(1000);
 const dom=await chrome(['--dump-dom']);
 const status=dom.match(/<p id="status" role="status">([^<]*)<\/p>/)?.[1];
 if(!status?.startsWith('PASS: WorldView original PLANT/ROCK occlusion'))throw Error('Landscape occlusion: '+(status||'status missing')+' '+dom.slice(-1200));
 if((dom.match(/data-scene="/g)||[]).length!==4)throw Error('Expected four canvas captures');
 await chrome(['--screenshot='+screenshot]);
 const png=await readFile(screenshot);
 if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid PNG screenshot');
 console.log(status+' screenshot='+screenshot);
}finally{server.kill('SIGTERM')}
