import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('landscape HUD retains date and speed at the 850px breakpoint',()=>{
 const narrow=css.match(/@media\(max-width:850px\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(narrow,'850px breakpoint exists');
 assert.match(narrow,/\.datebox\{display:flex;flex:0 0 68px/);
 assert.doesNotMatch(narrow,/\.datebox\{display:none/);
 assert.match(html,/id="date"/);
 assert.match(html,/id="gameSpeed"/);
});

test('compact landscape keeps report scrolling, date and menu reachable',()=>{
 const compact=css.match(/@media\(max-width:620px\) and \(orientation:landscape\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(compact,'compact breakpoint exists');
 assert.match(compact,/\.topbar \.reports\{flex:1 1 0;min-width:48px/);
 assert.match(compact,/\.datebox\{flex-basis:58px/);
 assert.match(compact,/\.toptools #menuBtn\{width:43px/);
 assert.match(html,/id="reportsPrev"/);
 assert.match(html,/id="reportsNext"/);
});

test('physical landscape safe-area insets are applied on their own sides',()=>{
 const topbar=css.match(/\.topbar\{\s*position:absolute;z-index:30;[\s\S]*?\n\}/)?.[0];
 assert.ok(topbar,'fullscreen topbar rules exist');
 assert.match(topbar,/padding:2px max\(6px,env\(safe-area-inset-left\)\) 2px max\(6px,env\(safe-area-inset-right\)\)/);
});

test('report navigation respects keyboard focus and reduced motion',()=>{
 assert.match(css,/\.topbar \.reports:focus-within\{scrollbar-width:auto\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.topbar \.reports\{scroll-behavior:auto\}\}/);
 assert.match(css,/\.topbar \.reports button\{scroll-snap-align:start\}/);
});
