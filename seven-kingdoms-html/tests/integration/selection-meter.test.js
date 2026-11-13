import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionMeter} from '../../selection-meter.js';
test('firm health and construction progress remain bounded',()=>{
 assert.match(selectionMeter('Integrità',150,100),/aria-valuenow="100"/);
 assert.match(selectionMeter('Integrità',-20,100),/width:0%/);
 assert.match(selectionMeter('Lavori',0.5,1),/width:50%/);
});
test('invalid saves do not generate NaN or Infinity in UI',()=>{
 const html=selectionMeter('Salute',NaN,0);
 assert.doesNotMatch(html,/NaN|Infinity/);
 assert.match(html,/aria-valuemax="100"/);
});
test('dynamic labels are HTML escaped',()=>{
 const html=selectionMeter('<script>"&',25);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;&quot;&amp;/);
});

test('decorative race meters do not create nested accessible widgets',()=>{
 const html=selectionMeter('Fedeltà Greci',62,100,{decorative:true});
 assert.match(html,/aria-hidden="true"/);
 assert.doesNotMatch(html,/role="progressbar"|aria-valuenow=/);
 assert.match(html,/Fedeltà Greci <strong>62\/100<\/strong>/);
 assert.match(html,/width:62%/);
});
test('standalone status meters remain accessible progressbars',()=>{
 const html=selectionMeter('Salute',45,100);
 assert.match(html,/role="progressbar"/);
 assert.match(html,/aria-valuenow="45"/);
 assert.doesNotMatch(html,/aria-hidden="true"/);
});
