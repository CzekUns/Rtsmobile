/* SKH-106: scope checker must reject deletes and renames crossing ownership. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const checker=fileURLToPath(new URL('../tools/check-workstream.mjs',import.meta.url));
function git(cwd,...args){
 return execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
}
function fixture(run){
 const cwd=mkdtempSync(join(tmpdir(),'skh-scope-'));
 const write=(p,s='fixture')=>{
  const dest=join(cwd,p);
  mkdirSync(dirname(dest),{recursive:true});
  writeFileSync(dest,s);
 };
 try{
  git(cwd,'init','-q');
  git(cwd,'config','user.email','ci@example.invalid');
  git(cwd,'config','user.name','SKH CI');
  write('outside.md','existing forbidden file');
  write('seven-kingdoms-html/docs/integration/old.md','existing allowed file');
  git(cwd,'add','.');
  git(cwd,'commit','-qm','baseline');
  const base=git(cwd,'rev-parse','HEAD');
  run({cwd,write,base});
  git(cwd,'add','-A');
  git(cwd,'commit','-qm','proposed change');
  return spawnSync(process.execPath,[checker],{
   cwd,encoding:'utf8',env:{...process.env,GITHUB_HEAD_REF:'agent/skh-integration/first-wiring',BASE_SHA:base}
  });
 }finally{
  rmSync(cwd,{recursive:true,force:true});
 }
}

test('integrator is allowed to add files inside owned directory',()=>{
 const result=fixture(({write})=>write('seven-kingdoms-html/docs/integration/new.md'));
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.match(result.stdout,/Scope PASSED/);
});

test('scope check rejects deletion outside the assigned directory',()=>{
 const result=fixture(({cwd})=>rmSync(join(cwd,'outside.md')));
 assert.equal(result.status,1,result.stdout);
 assert.match(result.stderr,/OUT OF SCOPE: outside\.md/);
});

test('scope check rejects rename from outside into assigned directory',()=>{
 const result=fixture(({cwd})=>renameSync(
  join(cwd,'outside.md'),join(cwd,'seven-kingdoms-html/docs/integration/renamed.md')
 ));
 assert.equal(result.status,1,result.stdout);
 assert.match(result.stderr,/outside\.md/);
});

test('scope check rejects rename from assigned directory to outside',()=>{
 const result=fixture(({cwd})=>renameSync(
  join(cwd,'seven-kingdoms-html/docs/integration/old.md'),join(cwd,'moved-out.md')
 ));
 assert.equal(result.status,1,result.stdout);
 assert.match(result.stderr,/moved-out\.md/);
});
