import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const code=readFileSync(new URL('../game.js',import.meta.url),'utf8');

test('right sidebar exclusively contains contextual selection information and commands',()=>{
 const sidebar=html.split('<aside class="sidebar"')[1]?.split('</aside>')[0];
 assert.ok(sidebar,'sidebar must exist');
 for(const id of ['selectionTitle','selectionMeta','selectionInfo','selectionActions'])
  assert.match(sidebar,new RegExp('id="'+id+'"'));
 assert.doesNotMatch(sidebar,/id="reportTitle"|id="reportBody"/);
 assert.match(css,/\.selection-actions\{flex:1 1 auto;/);
 assert.match(css,/\.selection-actions button\{[^}]*width:100%/);
});

test('reports are on demand, in a dialog outside the sidebar',()=>{
 const afterStage=html.split('</div>\n<dialog id="reportDialog"')[1];
 assert.ok(afterStage,'report dialog follows the stage');
 assert.match(afterStage,/id="reportTitle"/);
 assert.match(afterStage,/id="reportBody"/);
 assert.match(afterStage,/id="closeReport"/);
 assert.match(code,/let report=null,/);
 assert.match(code,/if\(!\$\('reportDialog'\)\.open\)\$\('reportDialog'\)\.showModal\(\)/);
 assert.doesNotMatch(html,/data-report="towns"[^>]*class="active"/);
});

test('choosing a report item or building returns to game selection',()=>{
 assert.match(code,/function select\(id\)\{[\s\S]*?selection=id;\s*closeReport\(\);\s*renderPanel\(\);/);
 assert.match(code,/if\(build\)\{closeReport\(\);buildMode\(build\.dataset\.build\);\}/);
 assert.match(code,/\$\('closeReport'\)\.addEventListener\('click',closeReport\)/);
 assert.match(code,/\$\('reportDialog'\)\.addEventListener\('close'/);
 assert.match(code,/game\.save\(saveKey\);closeReport\(\);renderPanel\(\);status\('Nuova partita avviata\.'/);
});

test('report commands remain wired through the top bar and F keys',()=>{
 for(const key of ['towns','economy','military','news'])
  assert.match(html,new RegExp('data-report="'+key+'"'));
 assert.match(code,/if\(r\)setReport\(r\.dataset\.report\)/);
 assert.match(code,/if\(e\.key\.startsWith\('F'\)[^\n]*setReport\(reports\[index-1\]\)/);
 assert.match(code,/if\(\$\('reportBody'\)\.innerHTML!==html\)\$\('reportBody'\)\.innerHTML=html/);
});
