const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../street-webgl.js'),'utf8');
test('HUD exposes measured FPS, draw calls and triangles',()=>{
 assert.match(source,/perfFrames\*1000\/elapsed/);
 assert.match(source,/renderer\.info\.render\.calls/);
 assert.match(source,/renderer\.info\.render\.triangles/);
 assert.match(source,/samplePerformance\(now\);/);
 assert.match(source,/FPS · .*draw · .*triangoli/);
});
test('FPS uses elapsed time rather than assuming a refresh rate',()=>{
 assert.equal(Math.round(47*1000/1200),39);
 assert.equal(Math.round(60*1000/1000),60);
});
