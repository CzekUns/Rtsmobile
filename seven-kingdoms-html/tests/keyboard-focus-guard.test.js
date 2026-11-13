import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldIgnoreGlobalShortcut} from '../playtest/keyboard-focus-guard.js';
const target=selector=>({closest(query){return query.split(',').some(part=>part.trim()===selector)?{}:null;}});
test('interactive focus preserves native keys',()=>{
 for(const selector of ['button','input','textarea','select','a[href]','[role="button"]','[role="textbox"]','[role="combobox"]'])assert.equal(shouldIgnoreGlobalShortcut(target(selector)),true);
});
test('world focus permits RTS shortcuts unless modal open',()=>{
 assert.equal(shouldIgnoreGlobalShortcut(target('canvas')),false);
 assert.equal(shouldIgnoreGlobalShortcut(null),false);
 assert.equal(shouldIgnoreGlobalShortcut(target('canvas'),true),true);
});
