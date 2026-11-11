import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const narrow = css.match(/@media\(max-width:850px\)\{([\s\S]*?)\n\}/)?.[1];
test('mobile landscape keeps date visible', () => {
  assert.ok(narrow, '850px breakpoint exists');
  assert.match(narrow, /\.datebox\{display:flex;/);
  assert.doesNotMatch(narrow, /\.datebox\{display:none/);
});
test('narrow landscape keeps reports scrollable and date/menu accessible', () => {
  const compact = css.match(/@media\(max-width:620px\) and \(orientation:landscape\)\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(compact, 'compact landscape breakpoint exists');
  assert.match(compact, /\.reports\{flex:1 1 0;min-width:48px/);
  assert.match(compact, /\.datebox\{flex-basis:58px/);
  assert.match(compact, /\.toptools #menuBtn\{width:43px/);
});

test('report navigation scrolls without hiding focus or trapping vertical gestures', () => {
  assert.match(css, /\.reports\{[^}]*overflow-x:auto;overflow-y:hidden;[^}]*scroll-snap-type:x proximity/);
  assert.match(css, /\.reports button\{scroll-snap-align:start\}/);
  assert.match(css, /\.reports:focus-within\{scrollbar-width:auto\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.reports\{scroll-behavior:auto\}\}/);
});
