import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
test('standalone QA viewer script parses, never modifies the gameplay renderer, and requires real screenshot',async()=>{
 const html=await readFile(new URL('../../assets/previews/qa-compare.html',import.meta.url),'utf8');
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,'must provide standalone inspector script');
 assert.doesNotThrow(()=>new Script(match[1],{filename:'qa-compare.html'}));
 assert.match(html,/NORMAN-M-1x\.png/);
 assert.match(html,/BASE-NORMAN-phases-1x\.png/);
 assert.match(html,/imageSmoothingEnabled=false/,'integer zoom must use nearest-neighbor scaling');
 assert.match(html,/type="file" id="reference"/);
 assert.match(html,/visuallyVerified:Boolean\(reference&&checklist\.every\(Boolean\)\)/);
 assert.doesNotMatch(html,/Game\.prototype|localStorage|sessionStorage|fetch\(/,'cannot mutate game or claim remote screenshot');
});
