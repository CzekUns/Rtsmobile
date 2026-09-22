const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('mobile shell keeps viewport-fit, safe-area padding and bounded dialogs',()=>{
  const html=readFileSync(path.join(root,'index.html'),'utf8');
  const css=readFileSync(path.join(root,'app.css'),'utf8');
  assert.match(html,/viewport-fit=cover/);
  assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
  for(const id of ['characterDialog','skillsDialog','knowledgeDialog','logisticsDialog','communityDialog','tradeDialog','politicsDialog']){
    assert.match(css,new RegExp(`#${id}\\{[^}]*width:min\\([^}]*100vw[^}]*max-height:calc\\(100dvh`),`${id} must stay within the viewport`);
  }
});

test('diplomacy panel has touch targets and a single-column phone layout',()=>{
  const css=readFileSync(path.join(root,'app.css'),'utf8');
  assert.match(css,/#politicsDialog button\{[^}]*min-height:44px/);
  assert.match(css,/@media\(max-width:420px\)\{#politicsDialog\{[^}]*padding:12px[^}]*\}#politicsList\{grid-template-columns:1fr\}/);
});
