import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
const browser=process.env.CHROME_BIN||'google-chrome';
const port=18743;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:'seven-kingdoms-html',stdio:'ignore'});
try {
 await sleep(1000);
 const url='http://127.0.0.1:'+port+'/tests/browser/hud-smoke.html';
 const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--virtual-time-budget=14000','--dump-dom',url];
 const child=spawn(browser,args,{stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',d=>stdout+=d);
 child.stderr.on('data',d=>stderr+=d);
 const result=await Promise.race([new Promise(resolve=>child.on('close',code=>resolve({code}))),sleep(30000).then(()=>({timeout:true}))]);
 if(result.timeout)child.kill('SIGKILL');
 const status=stdout.match(/<output id="result">([^<]*)<\/output>/)?.[1];
 console.log('Browser smoke:',status||'NO RESULT');
 if(result.timeout||result.code!==0||!status?.startsWith('PASS:')) {
  console.error('Browser failure:',JSON.stringify(result),stderr.slice(-2000));
  process.exitCode=1;
 }
} finally {server.kill('SIGTERM')}
