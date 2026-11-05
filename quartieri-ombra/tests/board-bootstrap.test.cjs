/* Regression for the visible board-only entry point. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
test('fresh board URL and old entry point serve the same board with explicit loading feedback',()=>{
 const a=fs.readFileSync(path.join(base,'board-preview.html'),'utf8');
 const b=fs.readFileSync(path.join(base,'board-1860.html'),'utf8');
 const home=fs.readFileSync(path.join(base,'index.html'),'utf8');
 assert.equal(a,b);assert.match(home,/href="\.\/board-1860\.html"/);
 for(const html of[a,b]){
   assert.match(html,/board-ready/);assert.match(html,/boardBootError/);
   assert.match(html,/board-world\.js\?v=20261104-b2/);
   assert.match(html,/board-preview\.js\?v=20261104-b2/);
 }
});
test('only a completed rendered scene dismisses the boot watchdog',()=>{
 const js=fs.readFileSync(path.join(base,'board-preview.js'),'utf8');
 assert.match(js,/drawMini\(\);\s*window\.__qoBoardPainted=true/);
 assert.match(js,/boardReady\.hidden=true/);
});
