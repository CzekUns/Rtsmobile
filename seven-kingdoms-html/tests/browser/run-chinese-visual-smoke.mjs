import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

const browser=process.env.CHROME_BIN||'google-chrome';
const port=18749;
const dir=await mkdtemp(join(tmpdir(),'skh-chinese-qa-'));
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:'seven-kingdoms-html',stdio:'ignore'});
async function chrome(args,url){
 const child=spawn(browser,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--hide-scrollbars','--window-size=1100,900','--virtual-time-budget=12000',...args,url],{stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',d=>stdout+=d);
 child.stderr.on('data',d=>stderr+=d);
 const result=await Promise.race([new Promise(resolve=>child.on('close',code=>resolve({code}))),sleep(30000).then(()=>({timeout:true}))]);
 if(result.timeout)child.kill('SIGKILL');
 if(result.timeout||result.code!==0)throw Error('Chromium '+JSON.stringify(result)+' '+stderr.slice(-1000));
 return stdout;
}
const screenshotHashes=new Map();
try{
 await sleep(1000);
 for(const zoom of [1,2]){
  for(let mode=0;mode<5;mode++){
   const url=`http://127.0.0.1:${port}/assets/previews/chinese-base-qa.html?mode=${mode}&zoom=${zoom}`;
   const dom=await chrome(['--dump-dom'],url);
   if(!new RegExp(`id="status"[^>]*data-result="drawn"[^>]*data-mode="${mode}"[^>]*data-zoom="${zoom}"`).test(dom))
    throw Error(`Chinese browser render failed mode=${mode} zoom=${zoom}: `+dom.slice(-1200));
   const changed=dom.match(/id="status"[^>]*data-changed-pixels="(\d+)"/);
   if(!changed||Number(changed[1])<=0)throw Error(`Chinese Canvas produced no changed pixels mode=${mode} zoom=${zoom}`);
   if(!dom.includes('the3dfxdude/7kaa'))throw Error('Missing upstream attribution');
   if(mode===3){
    const path=process.env[`CHINESE_QA_SCREENSHOT_${zoom}X`]||join(dir,`chinese-${zoom}x.png`);
    await chrome(['--screenshot='+path],url);
    const png=await readFile(path);
    if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid screenshot PNG');
    if(png.length<1000)throw Error('Screenshot suspiciously small: '+png.length+' bytes');
    const hash=createHash('sha256').update(png).digest('hex');
    screenshotHashes.set(zoom,hash);
    console.log('Screenshot '+path+' sha256='+hash+' bytes='+png.length);
   }
  }
 }
 if(screenshotHashes.size!==2||screenshotHashes.get(1)===screenshotHashes.get(2))throw Error('Chinese screenshots at 1x and 2x are identical or missing');
 console.log('PASS: Chromium HTTP Chinese original PNG gallery, all 5 modes at 1x/2x; distinct screenshot hashes');
}finally{
 server.kill('SIGTERM');
 if(!process.env.CHINESE_QA_SCREENSHOT_1X&&!process.env.CHINESE_QA_SCREENSHOT_2X)await rm(dir,{recursive:true,force:true});
}
