/**
 * Seven Kingdoms HTML Edition: PR scope checker.
 * Applies only to branches matching agent/skh-...; the other Rtsmobile
 * projects and old work/T* branches remain unaffected.
 * Local use:
 *   GITHUB_HEAD_REF=agent/skh-towns/parity BASE_SHA=$(git merge-base origin/main HEAD) node seven-kingdoms-html/tools/check-workstream.mjs
 * GPL-2.0-only.
 */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const config=JSON.parse(readFileSync(new URL('../WORKSTREAMS.json',import.meta.url),'utf8'));
const branch=process.env.GITHUB_HEAD_REF||process.env.PR_BRANCH||'';
if(!branch.startsWith('agent/skh-')){
 console.log('Scope: ordinary branch, only native JS tests run.');
 process.exit(0);
}
const stream=config.streams.find(s=>branch.startsWith(s.branchPrefix));
if(!stream){
 console.error('Unknown Seven Kingdoms agent branch: '+branch);
 console.error('Accepted prefixes: '+config.streams.map(s=>s.branchPrefix).join(', '));
 process.exit(1);
}
const base=process.env.BASE_SHA||'origin/main';
let names;
try{
 names=execFileSync('git',['diff','--no-renames','--name-only','--diff-filter=ACMRD',base,'HEAD'],{encoding:'utf8'})
   .split(/\r?\n/).filter(Boolean);
}catch(error){
 console.error('Cannot read changed files. Fetch the base branch / supply BASE_SHA.');
 process.exit(1);
}
// --no-renames reports both sides of cross-boundary moves as delete + add.
// D also covers deletions; neither action is exempt from stream ownership.
const permitted=path=>stream.allowedPaths.some(prefix=>path===prefix||path.startsWith(prefix));
const violations=names.filter(path=>!permitted(path));
console.log('Stream: '+stream.id+' ('+branch+'), compared with '+base);
console.log('Changed: '+names.length+' file(s).');
if(violations.length){
 console.error('OUT OF SCOPE: '+violations.join(', '));
 console.error('Only these paths are allowed:\n'+stream.allowedPaths.join('\n'));
 console.error('Send changes to shared entrypoints via the SKH-106 integration lane.');
 process.exit(1);
}
console.log('Scope PASSED: '+names.length+' file(s) belong to '+stream.id+'.');
