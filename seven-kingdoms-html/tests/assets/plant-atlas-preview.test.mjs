import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPlantAtlasPreview} from '../../tools/assets/plant-atlas-preview.mjs';

const manifest={source:'the3dfxdude/7kaa',sourceCommit:'14e6fdfba9481af4dc3a54722614a608776e20bc',license:'GPL-2.0-or-later',width:32,height:16,bitmaps:[{id:1,plant:'OAKS',x:0,y:0,width:16,height:16,offsetX:-3,offsetY:2}]};
test('plant QA page includes native and double zoom without interpolation',()=>{
 const html=renderPlantAtlasPreview(manifest,'plant.png');
 assert.match(html,/width="32" height="16"/);
 assert.match(html,/width="64" height="32"/);
 assert.match(html,/image-rendering:pixelated/);
 assert.match(html,/Android checks: NOT RUN/);
 assert.match(html,/OAKS/);
});
test('plant QA rejects invalid atlas coordinates',()=>{
 assert.throws(()=>renderPlantAtlasPreview({...manifest,bitmaps:[{...manifest.bitmaps[0],x:20}]},'plant.png'),/outside atlas/);
});
test('plant QA escapes source labels and rejects HTML injection in image URL',()=>{
 assert.match(renderPlantAtlasPreview({...manifest,source:'<script>'},'plant.png'),/&lt;script&gt;/);
 assert.throws(()=>renderPlantAtlasPreview(manifest,'x" onerror="alert(1)'),/invalid/);
});
