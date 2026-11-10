import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldIgnoreGlobalShortcut} from '../playtest/keyboard-focus-guard.js';

const target = selector => ({closest(query) {
  return query.split(',').some(part => part.trim() === selector) ? {} : null;
}});
test('interactive elements retain native keyboard controls', () => {
  for (const selector of ['button','input','textarea','select','a[href]','[role="button"]','[role="textbox"]','[role="combobox"]'])
    assert.equal(shouldIgnoreGlobalShortcut(target(selector)),true,selector);
});
test('map canvas and document remain eligible for RTS shortcuts', () => {
  assert.equal(shouldIgnoreGlobalShortcut(target('canvas')),false);
  assert.equal(shouldIgnoreGlobalShortcut(null),false);
});
